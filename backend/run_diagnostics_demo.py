"""Diagnostics leg demo (build-plan §18, second half of the arc).

Thin narrated wrapper over the coordinator's diagnostics path. We have no matched
multi-report patient data yet, so this seeds a realistic history and injects a
mock report extraction — but the significance decision is a REAL Gemini Pro call,
and all trend/flag/history/consult logic is the shared coordinator code. It
reproduces the contract's headline example: haemoglobin falling across three
reports, now below range -> anomaly -> consult.

When a real lab-report file exists, drop the mock and call the /report endpoint
(or coordinator.ingest_report with report_path=...) instead — nothing else changes.

Usage:  python run_diagnostics_demo.py
"""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

import coordinator
from agents.diagnostics import IntakeError, ReportExtraction
from models import Prescription, PrescriptionTest, ResultHistoryPoint, new_episode
from state.machine import transition
from tools.store import InMemoryEpisodeStore

PATIENT = "demo-patient-01"


def main() -> int:
    store = InMemoryEpisodeStore()
    narrate = lambda msg: print(f"  {msg}", file=sys.stderr)  # noqa: E731

    # 0. Prior history — the memory that makes the trend meaningful.
    store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-02-11", value=12.4))
    store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-05-19", value=11.1))
    print("[0] seeded history: HB 12.4 (Feb), 11.1 (May)", file=sys.stderr)

    # Fast-forward an episode to AWAITING_REPORT (the earlier legs are covered
    # for real by run_skeleton.py).
    episode_id = f"ep_{uuid.uuid4().hex[:6]}"
    ep = new_episode(episode_id, PATIENT, "rx.jpg", now="2026-08-20T09:14:00Z")
    ep.prescription = Prescription(
        doctor="Dr. A. Sen",
        tests=[PrescriptionTest(test_code="HB", display_name="Haemoglobin", urgency="routine")],
    )
    for to, actor in [
        ("TESTS_IDENTIFIED", "intake_agent"),
        ("LABS_SHORTLISTED", "logistics_agent"),
        ("BOOKING_REQUESTED", "logistics_agent"),
        ("AWAITING_REPORT", "logistics_agent"),
    ]:
        transition(ep, to, actor, f"-> {to}")
    store.put(ep)
    print(f"[1] {episode_id} in {ep.state}", file=sys.stderr)

    # 2. Report arrives (MOCK extraction; a real file would go through
    #    coordinator.ingest_report(report_path=...) with extract_report).
    coordinator.mark_report_received(store, episode_id, upload_name="report1.pdf",
                                     received_at="2026-08-24T10:58:00Z", on_step=narrate)
    extraction = ReportExtraction(
        readable=True,
        values=[{"test_code": "HB", "display_name": "Haemoglobin", "value": 9.8,
                 "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.0}],
    )
    print("[2] running diagnostics (real Gemini Pro for significance)...", file=sys.stderr)
    try:
        coordinator.ingest_report(
            store, episode_id, extraction=extraction,
            received_at="2026-08-24T10:58:00Z", on_step=narrate,
        )
    except IntakeError as exc:
        print(f"    {exc}", file=sys.stderr)
        return 1

    ep = store.get(episode_id)
    print(json.dumps(ep.model_dump(), indent=2, ensure_ascii=False))
    print("\ntimeline:", file=sys.stderr)
    for t in ep.timeline:
        print(f"  {t.at} [{t.actor}] {t.action} — {t.detail or ''}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
