"""Diagnostics tests for the deterministic parts — no Gemini call, no cost.

The extraction (Flash) and significance decision (Pro) are exercised live by
run_diagnostics_demo.py; here we test flag/trend/report-building/history/consult,
which is where the correctness-sensitive logic lives.
"""

from agents.diagnostics import (
    ReportExtraction,
    book_consult,
    build_report,
    compute_flag,
    compute_trend,
    persist_history,
)
from models import Prescription, ResultHistoryPoint, new_episode
from tools.store import InMemoryEpisodeStore


def test_compute_flag():
    assert compute_flag(9.8, 12.0, 15.0) == "low"
    assert compute_flag(13.0, 12.0, 15.0) == "normal"
    assert compute_flag(16.0, 12.0, 15.0) == "high"
    assert compute_flag(12.0, 12.0, 15.0) == "normal"  # boundary is in range


def test_compute_trend():
    assert compute_trend(9.8, []) == "first_reading"
    assert compute_trend(9.8, [11.1]) == "falling"
    assert compute_trend(12.0, [11.1]) == "rising"
    assert compute_trend(11.1, [11.0]) == "stable"  # within 2% tolerance


def test_build_report_computes_flag_and_trend_against_history():
    store = InMemoryEpisodeStore()
    # Seed the falling-Hb history from the contract example.
    store.append_history("p1", "HB", ResultHistoryPoint(date="2026-02-11", value=12.4))
    store.append_history("p1", "HB", ResultHistoryPoint(date="2026-05-19", value=11.1))

    extraction = ReportExtraction(
        readable=True,
        values=[{"test_code": "HB", "display_name": "Haemoglobin", "value": 9.8,
                 "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.0}],
    )
    report = build_report(extraction, store, "p1", received_at="2026-08-24T10:58:00Z")
    v = report.values[0]
    assert v.flag == "low"
    assert v.trend == "falling"
    # History = the two priors + this reading, oldest first.
    assert [p.value for p in v.history] == [12.4, 11.1, 9.8]
    assert v.history[-1].date == "2026-08-24"


def test_first_reading_has_no_prior_trend():
    store = InMemoryEpisodeStore()
    extraction = ReportExtraction(
        readable=True,
        values=[{"test_code": "TSH", "display_name": "TSH", "value": 2.5,
                 "unit": "mIU/L", "ref_low": 0.4, "ref_high": 4.0}],
    )
    report = build_report(extraction, store, "p1", received_at="2026-08-24T10:00:00Z")
    assert report.values[0].trend == "first_reading"
    assert report.values[0].flag == "normal"


def test_persist_history_feeds_the_next_episode():
    store = InMemoryEpisodeStore()
    extraction = ReportExtraction(
        readable=True,
        values=[{"test_code": "HB", "display_name": "Haemoglobin", "value": 9.8,
                 "unit": "g/dL", "ref_low": 12.0, "ref_high": 15.0}],
    )
    report = build_report(extraction, store, "p1", received_at="2026-08-24T10:58:00Z")
    persist_history(report, store, "p1")
    # A later report now sees 9.8 as prior history.
    later = build_report(extraction, store, "p1", received_at="2026-11-01T10:00:00Z")
    assert [p.value for p in later.values[0].history] == [9.8, 9.8]


def test_book_consult_is_idempotent():
    store = InMemoryEpisodeStore()
    ep = new_episode("ep_1", "p1", "rx.jpg", now="2026-08-24T11:00:00Z")
    ep.prescription = Prescription(doctor="Dr. A. Sen")
    store.put(ep)

    first = book_consult(ep, store, now="2026-08-24T11:01:00Z")
    second = book_consult(ep, store, now="2026-08-24T11:01:00Z")  # replay
    assert first is not None
    assert first.doctor == "Dr. A. Sen"
    assert first.status == "requested"
    assert second is None  # already booked -> guard holds
