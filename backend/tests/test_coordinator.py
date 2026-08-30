"""Coordinator orchestration tests — Gemini calls are monkeypatched, no cost.

We stub the two model-calling functions (prescription extraction and the
significance decision) and let all the real state-machine / store / logistics /
trend logic run, so this exercises the flow wiring end to end for free.
"""

import agents.diagnostics as diag
import coordinator
from agents.diagnostics import ReportExtraction
from agents.intake import Extraction, IntakeError
from models import Analysis, Lab, Prescription, ResultHistoryPoint, new_episode
from state.machine import transition
from tools.store import InMemoryEpisodeStore

PATIENT = "demo-patient-01"


def _seed(store, episode_id="ep_1"):
    store.put(new_episode(episode_id, PATIENT, "rx.jpg", now="2026-08-20T09:00:00Z"))


def _stub_lab(selected=True):
    return Lab(place_id="lab1", name="Dr Lal PathLabs", address="Salt Lake, Kolkata",
               rating=4.9, distance_km=0.7, open_now=True, selected=selected,
               selection_reason="closest open, highest rating")


def test_process_new_episode_happy_path(monkeypatch):
    store = InMemoryEpisodeStore()
    _seed(store)
    fake = Extraction(
        readable=True, doctor="Dr X", date="2026-08-20", diagnosis="anaemia",
        tests=[{"test_code": "CBC", "display_name": "CBC", "urgency": "urgent"},
               {"test_code": "TSH", "display_name": "TSH", "urgency": "routine"}],
    )
    monkeypatch.setattr(coordinator, "extract_prescription", lambda p: fake)
    monkeypatch.setattr(coordinator, "shortlist_labs", lambda ep: [_stub_lab()])
    monkeypatch.setattr(coordinator, "send_booking_request", lambda ep, store: None)  # no real send

    ep = coordinator.process_new_episode(store, "ep_1", "/tmp/x.jpg", source_file_url="/files/x")
    assert ep.state == "AWAITING_REPORT"
    assert ep.summary_line == "2 test(s) ordered, 1 urgent"
    assert len(ep.bookings) == 2
    assert ep.prescription.source_file_url == "/files/x"
    assert [t.action for t in ep.timeline] == [
        "uploaded_prescription", "extracted_tests", "found_labs",
        "requested_booking", "awaiting_report",
    ]


def test_process_new_episode_unreadable_goes_needs_human(monkeypatch):
    store = InMemoryEpisodeStore()
    _seed(store)
    monkeypatch.setattr(coordinator, "extract_prescription", lambda p: Extraction(readable=False))
    ep = coordinator.process_new_episode(store, "ep_1", "/tmp/x.jpg")
    assert ep.state == "NEEDS_HUMAN"
    assert ep.error.code == "PRESCRIPTION_UNREADABLE"
    assert ep.bookings == []  # never got to logistics


def test_process_new_episode_extraction_error_goes_needs_human(monkeypatch):
    store = InMemoryEpisodeStore()
    _seed(store)

    def boom(_p):
        raise IntakeError("model down")

    monkeypatch.setattr(coordinator, "extract_prescription", boom)
    ep = coordinator.process_new_episode(store, "ep_1", "/tmp/x.jpg")
    assert ep.state == "NEEDS_HUMAN"
    assert ep.error.code == "EXTRACTION_FAILED"


def test_process_new_episode_no_labs_goes_needs_human(monkeypatch):
    store = InMemoryEpisodeStore()
    _seed(store)
    monkeypatch.setattr(coordinator, "extract_prescription", lambda p: Extraction(
        readable=True, tests=[{"test_code": "CBC", "display_name": "CBC", "urgency": "routine"}]))
    monkeypatch.setattr(coordinator, "shortlist_labs", lambda ep: [])  # Places found nothing
    ep = coordinator.process_new_episode(store, "ep_1", "/tmp/x.jpg")
    assert ep.state == "NEEDS_HUMAN"
    assert ep.error.code == "NO_LABS_FOUND"


def _episode_awaiting_report(store):
    ep = new_episode("ep_1", PATIENT, "rx.jpg", now="2026-08-20T09:00:00Z")
    ep.prescription = Prescription(doctor="Dr. A. Sen")
    for to, actor in [
        ("TESTS_IDENTIFIED", "intake_agent"), ("LABS_SHORTLISTED", "logistics_agent"),
        ("BOOKING_REQUESTED", "logistics_agent"), ("AWAITING_REPORT", "logistics_agent"),
    ]:
        transition(ep, to, actor, "x")
    store.put(ep)
    return ep


def test_ingest_report_anomaly_books_consult(monkeypatch):
    store = InMemoryEpisodeStore()
    store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-05-19", value=11.1))
    _episode_awaiting_report(store)
    coordinator.mark_report_received(store, "ep_1", received_at="2026-08-24T10:58:00Z")

    monkeypatch.setattr(diag, "decide_significance", lambda report: Analysis(
        severity="attention", consult_needed=True, findings=["Hb low"],
        patient_summary="...", disclaimer="d"))
    extraction = ReportExtraction(readable=True, values=[
        {"test_code": "HB", "display_name": "Hb", "value": 9.8, "unit": "g/dL",
         "ref_low": 12.0, "ref_high": 15.0}])

    ep = coordinator.ingest_report(store, "ep_1", extraction=extraction,
                                   received_at="2026-08-24T10:58:00Z")
    assert ep.state == "CONSULT_REQUESTED"
    assert ep.consultation is not None
    assert ep.report.values[0].flag == "low"
    assert ep.report.values[0].trend == "falling"
    # reading persisted for the next episode
    assert store.get_history(PATIENT, "HB")[-1].value == 9.8


def test_ingest_report_normal_no_consult(monkeypatch):
    store = InMemoryEpisodeStore()
    _episode_awaiting_report(store)
    coordinator.mark_report_received(store, "ep_1", received_at="2026-08-24T10:00:00Z")
    monkeypatch.setattr(diag, "decide_significance", lambda report: Analysis(
        severity="normal", consult_needed=False, findings=[], patient_summary="ok", disclaimer="d"))
    extraction = ReportExtraction(readable=True, values=[
        {"test_code": "TSH", "display_name": "TSH", "value": 2.5, "unit": "mIU/L",
         "ref_low": 0.4, "ref_high": 4.0}])
    ep = coordinator.ingest_report(store, "ep_1", extraction=extraction,
                                   received_at="2026-08-24T10:00:00Z")
    assert ep.state == "NORMAL"
    assert ep.consultation is None


def test_ingest_report_unreadable_goes_needs_human():
    store = InMemoryEpisodeStore()
    _episode_awaiting_report(store)
    coordinator.mark_report_received(store, "ep_1", received_at="2026-08-24T10:00:00Z")
    ep = coordinator.ingest_report(store, "ep_1",
                                   extraction=ReportExtraction(readable=False))
    assert ep.state == "NEEDS_HUMAN"
    assert ep.error.code == "REPORT_UNREADABLE"


def test_tick_nudges_only_waiting_episodes(monkeypatch):
    monkeypatch.setattr(coordinator.storage, "list_reports", lambda pid: [])  # empty inbox
    store = InMemoryEpisodeStore()
    _episode_awaiting_report(store)  # ep_1 in AWAITING_REPORT
    closed = new_episode("ep_2", PATIENT, "rx.jpg", now="2026-01-01T00:00:00Z")
    for to, actor in [("TESTS_IDENTIFIED", "intake_agent"), ("LABS_SHORTLISTED", "logistics_agent"),
                      ("BOOKING_REQUESTED", "logistics_agent"), ("AWAITING_REPORT", "logistics_agent"),
                      ("REPORT_RECEIVED", "patient"), ("TRENDS_ANALYZED", "diagnostics_agent"),
                      ("NORMAL", "diagnostics_agent"), ("CLOSED", "diagnostics_agent")]:
        transition(closed, to, actor, "x")
    store.put(closed)

    result = coordinator.tick(store)
    assert result["nudged"] == ["ep_1"]
    assert result["picked_up"] == []
    assert store.get("ep_1").timeline[-1].action == "tick"


def test_tick_autonomously_picks_up_delivered_report(monkeypatch):
    """A report in the lab inbox is ingested by the tick with no manual upload."""
    store = InMemoryEpisodeStore()
    store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-05-19", value=11.1))
    _episode_awaiting_report(store)  # ep_1 AWAITING_REPORT

    # Fake the GCS inbox: one delivered report, then empty after delete.
    inbox = {"inbox/demo-patient-01/report.pdf": b"fakepdf"}
    monkeypatch.setattr(coordinator.storage, "list_reports", lambda pid: list(inbox))
    monkeypatch.setattr(coordinator.storage, "download", lambda name: inbox[name])
    monkeypatch.setattr(coordinator.storage, "delete", lambda name: inbox.pop(name, None))
    monkeypatch.setattr(coordinator.storage, "bucket_name", lambda: "test-bucket")
    # Stub the two Gemini calls in the ingest path.
    monkeypatch.setattr(diag, "extract_report", lambda path: ReportExtraction(
        readable=True, values=[{"test_code": "HB", "display_name": "Hb", "value": 9.8,
                                "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.0}]))
    monkeypatch.setattr(diag, "decide_significance", lambda report: Analysis(
        severity="attention", consult_needed=True, findings=["Hb falling"],
        patient_summary="...", disclaimer="d"))

    result = coordinator.tick(store)
    assert result["picked_up"] == ["ep_1"]
    ep = store.get("ep_1")
    assert ep.state == "CONSULT_REQUESTED"
    # The pickup was attributed to the scheduler, not the patient.
    assert any(t.actor == "scheduler" and t.action == "retrieved_report" for t in ep.timeline)
    assert ep.report.values[0].trend == "falling"
    assert not inbox  # delivered file was removed after ingest


def test_tick_replay_does_not_double_pick_up(monkeypatch):
    store = InMemoryEpisodeStore()
    _episode_awaiting_report(store)
    inbox = {"inbox/demo-patient-01/report.pdf": b"x"}
    monkeypatch.setattr(coordinator.storage, "list_reports", lambda pid: list(inbox))
    monkeypatch.setattr(coordinator.storage, "download", lambda name: inbox[name])
    monkeypatch.setattr(coordinator.storage, "delete", lambda name: inbox.pop(name, None))
    monkeypatch.setattr(coordinator.storage, "bucket_name", lambda: "t")
    monkeypatch.setattr(diag, "extract_report", lambda path: ReportExtraction(
        readable=True, values=[{"test_code": "HB", "display_name": "Hb", "value": 13.0,
                                "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.0}]))
    monkeypatch.setattr(diag, "decide_significance", lambda report: Analysis(
        severity="normal", consult_needed=False, findings=[], patient_summary="ok", disclaimer="d"))

    first = coordinator.tick(store)
    second = coordinator.tick(store)  # replay — episode already left AWAITING_REPORT
    assert first["picked_up"] == ["ep_1"]
    assert second["picked_up"] == []


def test_retry_resets_needs_human():
    store = InMemoryEpisodeStore()
    ep = new_episode("ep_1", PATIENT, "rx.jpg", now="2026-08-20T09:00:00Z")
    transition(ep, "NEEDS_HUMAN", "intake_agent", "prescription_unreadable")
    store.put(ep)
    out = coordinator.retry(store, "ep_1")
    assert out.state == "PRESCRIPTION_RECEIVED"
    assert out.error is None
