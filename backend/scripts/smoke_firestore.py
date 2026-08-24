"""Live Firestore smoke test — exercises FirestoreEpisodeStore against the real
database, then cleans up after itself. Run before trusting the prod store path.

Usage:  python scripts/smoke_firestore.py
Requires ADC (gcloud auth application-default login) and GOOGLE_CLOUD_PROJECT.
"""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from models import ResultHistoryPoint, new_episode
from state.machine import transition
from tools.firestore_store import FirestoreEpisodeStore

TEST_ID = "ep_smoke_test"
PATIENT = "smoke-patient"


def main() -> int:
    store = FirestoreEpisodeStore()
    ok = True

    def check(label: str, cond: bool) -> None:
        nonlocal ok
        ok = ok and cond
        print(f"  {'OK ' if cond else 'FAIL'} {label}")

    print("Firestore live smoke test...")
    try:
        # 1. put / get roundtrip
        ep = new_episode(TEST_ID, PATIENT, "rx.jpg", now="2026-08-22T09:00:00Z")
        store.put(ep)
        got = store.get(TEST_ID)
        check("put/get roundtrip", got is not None and got.model_dump() == ep.model_dump())

        # 2. update after a transition
        transition(ep, "TESTS_IDENTIFIED", "intake_agent", "extracted_tests")
        store.put(ep)
        check("state persists after update", store.get(TEST_ID).state == "TESTS_IDENTIFIED")

        # 3. list_for_patient
        check("list_for_patient finds it", any(e.episode_id == TEST_ID for e in store.list_for_patient(PATIENT)))

        # 4. list_by_states (scheduler query)
        check("list_by_states filters", any(e.episode_id == TEST_ID for e in store.list_by_states(["TESTS_IDENTIFIED"])))

        # 5. idempotency claim — atomic create, once only
        key = f"{TEST_ID}:CBC:1"
        first = store.claim_idempotency_key(key, TEST_ID)
        second = store.claim_idempotency_key(key, TEST_ID)
        check("idempotency claim once-only", first is True and second is False)

        # 6. history append / get
        store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-02-11", value=12.4))
        store.append_history(PATIENT, "HB", ResultHistoryPoint(date="2026-05-19", value=11.1))
        hist = store.get_history(PATIENT, "HB")
        check("history append/get ordered", [p.value for p in hist] == [12.4, 11.1])

    finally:
        _cleanup(store)

    print("PASS — Firestore store works." if ok else "FAILURES above.")
    return 0 if ok else 1


def _cleanup(store: FirestoreEpisodeStore) -> None:
    db = store._db
    db.collection("episodes").document(TEST_ID).delete()
    db.collection("idempotency").document(f"{TEST_ID}:CBC:1").delete()
    db.collection("results").document(PATIENT).collection("history").document("HB").delete()
    print("  (cleaned up test documents)")


if __name__ == "__main__":
    raise SystemExit(main())
