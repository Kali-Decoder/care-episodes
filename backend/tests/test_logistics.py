"""Logistics tests — pure helpers + booking. The ADK agent + Places call are
external and exercised live (see run_skeleton); here we test the deterministic
pieces with no network."""

from agents import logistics
from agents.logistics import (
    _candidates_from,
    _fallback_select,
    _parse_selection,
    request_bookings,
    send_booking_request,
)
from models import Lab, Prescription, PrescriptionTest, new_episode
from tools.places import haversine_km
from tools.store import InMemoryEpisodeStore

NOW = "2026-08-20T09:16:00Z"


def _lab(place_id="lab1", name="Suraksha", selected=True):
    return Lab(place_id=place_id, name=name, address="Kolkata", rating=4.3,
               distance_km=1.0, open_now=True, selected=selected)


def _episode_with_tests(*codes):
    ep = new_episode("ep_1", "demo-patient-01", "rx.jpg", now="2026-08-20T09:14:00Z")
    ep.prescription = Prescription(
        tests=[PrescriptionTest(test_code=c, display_name=c, urgency="routine") for c in codes]
    )
    ep.labs = [_lab()]
    return ep


# --- booking (deterministic, idempotency-guarded) ---------------------------


def test_request_bookings_one_per_test():
    from tools.store import InMemoryEpisodeStore
    store = InMemoryEpisodeStore()
    ep = _episode_with_tests("CBC", "FERRITIN", "TSH")
    bookings = request_bookings(ep, store, now=NOW)
    assert len(bookings) == 3
    assert {b.test_code for b in bookings} == {"CBC", "FERRITIN", "TSH"}
    assert all(b.status == "requested" and b.lab_name == "Suraksha" for b in bookings)
    assert bookings[0].idempotency_key == "ep_1:CBC:1"
    assert bookings[0].slot_hold == "2026-08-21T08:00:00Z"


def test_request_bookings_is_idempotent_on_replay():
    from tools.store import InMemoryEpisodeStore
    store = InMemoryEpisodeStore()
    ep = _episode_with_tests("CBC", "TSH")
    assert len(request_bookings(ep, store, now=NOW)) == 2
    assert request_bookings(ep, store, now=NOW) == []  # keys already claimed


def test_request_bookings_without_labs_or_prescription_is_empty():
    from tools.store import InMemoryEpisodeStore
    store = InMemoryEpisodeStore()
    ep = new_episode("ep_1", "p1", "rx.jpg", now=NOW)
    assert request_bookings(ep, store, now=NOW) == []  # no prescription
    ep.prescription = Prescription(tests=[PrescriptionTest(test_code="CBC", display_name="CBC", urgency="routine")])
    assert request_bookings(ep, store, now=NOW) == []  # no labs


# --- lab selection helpers --------------------------------------------------


def test_parse_selection_handles_plain_and_fenced_json():
    assert _parse_selection('{"place_id": "abc", "reason": "close"}') == ("abc", "close")
    assert _parse_selection('```json\n{"place_id": "x", "reason": "y"}\n```') == ("x", "y")
    assert _parse_selection("not json") == (None, "")
    assert _parse_selection(None) == (None, "")


def test_fallback_select_prefers_open_then_rating_then_distance():
    candidates = [
        {"place_id": "closed_best", "open_now": False, "rating": 5.0, "distance_km": 0.1},
        {"place_id": "open_hi", "open_now": True, "rating": 4.8, "distance_km": 2.0},
        {"place_id": "open_lo", "open_now": True, "rating": 4.2, "distance_km": 0.5},
    ]
    place_id, reason = _fallback_select(candidates)
    assert place_id == "open_hi"  # open + highest rating beats closed 5.0 and nearer 4.2
    assert reason


def test_candidates_from_handles_direct_and_wrapped():
    labs = [{"place_id": "x"}]
    assert _candidates_from({"find_nearby_labs": {"labs": labs}}) == labs
    assert _candidates_from({"find_nearby_labs": {"result": {"labs": labs}}}) == labs
    assert _candidates_from({}) == []


def test_haversine_km():
    assert haversine_km(22.58, 88.42, 22.58, 88.42) == 0.0
    # ~1 degree of latitude is ~111 km
    assert 110 < haversine_km(22.0, 88.0, 23.0, 88.0) < 112


# --- booking notification (Gmail + Calendar) --------------------------------


def test_send_booking_request_skips_when_oauth_not_configured(monkeypatch):
    monkeypatch.setattr(logistics.google_oauth, "configured", lambda: False)
    store = InMemoryEpisodeStore()
    ep = _episode_with_tests("CBC")
    ep.bookings = request_bookings(ep, store, now=NOW)
    assert send_booking_request(ep, store, now=NOW) is None


def test_send_booking_request_sends_once_and_is_idempotent(monkeypatch):
    monkeypatch.setattr(logistics.google_oauth, "configured", lambda: True)
    monkeypatch.setattr(logistics.gmail, "send_email", lambda to, subject, body: "msg123")
    monkeypatch.setattr(logistics.calendar_tool, "create_hold",
                        lambda summary, slot, description="": {"event_id": "ev1", "html_link": "http://cal/ev1"})
    monkeypatch.setenv("NOTIFY_EMAIL", "demo@example.com")

    store = InMemoryEpisodeStore()
    ep = _episode_with_tests("CBC", "TSH")
    ep.bookings = request_bookings(ep, store, now=NOW)

    first = send_booking_request(ep, store, now=NOW)
    second = send_booking_request(ep, store, now=NOW)  # replay
    assert first["message_id"] == "msg123"
    assert first["event_id"] == "ev1"
    assert first["to"] == "demo@example.com"
    assert second is None  # idempotency guard holds
