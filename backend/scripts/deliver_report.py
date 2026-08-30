"""Simulate a diagnostic lab delivering a report — drops a file into the GCS lab
inbox. The scheduler then picks it up autonomously on its next tick (no upload).

Usage:
    python scripts/deliver_report.py demo-data/lab3.pdf
    python scripts/deliver_report.py demo-data/lab3.pdf --patient demo-patient-01
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from tools import storage


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("file", help="Local report file to deliver")
    ap.add_argument("--patient", default="demo-patient-01")
    args = ap.parse_args()
    if not Path(args.file).is_file():
        sys.exit(f"File not found: {args.file}")
    blob = storage.deliver(args.patient, args.file)
    print(f"Delivered to gs://{storage.bucket_name()}/{blob}")
    print("The scheduler will pick it up on its next tick (~60s). Watch the episode "
          "advance to CONSULT_REQUESTED with no manual upload.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
