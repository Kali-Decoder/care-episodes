from models import new_episode
from state import idempotency
from state.machine import transition
from tools.store import InMemoryEpisodeStore


def test_put_get_roundtrip_matches_contract_shape():
    store = InMemoryEpisodeStore()
    ep = new_episode("ep_1", "demo-patient-01", "rx1.jpg", now="2026-08-20T09:00:00Z")
    store.put(ep)
    got = store.get("ep_1")
    assert got is not None
    assert got.model_dump() == ep.model_dump()


def test_get_missing_returns_none():
    assert InMemoryEpisodeStore().get("nope") is None


def test_store_returns_copies_not_references():
    store = InMemoryEpisodeStore()
    store.put(new_episode("ep_1", "p1", "rx.jpg", now="2026-08-20T09:00:00Z"))
    got = store.get("ep_1")
    got.state = "CLOSED"  # mutate the copy
    # Stored episode must be untouched.
    assert store.get("ep_1").state == "PRESCRIPTION_RECEIVED"


def test_list_for_patient_filters_and_sorts_newest_first():
    store = InMemoryEpisodeStore()
    store.put(new_episode("old", "p1", "a.jpg", now="2026-01-01T00:00:00Z"))
    store.put(new_episode("new", "p1", "b.jpg", now="2026-08-01T00:00:00Z"))
    store.put(new_episode("other", "p2", "c.jpg", now="2026-09-01T00:00:00Z"))
    ids = [e.episode_id for e in store.list_for_patient("p1")]
    assert ids == ["new", "old"]  # p2 excluded, newest first


def test_summary_shape():
    ep = new_episode("ep_1", "demo-patient-01", "rx1.jpg", now="2026-08-20T09:00:00Z")
    s = ep.summary()
    assert s == {
        "episode_id": "ep_1",
        "state": "PRESCRIPTION_RECEIVED",
        "summary_line": "",
        "created_at": "2026-08-20T09:00:00Z",
        "upload_name": "rx1.jpg",
    }


def test_idempotency_key_format():
    assert idempotency.make_key("ep_7f3a9c", "CBC", 1) == "ep_7f3a9c:CBC:1"
    assert idempotency.make_key("ep_7f3a9c", "CBC") == "ep_7f3a9c:CBC:1"


def test_idempotency_claim_is_once_only():
    store = InMemoryEpisodeStore()
    assert idempotency.claim(store, "ep_1", "CBC") is True   # first claim proceeds
    assert idempotency.claim(store, "ep_1", "CBC") is False  # duplicate skips
    # a different attempt is a different key
    assert idempotency.claim(store, "ep_1", "CBC", attempt=2) is True
    # a different test is a different key
    assert idempotency.claim(store, "ep_1", "FERRITIN") is True


def test_double_booking_guarded_end_to_end():
    """Simulate a scheduler firing twice: only one send should go through."""
    store = InMemoryEpisodeStore()
    ep = new_episode("ep_1", "p1", "rx.jpg", now="2026-08-20T09:00:00Z")
    store.put(ep)

    sends = 0
    for _ in range(2):  # scheduler fires twice
        if idempotency.claim(store, ep.episode_id, "CBC"):
            sends += 1  # the "real" side effect (send email) happens here
    assert sends == 1
