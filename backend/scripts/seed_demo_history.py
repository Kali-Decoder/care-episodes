"""Seed the trend-demo history into live Firestore.

Writes lab1 + lab2 as prior readings for demo-patient-01 (dated Jun/Jul) using the
real production code path, so that when lab3 is uploaded LIVE in the demo, the
diagnostics agent sees the full ESR trend (22 -> 43 -> 45) and books a consult.

Idempotent: clears demo-patient-01 history first, then reseeds. Safe to re-run.

Usage:  python scripts/seed_demo_history.py
"""
from __future__ import annotations
import sys
from pathlib import Path
from dotenv import load_dotenv
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from agents import diagnostics
from tools.firestore_store import FirestoreEpisodeStore
import os

PATIENT = "demo-patient-01"
SEED = [("lab1.pdf", "2026-06-01"), ("lab2.pdf", "2026-07-15")]  # lab3 uploaded live in the demo
WATCH = ["ESR", "HB"]

store = FirestoreEpisodeStore(project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                              database=os.getenv("FIRESTORE_DATABASE", "(default)"))

# 1. Clear any existing history for a clean, repeatable seed.
existing = list(store._db.collection("results").document(PATIENT).collection("history").stream())
for h in existing:
    h.reference.delete()
print(f"cleared {len(existing)} existing history docs")

# 2. Seed lab1 then lab2 through the real ingest path (extract -> persist_history).
for fname, date in SEED:
    ex = diagnostics.extract_report(f"demo-data/{fname}")
    report = diagnostics.build_report(ex, store, PATIENT, received_at=f"{date}T09:00:00Z")
    diagnostics.persist_history(report, store, PATIENT)
    print(f"seeded {fname} ({date}): {len(report.values)} values")

# 3. Confirm the watched trends.
print("\nSeeded history (what lab3 will compare against):")
for code in WATCH:
    pts = store.get_history(PATIENT, code)
    print(f"  {code}: " + " -> ".join(f"{p.value}@{p.date}" for p in pts))
print("\nNow upload lab3.pdf live -> ESR should read 45, trend=rising, 3-point history.")
