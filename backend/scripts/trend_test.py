"""Multi-report trend test: run lab1 -> lab2 -> lab3 in date order through the
real diagnostics history code and show the trend building up. Local in-memory
store (does NOT touch prod Firestore). Proves the multi-report feature end to end.
"""
from __future__ import annotations
import sys
from pathlib import Path
from dotenv import load_dotenv
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from agents import diagnostics
from tools.store import InMemoryEpisodeStore

PATIENT = "demo-patient-01"
LABS = [("lab1.pdf", "2026-06-01"), ("lab2.pdf", "2026-07-15"), ("lab3.pdf", "2026-08-20")]
WATCH = "ESR"

store = InMemoryEpisodeStore()
last_report = None
for fname, date in LABS:
    ex = diagnostics.extract_report(f"demo-data/{fname}")
    report = diagnostics.build_report(ex, store, PATIENT, received_at=f"{date}T09:00:00Z")
    diagnostics.persist_history(report, store, PATIENT)
    last_report = report
    v = next((x for x in report.values if x.test_code == WATCH), None)
    if v:
        hist = " -> ".join(str(p.value) for p in v.history)
        print(f"{fname} ({date}): {WATCH}={v.value} flag={v.flag} trend={v.trend} | history: {hist}")
    else:
        print(f"{fname} ({date}): {WATCH} not found (codes: {[x.test_code for x in report.values][:8]}...)")

print("\n--- significance decision on the newest report (real Pro) ---")
analysis = diagnostics.decide_significance(last_report)
print("severity:", analysis.severity, "| consult_needed:", analysis.consult_needed)
for f in analysis.findings:
    print("  -", f)
print("summary:", analysis.patient_summary)
