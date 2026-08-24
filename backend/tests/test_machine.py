import pytest

from models import new_episode
from state.machine import InvalidTransition, can_transition, log, transition

T0 = "2026-08-20T09:14:00Z"
T1 = "2026-08-20T09:15:00Z"


def make():
    return new_episode("ep_test", "demo-patient-01", "rx1.jpg", now=T0)


def test_new_episode_starts_correctly():
    ep = make()
    assert ep.state == "PRESCRIPTION_RECEIVED"
    assert ep.created_at == ep.updated_at == T0
    # Timeline is never empty (contract §3) — starts with the upload.
    assert len(ep.timeline) == 1
    assert ep.timeline[0].action == "uploaded_prescription"
    assert ep.timeline[0].detail == "rx1.jpg"


def test_legal_transition_appends_timeline_and_bumps_updated_at():
    ep = make()
    transition(ep, "TESTS_IDENTIFIED", "intake_agent", "extracted_tests",
               detail="3 tests found", now=T1)
    assert ep.state == "TESTS_IDENTIFIED"
    assert ep.updated_at == T1
    assert ep.created_at == T0  # unchanged
    assert ep.timeline[-1].actor == "intake_agent"
    assert ep.timeline[-1].detail == "3 tests found"


def test_illegal_transition_raises_and_leaves_state_untouched():
    ep = make()
    with pytest.raises(InvalidTransition):
        transition(ep, "CLOSED", "intake_agent", "nope")
    assert ep.state == "PRESCRIPTION_RECEIVED"
    assert len(ep.timeline) == 1  # nothing appended on failure


def test_full_happy_path_to_closed():
    ep = make()
    path = [
        ("TESTS_IDENTIFIED", "intake_agent"),
        ("LABS_SHORTLISTED", "logistics_agent"),
        ("BOOKING_REQUESTED", "logistics_agent"),
        ("AWAITING_REPORT", "logistics_agent"),
        ("REPORT_RECEIVED", "patient"),
        ("TRENDS_ANALYZED", "diagnostics_agent"),
        ("ANOMALY_FOUND", "diagnostics_agent"),
        ("CONSULT_REQUESTED", "diagnostics_agent"),
        ("CLOSED", "diagnostics_agent"),
    ]
    for to, actor in path:
        transition(ep, to, actor, f"-> {to}")
    assert ep.state == "CLOSED"


def test_normal_branch_can_close():
    ep = make()
    for to, actor in [
        ("TESTS_IDENTIFIED", "intake_agent"),
        ("LABS_SHORTLISTED", "logistics_agent"),
        ("BOOKING_REQUESTED", "logistics_agent"),
        ("AWAITING_REPORT", "logistics_agent"),
        ("REPORT_RECEIVED", "patient"),
        ("TRENDS_ANALYZED", "diagnostics_agent"),
    ]:
        transition(ep, to, actor, f"-> {to}")
    transition(ep, "NORMAL", "diagnostics_agent", "all clear")
    transition(ep, "CLOSED", "diagnostics_agent", "closed")
    assert ep.state == "CLOSED"


def test_needs_human_reachable_from_any_live_state():
    ep = make()
    transition(ep, "TESTS_IDENTIFIED", "intake_agent", "x")
    transition(ep, "NEEDS_HUMAN", "intake_agent", "unreadable")
    assert ep.state == "NEEDS_HUMAN"


def test_retry_out_of_needs_human_resumes_live_work():
    ep = make()
    transition(ep, "NEEDS_HUMAN", "intake_agent", "unreadable")
    # retry resumes into live work...
    transition(ep, "PRESCRIPTION_RECEIVED", "patient", "re-uploaded")
    assert ep.state == "PRESCRIPTION_RECEIVED"
    # ...but not into a terminal state
    assert not can_transition("NEEDS_HUMAN", "CLOSED")


def test_closed_is_terminal():
    assert not can_transition("CLOSED", "NEEDS_HUMAN")
    assert not can_transition("CLOSED", "PRESCRIPTION_RECEIVED")


def test_no_self_escalation_from_needs_human_to_needs_human():
    assert not can_transition("NEEDS_HUMAN", "NEEDS_HUMAN")


def test_log_appends_without_changing_state():
    ep = make()
    transition(ep, "TESTS_IDENTIFIED", "intake_agent", "x", now=T1)
    log(ep, "scheduler", "tick", detail="still waiting")
    assert ep.state == "TESTS_IDENTIFIED"
    assert ep.timeline[-1].action == "tick"
    assert ep.timeline[-1].actor == "scheduler"
