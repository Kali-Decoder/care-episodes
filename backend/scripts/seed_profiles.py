"""Seed the three demo profiles with distinct scenarios (writes to live Firestore).

  Shashank (demo-patient-01): rising-ESR history (lab1,lab2) — flagship, run live
                              (upload rx.pdf, then deliver lab3) to get anomaly->consult.
  Neeraj:   a completed NORMAL episode (all values in range -> no consult).
  Rakesh:   a new patient whose booking is requested -> AWAITING_REPORT (waiting).

Runs the REAL pipeline (intake -> logistics(Places per city) -> diagnostics) so
the data is authentic. Idempotent: clears each profile first. Booking email +
calendar sends are DISABLED during seeding so it doesn't spam your inbox/calendar.

Usage:  python scripts/seed_profiles.py
Note: makes several Gemini + Places calls; takes a couple of minutes. One-time.
"""
from __future__ import annotations
import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Disable Gmail/Calendar sends during seeding (send_booking_request no-ops without OAuth).
for k in ("OAUTH_REFRESH_TOKEN", "OAUTH_CREDENTIALS_JSON"):
    os.environ.pop(k, None)

import coordinator
from agents import diagnostics
from models import new_episode
from tools.firestore_store import FirestoreEpisodeStore

store = FirestoreEpisodeStore(project=os.getenv("GOOGLE_CLOUD_PROJECT"))


def _clear(patient_id: str) -> None:
    from google.cloud import firestore  # noqa
    db = store._db
    for e in db.collection("episodes").where("patient_id", "==", patient_id).stream():
        e.reference.delete()
    for h in db.collection("results").document(patient_id).collection("history").stream():
        h.reference.delete()


def _run_front(patient_id: str, rx: str) -> str:
    ep_id = f"ep_{uuid.uuid4().hex[:6]}"
    store.put(new_episode(ep_id, patient_id, Path(rx).name))
    coordinator.process_new_episode(store, ep_id, f"demo-data/{rx}",
                                    on_step=lambda m: print("   ", m))
    return ep_id


def main() -> int:
    # --- Shashank: rising-ESR history (flagship runs live) ---
    print("[shashank] seeding ESR history (lab1, lab2)...")
    _clear("demo-patient-01")
    for fname, date in [("lab1.pdf", "2026-06-01"), ("lab2.pdf", "2026-07-15")]:
        ex = diagnostics.extract_report(f"demo-data/{fname}")
        rep = diagnostics.build_report(ex, store, "demo-patient-01", received_at=f"{date}T09:00:00Z")
        diagnostics.persist_history(rep, store, "demo-patient-01")
    print("   ESR:", [p.value for p in store.get_history('demo-patient-01', 'ESR')])

    # --- Neeraj: all-clear NORMAL episode ---
    print("[neeraj] running episode -> NORMAL (prescription.pdf + in-range report)...")
    _clear("neeraj")
    nid = _run_front("neeraj", "prescription.pdf")
    coordinator.mark_report_received(store, nid, upload_name="lab_reports.pdf")
    coordinator.ingest_report(store, nid, report_path="demo-data/lab_reports.pdf",
                              on_step=lambda m: print("   ", m))
    print("   final:", store.get(nid).state)

    # --- Rakesh: new patient, booking requested, awaiting first report ---
    print("[rakesh] running episode -> AWAITING_REPORT (waiting for lab)...")
    _clear("rakesh")
    rid = _run_front("rakesh", "IMG_2070.HEIC")
    print("   final:", store.get(rid).state)

    print("\nDone. Profiles seeded:")
    for pid in ("demo-patient-01", "neeraj", "rakesh"):
        eps = store.list_for_patient(pid)
        print(f"  {pid}: {len(eps)} episode(s) -> {[e.state for e in eps]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
