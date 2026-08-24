"""API tests via TestClient. Background processing is monkeypatched so no Gemini
call happens; we assert the HTTP contract (status codes, shapes, error format).
"""

import os
import tempfile

os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()  # keep test uploads out of the repo

import pytest
from fastapi.testclient import TestClient

import api.main as apimain
import coordinator
from models import Prescription, PrescriptionTest, new_episode
from state.machine import transition
from tools.store import InMemoryEpisodeStore


def _advance_to_awaiting(store, episode_id, **_kw):
    ep = store.get(episode_id)
    ep.prescription = Prescription(
        tests=[PrescriptionTest(test_code="CBC", display_name="CBC", urgency="routine")]
    )
    for to, actor in [("TESTS_IDENTIFIED", "intake_agent"), ("LABS_SHORTLISTED", "logistics_agent"),
                      ("BOOKING_REQUESTED", "logistics_agent"), ("AWAITING_REPORT", "logistics_agent")]:
        transition(ep, to, actor, "x")
    store.put(ep)


@pytest.fixture
def client(monkeypatch):
    apimain.store = InMemoryEpisodeStore()
    monkeypatch.setattr(coordinator, "process_new_episode",
                        lambda store, episode_id, path, **kw: _advance_to_awaiting(store, episode_id))
    monkeypatch.setattr(coordinator, "ingest_report",
                        lambda store, episode_id, **kw: store.get(episode_id))
    return TestClient(apimain.app)


def _create(client):
    return client.post("/api/episodes",
                       files={"file": ("rx.jpg", b"fakebytes", "image/jpeg")},
                       data={"patient_id": "demo-patient-01"})


def test_create_returns_201_in_prescription_received(client):
    r = _create(client)
    assert r.status_code == 201
    body = r.json()
    assert body["state"] == "PRESCRIPTION_RECEIVED"  # bg hasn't advanced the returned copy
    assert body["episode_id"].startswith("ep_")
    assert body["timeline"][0]["action"] == "uploaded_prescription"


def test_get_after_create_shows_background_progress(client):
    ep_id = _create(client).json()["episode_id"]
    r = client.get(f"/api/episodes/{ep_id}")
    assert r.status_code == 200
    assert r.json()["state"] == "AWAITING_REPORT"  # background task ran


def test_list_episodes(client):
    _create(client)
    r = client.get("/api/episodes")
    assert r.status_code == 200
    eps = r.json()["episodes"]
    assert len(eps) == 1
    assert set(eps[0]) == {"episode_id", "state", "summary_line", "created_at", "upload_name"}


def test_get_missing_returns_404_error_shape(client):
    r = client.get("/api/episodes/nope")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "NOT_FOUND"


def test_upload_report_returns_202_report_received(client):
    ep_id = _create(client).json()["episode_id"]  # -> AWAITING_REPORT via bg
    r = client.post(f"/api/episodes/{ep_id}/report",
                    files={"file": ("report.pdf", b"fakepdf", "application/pdf")})
    assert r.status_code == 202
    assert r.json()["state"] == "REPORT_RECEIVED"


def test_upload_report_wrong_state_rejected(client):
    ep_id = _create(client).json()["episode_id"]
    # force it back to a non-awaiting state
    apimain.store._episodes[ep_id].state = "PRESCRIPTION_RECEIVED"
    r = client.post(f"/api/episodes/{ep_id}/report",
                    files={"file": ("report.pdf", b"x", "application/pdf")})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "INVALID_STATE"


def test_tick_reports_nudged(client):
    _create(client)  # -> AWAITING_REPORT
    r = client.post("/api/tick")
    assert r.status_code == 200
    assert len(r.json()["nudged"]) == 1


def test_retry_resets_needs_human(client):
    ep = new_episode("ep_x", "demo-patient-01", "rx.jpg", now="2026-08-20T09:00:00Z")
    transition(ep, "NEEDS_HUMAN", "intake_agent", "prescription_unreadable")
    apimain.store.put(ep)
    r = client.post("/api/episodes/ep_x/retry")
    assert r.status_code == 200
    assert r.json()["state"] == "PRESCRIPTION_RECEIVED"
