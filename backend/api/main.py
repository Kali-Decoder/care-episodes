"""FastAPI service — the endpoints Neeraj's UI calls (api-contract.md §2).

The heavy work (Gemini calls) runs in BackgroundTasks so uploads return
immediately in their initial state and the UI polls GET as the episode advances
— exactly the contract's flow. The coordinator owns the state machine; this file
is just HTTP: parse the request, kick off work, shape the response.

Run locally:  uvicorn api.main:app --reload --port 8080   (from backend/)

NOTE on Cloud Run: BackgroundTasks need CPU after the response returns. Deploy
with --no-cpu-throttling (or min-instances=1) so post-response work isn't frozen.
The /tick endpoint is the belt-and-braces path — it can re-drive stalled episodes.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import coordinator
import patients
from models import Episode, new_episode
from tools.store import InMemoryEpisodeStore

PATIENT = "demo-patient-01"  # default profile (backward compat)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", Path(__file__).resolve().parent.parent / "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _build_store():
    if os.getenv("STORE_BACKEND", "memory") == "firestore":
        from tools.firestore_store import FirestoreEpisodeStore

        return FirestoreEpisodeStore(
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            database=os.getenv("FIRESTORE_DATABASE", "(default)"),
        )
    return InMemoryEpisodeStore()


store = _build_store()

app = FastAPI(title="Care Episode Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo: single patient, no auth (build-plan scope cut)
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")


def _error(status: int, code: str, message: str, *, action_hint: str = "", retryable: bool = False):
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message,
                           "action_hint": action_hint, "retryable": retryable}},
    )


async def _save_upload(episode_id: str, kind: str, file: UploadFile) -> Path:
    suffix = Path(file.filename or "").suffix or ".bin"
    dest_dir = UPLOAD_DIR / episode_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{kind}{suffix}"
    dest.write_bytes(await file.read())
    return dest


@app.get("/")
def health():
    return {"ok": True, "service": "care-episode-agent"}


@app.get("/api/patients")
def list_patients():
    """The selectable demo profiles (no auth — "pick who you are")."""
    return {"patients": patients.list_profiles()}


@app.post("/api/episodes", status_code=201)
async def create_episode(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: str = Form(PATIENT),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
):
    """Upload a prescription -> new episode in PRESCRIPTION_RECEIVED (contract §2).

    Optional `lat`/`lng` (the patient's device location, if shared) pinpoint the
    lab search; omitting them falls back to the patient profile's city."""
    episode_id = f"ep_{uuid.uuid4().hex[:6]}"
    path = await _save_upload(episode_id, "prescription", file)
    ep = new_episode(episode_id, patient_id, file.filename or "prescription")
    store.put(ep)

    src = f"/files/{episode_id}/{path.name}"
    background.add_task(
        coordinator.process_new_episode, store, episode_id, str(path),
        source_file_url=src, lat=lat, lng=lng,
    )
    return ep.model_dump()


@app.get("/api/episodes")
def list_episodes(patient_id: str = PATIENT):
    """Episodes for a profile. `patient_id` defaults to demo-patient-01 so the
    original single-patient frontend keeps working."""
    return {"episodes": [ep.summary() for ep in store.list_for_patient(patient_id)]}


@app.get("/api/episodes/{episode_id}")
def get_episode(episode_id: str):
    ep = store.get(episode_id)
    if ep is None:
        return _error(404, "NOT_FOUND", "Episode not found")
    return ep.model_dump()


@app.post("/api/episodes/{episode_id}/report", status_code=202)
async def upload_report(episode_id: str, background: BackgroundTasks, file: UploadFile = File(...)):
    """Upload a lab report -> REPORT_RECEIVED, then diagnostics runs (contract §2)."""
    ep = store.get(episode_id)
    if ep is None:
        return _error(404, "NOT_FOUND", "Episode not found")
    if ep.state != "AWAITING_REPORT":
        return _error(
            409, "INVALID_STATE",
            f"Cannot upload a report while the episode is {ep.state}.",
            action_hint="A report is expected once the episode is awaiting results.",
        )

    path = await _save_upload(episode_id, "report", file)
    coordinator.mark_report_received(store, episode_id, upload_name=file.filename or "report")
    background.add_task(
        coordinator.ingest_report, store, episode_id,
        report_path=str(path), source_file_url=f"/files/{episode_id}/{path.name}",
    )
    return store.get(episode_id).model_dump()


@app.post("/api/episodes/{episode_id}/retry")
def retry_episode(episode_id: str, background: BackgroundTasks):
    """Retry after NEEDS_HUMAN. Reprocesses from the saved prescription if present."""
    ep = store.get(episode_id)
    if ep is None:
        return _error(404, "NOT_FOUND", "Episode not found")

    coordinator.retry(store, episode_id)
    saved = sorted((UPLOAD_DIR / episode_id).glob("prescription.*")) if (UPLOAD_DIR / episode_id).is_dir() else []
    if saved:
        src = f"/files/{episode_id}/{saved[0].name}"
        background.add_task(
            coordinator.process_new_episode, store, episode_id, str(saved[0]), source_file_url=src
        )
    return store.get(episode_id).model_dump()


@app.post("/api/tick")
def tick():
    """Cloud Scheduler wake-up (contract §2 — internal). Picks up delivered lab
    reports autonomously and nudges waiting episodes."""
    return coordinator.tick(store)
