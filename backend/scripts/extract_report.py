"""Thin CLI over the diagnostics extractor — the lab-report reading proof.

One lab report in, structured values + the reference ranges printed on the report
out. No episode, no history, no significance call. The reusable logic lives in
agents/diagnostics.py; this is just a command-line front, mirroring
scripts/extract_prescription.py.

Usage:
    python scripts/extract_report.py demo-data/report1.pdf
    python scripts/extract_report.py demo-data/report1.jpg --location global
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from agents.diagnostics import IntakeError, extract_report  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", help="Path to a lab report image or PDF")
    parser.add_argument("--model", default=None, help="Vertex Gemini model ID")
    parser.add_argument("--location", default=None, help="Vertex region ('global' if it 404s)")
    args = parser.parse_args()

    path = Path(args.file)
    if not path.is_file():
        sys.exit(f"File not found: {path}")

    print(f"Reading {path.name}...", file=sys.stderr)
    try:
        result = extract_report(str(path), model=args.model, location=args.location)
    except IntakeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))

    out_of_range = 0
    for v in result.values:
        if v.value < v.ref_low or v.value > v.ref_high:
            out_of_range += 1
    print(
        f"\n---\nreadable={result.readable} | {len(result.values)} value(s), "
        f"{out_of_range} outside printed range",
        file=sys.stderr,
    )
    if not result.readable:
        print(
            "Model marked this unreadable -> in the full flow this becomes "
            "NEEDS_HUMAN (REPORT_UNREADABLE).",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
