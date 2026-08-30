"""Google Cloud Storage — the lab "inbox" for autonomous report pickup.

A diagnostic lab delivers a report by dropping a file at
    gs://{bucket}/inbox/{patient_id}/<filename>
The scheduler tick (coordinator.tick) polls this inbox and, when it finds a report
for a patient with an episode in AWAITING_REPORT, ingests it automatically — no
human upload. This is what makes the report step autonomous rather than a manual
action (the whole point of the project: remove human friction).

The google-cloud-storage import is lazy so the rest of the backend and the
in-memory tests run without the dependency or GCS access.
"""

from __future__ import annotations

import os

_INBOX_PREFIX = "inbox"


def bucket_name() -> str:
    return os.getenv("DOCUMENTS_BUCKET", "care-episode-agent-documents")


def _bucket():
    from google.cloud import storage  # lazy

    client = storage.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))
    return client.bucket(bucket_name())


def list_reports(patient_id: str) -> list[str]:
    """Blob names of reports delivered for this patient (oldest-ish first)."""
    prefix = f"{_INBOX_PREFIX}/{patient_id}/"
    blobs = _bucket().list_blobs(prefix=prefix)
    # Skip the folder placeholder itself; keep actual files.
    return sorted(b.name for b in blobs if not b.name.endswith("/"))


def download(blob_name: str) -> bytes:
    return _bucket().blob(blob_name).download_as_bytes()


def delete(blob_name: str) -> None:
    """Remove a delivered report once ingested, so it isn't reprocessed."""
    _bucket().blob(blob_name).delete()


def deliver(patient_id: str, local_path: str) -> str:
    """Upload a local file into the patient's inbox (simulates the lab sending a
    report). Returns the blob name."""
    from pathlib import Path

    name = f"{_INBOX_PREFIX}/{patient_id}/{Path(local_path).name}"
    _bucket().blob(name).upload_from_filename(local_path)
    return name
