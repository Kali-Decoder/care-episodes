"""Intake agent (ADK): read a prescription document, return structured fields.

An ADK LlmAgent backed by Gemini 3.5 Flash reads the document directly (natively
multimodal — image/PDF and prompt in one turn), constrained to the `Extraction`
schema via ADK `output_schema`. It handles handwritten Indian prescriptions and
returns `readable=False` rather than guessing when it can't. `to_prescription()`
maps the raw extraction onto the contract `Prescription` model.

Callers should load .env (for GOOGLE_CLOUD_PROJECT etc.) before calling.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from google.genai import types
from pydantic import BaseModel, Field

from agents.adk import make_agent, run_structured
from models import Medicine, Prescription, PrescriptionTest

MIME_BY_SUFFIX = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
}


class ExtractedMedicine(BaseModel):
    name: str
    dose: str = Field(default="", description="e.g. '100mg'. Empty if not written.")
    frequency: str = Field(default="", description="e.g. 'once daily'. Empty if not written.")


class ExtractedTest(BaseModel):
    test_code: str = Field(description="Short uppercase code, e.g. CBC, FERRITIN, TSH, HBA1C.")
    display_name: str = Field(description="Full human-readable test name.")
    urgency: Literal["urgent", "routine"] = Field(
        description="'urgent' only if the prescription clearly signals it (STAT, "
        "urgent, ASAP, or a clinically time-critical test). Otherwise 'routine'."
    )


class Extraction(BaseModel):
    """Raw model output — a superset of the contract Prescription (adds `readable`)."""

    readable: bool = Field(
        description="False if the document is too blurry/incomplete to extract "
        "reliably, or is not a prescription at all."
    )
    doctor: str = Field(default="", description="Prescribing doctor's name, or empty.")
    date: str = Field(default="", description="Prescription date as YYYY-MM-DD, or empty.")
    diagnosis: str = Field(default="", description="Diagnosis / clinical impression, or empty.")
    medicines: list[ExtractedMedicine] = Field(default_factory=list)
    tests: list[ExtractedTest] = Field(default_factory=list)


PROMPT = """You are a careful medical intake assistant. Read this doctor's
prescription (it may be handwritten and in an Indian clinical style) and extract
the structured fields defined by the response schema.

Rules:
- Extract only what is actually written. Do not invent tests, medicines, or a
  diagnosis that is not on the page.
- If the image is too unclear to read reliably, or it is not a prescription, set
  readable=false and leave the other fields empty rather than guessing.
- Tests are lab/diagnostic investigations ordered (blood tests, imaging, etc.),
  not the medicines prescribed.
- Mark a test 'urgent' only when the prescription signals urgency (STAT, urgent,
  ASAP) or it is clinically time-critical; otherwise 'routine'.
- Normalise the date to YYYY-MM-DD."""


class IntakeError(Exception):
    """Raised when the model call fails outright (network/model/region)."""


def detect_mime(path: Path) -> str:
    mime = MIME_BY_SUFFIX.get(path.suffix.lower())
    if not mime:
        raise IntakeError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported: {', '.join(sorted(MIME_BY_SUFFIX))}"
        )
    return mime


def extract_prescription(
    file_path: str,
    *,
    model: str | None = None,
    location: str | None = None,
) -> Extraction:
    """Read the prescription file and return a structured Extraction.

    Raises IntakeError on an outright model failure. A successfully-read-but-
    illegible document comes back as Extraction(readable=False), which the caller
    turns into the NEEDS_HUMAN state — that is not an exception.
    """
    path = Path(file_path)
    mime = detect_mime(path)
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        raise IntakeError("GOOGLE_CLOUD_PROJECT not set (load .env first).")

    model = model or os.getenv("VERTEX_MODEL_FAST", "gemini-3.5-flash")
    agent = make_agent("intake_agent", model, PROMPT, output_schema=Extraction, location=location)
    parts = [
        types.Part.from_bytes(data=path.read_bytes(), mime_type=mime),
        types.Part.from_text(text="Extract this prescription."),
    ]
    try:
        return run_structured(agent, parts, Extraction)
    except Exception as exc:  # noqa: BLE001 — wrap with a hint for region issues
        hint = ""
        if "NOT_FOUND" in str(exc) or "404" in str(exc):
            hint = " (model may not serve in this region; try location='global')"
        raise IntakeError(f"Gemini call failed{hint}: {exc}") from exc


def to_prescription(x: Extraction, source_file_url: str | None = None) -> Prescription:
    """Map a raw Extraction onto the contract Prescription model."""
    return Prescription(
        doctor=x.doctor,
        date=x.date,
        diagnosis=x.diagnosis,
        medicines=[Medicine(**m.model_dump()) for m in x.medicines],
        tests=[PrescriptionTest(**t.model_dump()) for t in x.tests],
        source_file_url=source_file_url,
    )
