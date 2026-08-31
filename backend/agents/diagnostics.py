"""Diagnostics agent: read a lab report, compare against history, decide.

The agent that makes this project agentic rather than a form-filler. Steps:

  1. Extract each value AND the reference range printed on the report itself
     (build-plan §6.1 — no medical reference DB needed). Flash, multimodal.
  2. Compute flag (in/out of range) and trend (vs prior readings) — pure code,
     deterministic, no LLM.
  3. Decide significance with Gemini Pro (§5 — the one place reasoning quality
     matters): normal / attention / urgent, and whether a consult is warranted.
  4. Medical safety (§6.5): every analysis carries a fixed disclaimer; an
     unreadable report escalates to NEEDS_HUMAN rather than being guessed at.

Model routing: extraction on VERTEX_MODEL_FAST, the significance call on
VERTEX_MODEL_SMART. Never call Pro in a loop.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from google.genai import types
from pydantic import BaseModel, Field

from agents.adk import make_agent, run_structured
from tools import calendar, gmail, google_oauth, timeutils
from models import (
    Analysis,
    Consultation,
    Report,
    ReportValue,
    ResultHistoryPoint,
    iso_now,
)
from state import idempotency

# The safety line is a constant — never let the model author its own disclaimer.
DISCLAIMER = "This is not medical advice. A doctor should review these results."

_STABLE_TOLERANCE = 0.02  # ±2%: smaller changes read as "stable", not a trend.


class IntakeError(Exception):
    """Raised when the model call fails outright (network/model/region)."""


# ----------------------------- 1. extraction --------------------------------

MIME_BY_SUFFIX = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
}


class ExtractedReportValue(BaseModel):
    test_code: str = Field(description="Short uppercase code, e.g. HB, TSH, FERRITIN.")
    display_name: str = Field(description="Full test name as printed.")
    value: float = Field(description="The measured numeric result.")
    unit: str = Field(description="Unit as printed, e.g. 'g/dL'.")
    ref_low: float = Field(description="Lower bound of the reference range printed on the report.")
    ref_high: float = Field(description="Upper bound of the reference range printed on the report.")


class ReportExtraction(BaseModel):
    readable: bool = Field(
        description="False if the report is too unclear to extract reliably, or "
        "is not a lab report."
    )
    values: list[ExtractedReportValue] = Field(default_factory=list)


_EXTRACT_PROMPT = """You are a careful medical data extractor. Read this lab
report and extract every test result, together with the reference (normal) range
printed next to it on the report.

Rules:
- Extract EVERY individual test row that has a numeric value and a printed
  reference range — one entry per printed line. This includes each component of a
  differential/blood count (e.g. neutrophils, lymphocytes, monocytes, eosinophils,
  basophils) and each item of a lipid or other panel, as its OWN separate entry.
- Do NOT group, merge, summarise, or skip rows. Be exhaustive and consistent.
- Use the reference range printed on THIS report — do not use outside knowledge.
- Preserve the numeric value and unit exactly as printed.
- Extract only numeric results that have a printed reference range.
- If the report is too unclear to read reliably, or is not a lab report, set
  readable=false and return no values rather than guessing."""


def _detect_mime(path: Path) -> str:
    mime = MIME_BY_SUFFIX.get(path.suffix.lower())
    if not mime:
        raise IntakeError(f"Unsupported file type '{path.suffix}'.")
    return mime


def extract_report(
    file_path: str, *, model: str | None = None, location: str | None = None
) -> ReportExtraction:
    """Read a lab report file into structured values + ref ranges (ADK, Flash)."""
    path = Path(file_path)
    mime = _detect_mime(path)
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        raise IntakeError("GOOGLE_CLOUD_PROJECT not set (load .env first).")
    model = model or os.getenv("VERTEX_MODEL_FAST", "gemini-3.5-flash")
    agent = make_agent("diagnostics_extractor", model, _EXTRACT_PROMPT,
                       output_schema=ReportExtraction, location=location)
    parts = [
        types.Part.from_bytes(data=path.read_bytes(), mime_type=mime),
        types.Part.from_text(text="Extract the lab report values."),
    ]
    try:
        return run_structured(agent, parts, ReportExtraction)
    except Exception as exc:  # noqa: BLE001
        hint = " (try location='global')" if "NOT_FOUND" in str(exc) or "404" in str(exc) else ""
        raise IntakeError(f"Report extraction failed{hint}: {exc}") from exc


# --------------------- 2. deterministic flag + trend ------------------------


def compute_flag(value: float, ref_low: float, ref_high: float) -> Literal["low", "normal", "high"]:
    if value < ref_low:
        return "low"
    if value > ref_high:
        return "high"
    return "normal"


def compute_trend(
    value: float, prior_values: list[float]
) -> Literal["rising", "falling", "stable", "first_reading"]:
    """Direction relative to the most recent prior reading (±2% = stable)."""
    if not prior_values:
        return "first_reading"
    last = prior_values[-1]
    tolerance = max(abs(last) * _STABLE_TOLERANCE, 1e-9)
    if value - last > tolerance:
        return "rising"
    if last - value > tolerance:
        return "falling"
    return "stable"


def build_report(
    extraction: ReportExtraction,
    store,
    patient_id: str,
    *,
    received_at: str | None = None,
    source_file_url: str | None = None,
) -> Report:
    """Turn a raw extraction into a contract Report: flags, trends vs history,
    and a history series (prior points + this reading) for the UI sparkline."""
    received_at = received_at or iso_now()
    reading_date = received_at[:10]  # YYYY-MM-DD

    values: list[ReportValue] = []
    for ev in extraction.values:
        prior = store.get_history(patient_id, ev.test_code)
        trend = compute_trend(ev.value, [p.value for p in prior])
        history = [*prior, ResultHistoryPoint(date=reading_date, value=ev.value)]
        values.append(
            ReportValue(
                test_code=ev.test_code,
                display_name=ev.display_name,
                value=ev.value,
                unit=ev.unit,
                ref_low=ev.ref_low,
                ref_high=ev.ref_high,
                flag=compute_flag(ev.value, ev.ref_low, ev.ref_high),
                trend=trend,
                history=history,
            )
        )
    return Report(received_at=received_at, source_file_url=source_file_url, values=values)


def persist_history(report: Report, store, patient_id: str) -> None:
    """Save this report's readings so the NEXT episode can compare against them."""
    for v in report.values:
        store.append_history(
            patient_id, v.test_code, ResultHistoryPoint(date=report.received_at[:10], value=v.value)
        )


# ------------------------ 3. significance (Pro) -----------------------------


class _AnalysisOut(BaseModel):
    severity: Literal["normal", "attention", "urgent"]
    consult_needed: bool
    findings: list[str] = Field(
        description="Short factual observations about what is out of range or trending."
    )
    patient_summary: str = Field(
        description="2-3 plain-language sentences a patient can understand. Summarise "
        "and flag; never diagnose."
    )


_SIGNIFICANCE_PROMPT = """You are a careful medical assistant helping a patient
understand lab results. You SUMMARISE and FLAG; you never diagnose or prescribe.

Given the results below (each with its printed reference range, an in/out-of-range
flag, and the trend versus the patient's own prior readings), decide:
- severity: 'normal' (all in range, no adverse trend), 'attention' (something out
  of range or trending the wrong way, worth a doctor's review), or 'urgent'
  (markedly abnormal).
- consult_needed: true if a follow-up consultation is warranted.
- findings: short factual observations.
- patient_summary: 2-3 calm, plain-language sentences.

Be conservative: when a value is out of range or clearly trending adverse,
recommend a consult. Do not invent values or diagnoses.

RESULTS:
"""


def decide_significance(
    report: Report, *, model: str | None = None, location: str | None = None
) -> Analysis:
    """The significance decision — Gemini Pro. Returns a contract Analysis with a
    fixed safety disclaimer appended (never model-authored)."""
    compact = [
        {
            "test": v.display_name,
            "value": v.value,
            "unit": v.unit,
            "ref_low": v.ref_low,
            "ref_high": v.ref_high,
            "flag": v.flag,
            "trend": v.trend,
            "prior_readings": [p.value for p in v.history[:-1]],
        }
        for v in report.values
    ]
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        raise IntakeError("GOOGLE_CLOUD_PROJECT not set (load .env first).")
    model = model or os.getenv("VERTEX_MODEL_SMART", "gemini-3.1-pro-preview")
    # The smart model may serve from a different region than the fast one
    # (e.g. Pro only on `global`), so it has its own location knob.
    location = location or os.getenv("VERTEX_MODEL_SMART_LOCATION") or os.getenv("ADK_LOCATION", "global")
    agent = make_agent("significance_agent", model, _SIGNIFICANCE_PROMPT,
                       output_schema=_AnalysisOut, location=location)
    parts = [types.Part.from_text(text=json.dumps(compact, indent=2))]
    try:
        out = run_structured(agent, parts, _AnalysisOut)
    except Exception as exc:  # noqa: BLE001
        hint = " (try location='global')" if "NOT_FOUND" in str(exc) or "404" in str(exc) else ""
        raise IntakeError(f"Significance decision failed{hint}: {exc}") from exc

    return Analysis(
        severity=out.severity,
        consult_needed=out.consult_needed,
        findings=out.findings,
        patient_summary=out.patient_summary,
        disclaimer=DISCLAIMER,
    )


# --------------------------- 4. consult booking -----------------------------


def book_consult(
    episode, store, *, now: str | None = None
) -> Consultation | None:
    """Request a follow-up consult, idempotency-guarded (one per episode).

    Returns None if already booked (replay) — that is the guard working. The
    proposed slot is the next day at 5:00 PM IST.
    """
    at = now or iso_now()
    if not idempotency.claim(store, episode.episode_id, "CONSULT"):
        return None
    doctor = episode.prescription.doctor if episode.prescription else ""
    return Consultation(
        requested_at=at,
        doctor=doctor or "your doctor",
        proposed_slot=timeutils.next_day_slot(at, hour=17),  # next day 5:00 PM IST
        status="requested",
    )


def send_consult_request(episode, store) -> dict | None:
    """Email the follow-up consultation request (to the same address as lab bookings),
    with the appointment time shown in friendly IST. Idempotency-guarded so a replay
    can't re-send. Graceful no-op if OAuth isn't configured; failures are captured,
    not raised."""
    if not google_oauth.configured():
        return None
    consult = episode.consultation
    if consult is None:
        return None
    if not idempotency.claim(store, episode.episode_id, "CONSULT_NOTIFY"):
        return None

    when = timeutils.friendly_ist(consult.proposed_slot)
    findings = episode.analysis.findings if episode.analysis else []
    findings_lines = "\n".join(f"  •  {f}" for f in findings) or "  •  A change in your results warrants review."
    body = (
        f"Hello,\n\n"
        f"Based on your recent lab results, the Care Episode Agent has requested a "
        f"follow-up consultation.\n\n"
        f"Doctor:       {consult.doctor}\n"
        f"Appointment:  {when}\n\n"
        f"Why:\n{findings_lines}\n\n"
        f"Please confirm this appointment.\n\n"
        f"Thank you,\nCare Episode Agent\n\n"
        f"— Automated request. This is not medical advice; the doctor makes the final decision."
    )
    result: dict = {"when": when}
    recipient = os.getenv("NOTIFY_EMAIL")
    if recipient:
        try:
            result["message_id"] = gmail.send_email(
                recipient, f"Follow-up consultation — {when}", body)
            result["to"] = recipient
        except gmail.GmailError as exc:
            result["email_error"] = str(exc)[:150]
    try:
        hold = calendar.create_hold(
            f"Doctor consultation — {consult.doctor}", consult.proposed_slot, description=body)
        result.update(event_id=hold["event_id"], html_link=hold["html_link"])
    except calendar.CalendarError as exc:
        result["calendar_error"] = str(exc)[:150]
    return result or None
