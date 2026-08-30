"""Root coordinator (build-plan §3): reads episode state, runs the right leg,
writes state back after each step. The agents do the work; this decides order
and owns the transitions. The API and the demo scripts both drive the episode
through here, so the flow lives in exactly one place.

Every function persists after each transition (build-plan §4: state is written
before the next step, so a crash resumes cleanly). An optional `on_step` narrator
lets the CLI demos print progress without the coordinator knowing about stdout.
"""

from __future__ import annotations

from typing import Callable

from agents import diagnostics
from agents.intake import IntakeError, extract_prescription, to_prescription
from agents.logistics import request_bookings, send_booking_request, shortlist_labs
from models import Episode, EpisodeError, iso_now
from state import idempotency
from state.machine import log, transition
from tools import storage

Narrator = Callable[[str], None]


def _noop(_msg: str) -> None:
    pass


def _require(store, episode_id: str) -> Episode:
    ep = store.get(episode_id)
    if ep is None:
        raise KeyError(episode_id)
    return ep


# ------------------------------- intake -------------------------------------


def run_intake(
    store, episode_id: str, prescription_path: str, *,
    source_file_url: str | None = None, on_step: Narrator = _noop,
) -> Episode:
    """PRESCRIPTION_RECEIVED -> TESTS_IDENTIFIED, or -> NEEDS_HUMAN."""
    ep = _require(store, episode_id)
    on_step("intake agent reading prescription...")
    try:
        x = extract_prescription(prescription_path)
    except IntakeError as exc:
        ep.error = EpisodeError(
            code="EXTRACTION_FAILED", message=str(exc),
            action_hint="Retry; if it persists, check the Vertex model/region.",
        )
        transition(ep, "NEEDS_HUMAN", "intake_agent", "extraction_failed")
        store.put(ep)
        on_step("extraction failed -> NEEDS_HUMAN")
        return ep

    if not x.readable:
        ep.error = EpisodeError(
            code="PRESCRIPTION_UNREADABLE",
            message="The prescription could not be read clearly.",
            action_hint="Try uploading a clearer photo in good light.",
        )
        transition(ep, "NEEDS_HUMAN", "intake_agent", "prescription_unreadable")
        store.put(ep)
        on_step("unreadable -> NEEDS_HUMAN")
        return ep

    ep.prescription = to_prescription(x, source_file_url=source_file_url)
    urgent = sum(1 for t in x.tests if t.urgency == "urgent")
    ep.summary_line = f"{len(x.tests)} test(s) ordered" + (f", {urgent} urgent" if urgent else "")
    transition(
        ep, "TESTS_IDENTIFIED", "intake_agent", "extracted_tests",
        detail=f"{len(x.tests)} tests found, {urgent} urgent",
    )
    store.put(ep)
    on_step(f"TESTS_IDENTIFIED: {len(x.tests)} tests, {urgent} urgent")
    return ep


# ------------------------------ logistics -----------------------------------


def run_logistics(store, episode_id: str, *, on_step: Narrator = _noop) -> Episode:
    """TESTS_IDENTIFIED -> LABS_SHORTLISTED -> BOOKING_REQUESTED -> AWAITING_REPORT."""
    ep = _require(store, episode_id)

    ep.labs = shortlist_labs(ep)
    selected = next((l for l in ep.labs if l.selected), None)
    if selected is None:
        ep.error = EpisodeError(
            code="NO_LABS_FOUND",
            message="No diagnostic lab could be found nearby.",
            action_hint="We'll widen the search and a human will follow up.",
        )
        transition(ep, "NEEDS_HUMAN", "logistics_agent", "no_labs_found")
        store.put(ep)
        on_step("no labs found -> NEEDS_HUMAN")
        return ep
    transition(
        ep, "LABS_SHORTLISTED", "logistics_agent", "found_labs",
        detail=f"{len(ep.labs)} lab(s); selected {selected.name}",
    )
    store.put(ep)
    on_step(f"LABS_SHORTLISTED: {selected.name}")

    ep.bookings = request_bookings(ep, store)
    transition(
        ep, "BOOKING_REQUESTED", "logistics_agent", "requested_booking",
        detail=f"Requested {len(ep.bookings)} test(s) at {selected.name}",
    )
    store.put(ep)
    on_step(f"BOOKING_REQUESTED: {len(ep.bookings)} booking(s)")

    # Real external actions: booking-request email + tentative calendar hold.
    # No-op if OAuth isn't configured; failures are logged, never fatal.
    notify = send_booking_request(ep, store)
    if notify:
        if notify.get("message_id"):
            log(ep, "logistics_agent", "sent_booking_email",
                detail=f"to {notify.get('to','')} (msg {notify['message_id'][:12]})")
        if notify.get("event_id"):
            log(ep, "logistics_agent", "calendar_hold", detail=notify.get("html_link", ""))
        if notify.get("email_error") or notify.get("calendar_error"):
            log(ep, "logistics_agent", "booking_notify_partial",
                detail=notify.get("email_error") or notify.get("calendar_error"))
        store.put(ep)
        on_step("booking email + calendar hold sent")

    transition(
        ep, "AWAITING_REPORT", "logistics_agent", "awaiting_report",
        detail="Booking requested; waiting for lab report",
    )
    store.put(ep)
    on_step("AWAITING_REPORT: waiting for report")
    return ep


def process_new_episode(
    store, episode_id: str, prescription_path: str, *,
    source_file_url: str | None = None, on_step: Narrator = _noop,
) -> Episode:
    """The full intake+logistics arc run after a prescription is uploaded."""
    ep = run_intake(store, episode_id, prescription_path,
                    source_file_url=source_file_url, on_step=on_step)
    if ep.state == "NEEDS_HUMAN":
        return ep
    return run_logistics(store, episode_id, on_step=on_step)


# ------------------------------ diagnostics ---------------------------------


def mark_report_received(
    store, episode_id: str, *, upload_name: str = "report",
    actor: str = "patient", action: str = "uploaded_report",
    received_at: str | None = None, on_step: Narrator = _noop,
) -> Episode:
    """AWAITING_REPORT -> REPORT_RECEIVED. `actor`/`action` let the scheduler mark
    an autonomous pickup ('scheduler'/'retrieved_report') vs a manual upload."""
    ep = _require(store, episode_id)
    transition(ep, "REPORT_RECEIVED", actor, action, detail=upload_name, now=received_at)
    store.put(ep)
    on_step("REPORT_RECEIVED")
    return ep


def ingest_report(
    store, episode_id: str, *, report_path: str | None = None,
    extraction: "diagnostics.ReportExtraction | None" = None,
    source_file_url: str | None = None, received_at: str | None = None,
    on_step: Narrator = _noop,
) -> Episode:
    """REPORT_RECEIVED -> TRENDS_ANALYZED -> (ANOMALY_FOUND->CONSULT_REQUESTED | NORMAL).

    Extraction may be passed in (demo/tests) or read from `report_path` (Flash).
    """
    ep = _require(store, episode_id)
    received_at = received_at or iso_now()

    if extraction is None:
        try:
            extraction = diagnostics.extract_report(report_path)
        except IntakeError as exc:
            ep.error = EpisodeError(
                code="EXTRACTION_FAILED", message=str(exc),
                action_hint="Retry; if it persists, check the Vertex model/region.",
            )
            transition(ep, "NEEDS_HUMAN", "diagnostics_agent", "report_extraction_failed")
            store.put(ep)
            return ep

    if not extraction.readable:
        ep.error = EpisodeError(
            code="REPORT_UNREADABLE",
            message="The lab report could not be read clearly.",
            action_hint="Try uploading a clearer scan or photo.",
        )
        transition(ep, "NEEDS_HUMAN", "diagnostics_agent", "report_unreadable")
        store.put(ep)
        on_step("report unreadable -> NEEDS_HUMAN")
        return ep

    report = diagnostics.build_report(
        extraction, store, ep.patient_id,
        received_at=received_at, source_file_url=source_file_url,
    )
    ep.report = report
    transition(
        ep, "TRENDS_ANALYZED", "diagnostics_agent", "compared_history",
        detail=f"{len(report.values)} value(s) compared against history",
    )
    store.put(ep)
    on_step(f"TRENDS_ANALYZED: {len(report.values)} value(s)")

    on_step("significance decision (Pro)...")
    analysis = diagnostics.decide_significance(report)
    ep.analysis = analysis
    on_step(f"severity={analysis.severity}, consult_needed={analysis.consult_needed}")

    if analysis.consult_needed:
        transition(
            ep, "ANOMALY_FOUND", "diagnostics_agent", "flagged_anomaly",
            detail="; ".join(analysis.findings) or "value out of range / adverse trend",
        )
        consult = diagnostics.book_consult(ep, store, now=received_at)
        ep.consultation = consult
        transition(
            ep, "CONSULT_REQUESTED", "diagnostics_agent", "requested_consult",
            detail=(f"with {consult.doctor} @ {consult.proposed_slot}" if consult else "already requested"),
        )
    else:
        transition(ep, "NORMAL", "diagnostics_agent", "all_clear", detail="no action needed")

    diagnostics.persist_history(report, store, ep.patient_id)
    store.put(ep)
    on_step(ep.state)
    return ep


# -------------------------- scheduler + retry -------------------------------

def tick(store, *, on_step: Narrator = _noop) -> dict:
    """Cloud Scheduler wake-up. For each waiting episode:

    - AWAITING_REPORT: check the lab inbox (GCS). If a report was delivered, ingest
      it AUTONOMOUSLY — no human upload — running the full diagnostics leg. This is
      the autonomous report pickup that removes the manual step.
    - otherwise: log a heartbeat.

    Returns {"picked_up": [...], "nudged": [...]}. Safe against double-fire: a
    per-episode idempotency claim guards the pickup.
    """
    picked_up: list[str] = []
    nudged: list[str] = []

    for ep in store.list_by_states(["AWAITING_REPORT"]):
        report = _try_pickup_report(store, ep, on_step=on_step)
        if report is not None:
            picked_up.append(ep.episode_id)
        else:
            log(ep, "scheduler", "tick", detail=f"checked; still {ep.state}, no report yet")
            store.put(ep)
            nudged.append(ep.episode_id)

    for ep in store.list_by_states(["BOOKING_REQUESTED"]):
        log(ep, "scheduler", "tick", detail=f"checked; still {ep.state}")
        store.put(ep)
        nudged.append(ep.episode_id)

    return {"picked_up": picked_up, "nudged": nudged}


def _try_pickup_report(store, ep: Episode, *, on_step: Narrator = _noop) -> Episode | None:
    """If a report has been delivered to this patient's lab inbox, ingest it
    autonomously. Returns the updated episode, or None if nothing to pick up."""
    try:
        reports = storage.list_reports(ep.patient_id)
    except Exception as exc:  # noqa: BLE001 — inbox unreachable shouldn't crash the tick
        on_step(f"inbox check failed for {ep.patient_id}: {exc}")
        return None
    if not reports:
        return None

    # Guard against a double-fire ingesting the same delivery twice.
    if not idempotency.claim(store, ep.episode_id, "REPORT_PICKUP"):
        return None

    import os
    import tempfile

    blob = reports[0]
    tmp_path = None
    try:
        data = storage.download(blob)
        suffix = os.path.splitext(blob)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        on_step(f"lab report delivered for {ep.patient_id} — picking it up autonomously")
        mark_report_received(
            store, ep.episode_id, upload_name=os.path.basename(blob),
            actor="scheduler", action="retrieved_report",
        )
        result = ingest_report(
            store, ep.episode_id, report_path=tmp_path,
            source_file_url=f"gs://{storage.bucket_name()}/{blob}", on_step=on_step,
        )
        storage.delete(blob)  # processed — don't pick it up again
        on_step(f"ingested report for {ep.episode_id} -> {result.state}")
        return result
    except Exception as exc:  # noqa: BLE001
        on_step(f"autonomous pickup failed for {ep.episode_id}: {exc}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def retry(store, episode_id: str, *, on_step: Narrator = _noop) -> Episode:
    """Reset a NEEDS_HUMAN episode so work can resume (contract retry endpoint).

    Clears the error and returns to PRESCRIPTION_RECEIVED; the caller decides
    whether to reprocess (e.g. if the original file is still available).
    """
    ep = _require(store, episode_id)
    if ep.state != "NEEDS_HUMAN":
        return ep
    ep.error = None
    transition(ep, "PRESCRIPTION_RECEIVED", "patient", "retry", detail="retrying")
    store.put(ep)
    on_step("reset to PRESCRIPTION_RECEIVED")
    return ep
