# Care Episode Agent

**Google "All Things Agentic" Hackathon — Taskmaster track**

An autonomous agent that manages a patient's **care episode end to end**. A patient
uploads a doctor's prescription; the agent identifies and prioritises the diagnostic
tests ordered, finds nearby labs and requests bookings, then **waits — possibly for
days —** and resumes when the lab report arrives to extract the values, compare them
against the patient's history, and book a follow-up consultation **only when
something has meaningfully changed.**

The point being demonstrated is not document reading. It is **one medical episode
carried forward autonomously over time, with the agent deciding at each fork whether
to act** — across Vertex AI, Places, Gmail, Calendar and Firestore.

**Live backend:** `https://care-episode-agent-rvudzlzbla-el.a.run.app`

> ⚕️ **Not medical advice.** The agent summarises and flags; it never diagnoses.
> Every analysis carries a disclaimer, and anything unreadable or ambiguous is
> escalated to a human rather than guessed at.

---

## Hackathon requirements — where they're met

| Requirement | How | Where |
|---|---|---|
| **Gemini 3.5+** | Gemini **3.5 Flash** for all document extraction & classification (~90% of calls); Gemini **3.1 Pro** for the one significance decision | `backend/agents/*.py` |
| **Google agent framework (ADK)** | Three ADK `LlmAgent` specialists (intake, logistics, diagnostics) run via ADK `Runner`; structured output + tool-calling | `backend/agents/adk.py`, `agents/*.py` |
| **Google Cloud service** | **Cloud Run** (FastAPI service) + **Firestore** (episode state, patient history, idempotency); Cloud Scheduler, Vertex AI, Places, Gmail, Calendar | `backend/api`, `backend/tools`, `deploy.sh` |

> Note on model routing: `gemini-3.5-pro` is not available to this GCP project, so
> the single significance call uses `gemini-3.1-pro-preview`. All extraction /
> classification (the bulk) runs on `gemini-3.5-flash`, satisfying the 3.5+ bar.

---

## Architecture

Three **ADK specialist agents** do the intelligent work; a **deterministic state
machine** is the root coordinator, guaranteeing the 12-state medical episode
advances safely, idempotently, and resumably across days. See
**[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full diagrams.

```
prescription → intake (ADK, Flash) → tests + urgency
             → logistics (ADK, Places tool) → lab selected → REAL booking email + calendar hold
             → AWAITING_REPORT ……… (Cloud Scheduler wakes it) ………
report       → diagnostics (ADK, Flash extract + 3.1 Pro significance)
             → compare vs history → NORMAL  |  ANOMALY → consultation requested
```

**Idempotency:** every booking claims `{episode_id}:{test_code}:{attempt}` in
Firestore *before* the side effect (atomic create), so a duplicate scheduler fire or
a mid-send crash can't double-book.

---

## Repo layout

```
backend/          Python — ADK agents, coordinator, FastAPI, tools, tests
  agents/         intake · logistics · diagnostics (ADK) + adk.py plumbing
  coordinator.py  deterministic root coordinator (the 12-state machine driver)
  state/          state machine + idempotency
  tools/          firestore store · places · gmail · calendar · oauth
  api/main.py     FastAPI service (the endpoints the UI calls)
  docs/           api-contract.md (frozen) · build plan · status.md
  scripts/        extraction proofs, Firestore smoke test
  Dockerfile · deploy.sh
frontend/client/  Next.js UI (Firebase Hosting), mock-first
```

The **Episode object** and its 12 states are the frozen contract shared by both
sides — `backend/docs/api-contract.md`, mirrored in `frontend/client/src/care/types.ts`.

---

## Run the backend locally

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # fill GOOGLE_CLOUD_PROJECT etc.; see comments
uvicorn api.main:app --reload --port 8080
```

Requires Google Cloud auth: `gcloud auth application-default login` and a project
with Vertex AI, Firestore, Places, Gmail and Calendar enabled. Set
`STORE_BACKEND=memory` to run with no Firestore (in-memory store).

**Try the agents without the API:**

```bash
python scripts/extract_prescription.py demo-data/<rx>.jpg   # intake proof
python scripts/extract_report.py       demo-data/<report>.pdf # diagnostics proof
python run_skeleton.py                 demo-data/<rx>.jpg     # rx -> booking -> AWAITING_REPORT
python run_diagnostics_demo.py                               # falling-Hb -> anomaly -> consult
```

**Tests:**

```bash
pip install -r requirements-dev.txt
pytest            # 52 tests: state machine, idempotency, agents, coordinator, API
```

---

## Run the frontend locally

```bash
cd frontend/client
npm install
cp .env.example .env.local
npm run dev       # http://localhost:3000/welcome
```

Set `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_BASE_URL=<backend url>` to
run against the live backend; leave mocks on to run the whole UI with no backend.

---

## Deploy

```bash
cd backend
bash deploy.sh    # builds + deploys to Cloud Run, wires Cloud Scheduler -> /api/tick
```

Deploys with `--no-cpu-throttling` (background work), `--max-instances 5`, secrets
from Secret Manager (Places key, OAuth creds). **Pause the scheduler when not
demoing** — `gcloud scheduler jobs pause care-episode-tick --location asia-south1` —
to avoid keeping an instance warm.

---

## Demo notes

- **The timeline is the demo.** Every agent action appends to `episode.timeline[]`,
  which the UI renders in order.
- **The wait is real, the clock is compressed.** In production the episode sits in
  `AWAITING_REPORT` for days; a `DEMO_MODE` scheduler cadence compresses that for the
  video. The agent does the same work on a shorter clock — nothing is faked.
- **Booking is a request, not a booking.** No Indian lab exposes a booking API, so
  the agent sends a real booking-request email (Gmail) and holds a real tentative
  calendar slot (Calendar) — both genuine API calls with visible results.

## Team

Shashank (agent, backend, deployment) · Neeraj (UI, frontend deployment).
