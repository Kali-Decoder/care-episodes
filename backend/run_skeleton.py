"""Walking skeleton (build-plan §18): prescription file -> AWAITING_REPORT.

Thin CLI over the coordinator — same flow the API runs, narrated to stdout:

    upload -> intake (real Gemini) -> labs (stub) -> booking (idempotent) -> wait
    ... or NEEDS_HUMAN if the prescription is unreadable.

Runs on the in-memory store by default (no GCP); --store firestore for the real DB.

Usage:
    python run_skeleton.py demo-data/IMG_2070.HEIC
    python run_skeleton.py demo-data/rx.pdf --store firestore
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

import coordinator
from models import new_episode
from tools.store import EpisodeStore, InMemoryEpisodeStore


def build_store(kind: str) -> EpisodeStore:
    if kind == "firestore":
        from tools.firestore_store import FirestoreEpisodeStore

        return FirestoreEpisodeStore(
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            database=os.getenv("FIRESTORE_DATABASE", "(default)"),
        )
    return InMemoryEpisodeStore()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("file", help="Prescription image or PDF")
    ap.add_argument("--patient-id", default="demo-patient-01")
    ap.add_argument("--store", choices=["memory", "firestore"], default="memory")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.is_file():
        sys.exit(f"File not found: {path}")

    store = build_store(args.store)
    episode_id = f"ep_{uuid.uuid4().hex[:6]}"
    narrate = lambda msg: print(f"  {msg}", file=sys.stderr)  # noqa: E731

    ep = new_episode(episode_id, args.patient_id, path.name)
    store.put(ep)
    print(f"[created] {episode_id} ({args.store} store) -> {ep.state}", file=sys.stderr)

    coordinator.process_new_episode(
        store, episode_id, str(path),
        source_file_url=str(path.resolve()), on_step=narrate,
    )

    final = store.get(episode_id)
    print(json.dumps(final.model_dump(), indent=2, ensure_ascii=False))
    print("\ntimeline:", file=sys.stderr)
    for t in final.timeline:
        print(f"  {t.at} [{t.actor}] {t.action} — {t.detail or ''}", file=sys.stderr)
    nxt = "diagnostics_agent (report -> trend -> consult)" if final.state == "AWAITING_REPORT" else "resolve NEEDS_HUMAN"
    print(f"\nEpisode {episode_id} is in {final.state}. Next: {nxt}.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
