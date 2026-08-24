"""Thin CLI over agents.intake — the standalone extraction proof (next-action #1).

One prescription file in, structured JSON out. No episode, no store, no state.
The reusable logic lives in agents/intake.py; this is just a command-line front.

Usage:
    python scripts/extract_prescription.py demo-data/rx1.jpg
    python scripts/extract_prescription.py demo-data/rx1.pdf --location global
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

# Make the backend package root importable when run as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from agents.intake import IntakeError, extract_prescription  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", help="Path to a prescription image or PDF")
    parser.add_argument("--model", default=None, help="Vertex Gemini model ID")
    parser.add_argument("--location", default=None, help="Vertex region ('global' if it 404s)")
    args = parser.parse_args()

    path = Path(args.file)
    if not path.is_file():
        sys.exit(f"File not found: {path}")

    print(f"Reading {path.name}...", file=sys.stderr)
    try:
        result = extract_prescription(str(path), model=args.model, location=args.location)
    except IntakeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))

    urgent = sum(1 for t in result.tests if t.urgency == "urgent")
    print(
        f"\n---\nreadable={result.readable} | "
        f"{len(result.tests)} test(s), {urgent} urgent | "
        f"{len(result.medicines)} medicine(s)",
        file=sys.stderr,
    )
    if not result.readable:
        print(
            "Model marked this unreadable -> in the full flow this becomes "
            "NEEDS_HUMAN (PRESCRIPTION_UNREADABLE).",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
