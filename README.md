# Care Episode Agent

**Google "All Things Agentic" Hackathon — Taskmaster track**

An autonomous agent that manages a patient's **care episode end to end** — not as a one-shot chatbot, but as something that carries a single medical episode forward over days, deciding at each step whether to act.

A patient uploads a doctor's prescription. The agent reads it, identifies and prioritises the diagnostic tests ordered, finds nearby labs, sends real booking-request emails and calendar holds, then **waits** (possibly for days) until a lab report arrives. When it does, the agent extracts the values, compares them against the patient's history, and books a follow-up consultation **only when something has meaningfully changed.**

The demo is not "can Gemini read a PDF." It is: **one episode, multiple systems, real waiting, autonomous resumption.**

---

## Live demo

| Surface | URL |
|---|---|
| **Frontend** (Firebase Hosting) | https://care-episode-agent.web.app |
| **Backend** (Cloud Run) | https://care-episode-agent-rvudzlzbla-el.a.run.app |

No login required. Pick a demo patient profile on launch, upload a prescription, and follow the episode timeline as agents work.

> **Not medical advice.** The agent summarises and flags; it never diagnoses. Every analysis carries a disclaimer. Unreadable or ambiguous inputs escalate to a human (`NEEDS_HUMAN`) rather than being guessed at.

---

## What this project demonstrates

Most health AI demos stop at document extraction. This one shows **agentic continuity**:

1. **Prescription intake** — Gemini reads a real prescription (including handwriting), extracts tests, medicines, diagnosis, and urgency.
2. **Lab logistics** — An ADK agent with a Places tool finds nearby diagnostic labs, reasons about the best choice, and sends booking requests.
3. **The wait** — The episode sits in `AWAITING_REPORT`. In production this can be days. Cloud Scheduler wakes waiting episodes so the agent resumes without the patient re-prompting.
4. **Report analysis** — When a report is uploaded, values are extracted, flagged against reference ranges, and trended against prior results stored in Firestore.
5. **Significance decision** — A Pro-tier model decides whether the change is meaningful enough to warrant a consult — not every abnormal value triggers alarm.
6. **Follow-up action** — If warranted, a consultation is requested. If not, the episode closes calmly.

Every step appends to `episode.timeline[]`. **The timeline is the demo** — the UI renders it in order so you can watch the agent work.

---

## Demo patient profiles

There is no authentication. Users pick one of three pre-seeded demo profiles (each with a different scenario):

| Profile | `patient_id` | City | Scenario |
|---|---|---|---|
| Shashank Shekhar | `demo-patient-01` | Kolkata | Rising trend · anomaly flagged |
| Neeraj Choubisa | `neeraj` | Udaipur, Rajasthan | All normal · episode closed |
| Rakesh Kumar | `rakesh` | Bangalore | New patient · awaiting report |

Switch profiles from the dashboard header to see how the agent handles different patient histories. Episodes, uploads, and analytics are scoped per profile.

---

## Episode state machine

The backend drives a **12-state machine**. The UI must handle every state, including the failure path.

```
PRESCRIPTION_RECEIVED → TESTS_IDENTIFIED → LABS_SHORTLISTED → BOOKING_REQUESTED
  → AWAITING_REPORT → REPORT_RECEIVED → TRENDS_ANALYZED
  → ANOMALY_FOUND | NORMAL → CONSULT_REQUESTED → CLOSED
```

`NEEDS_HUMAN` is reachable from **any** live state (unreadable prescription, no labs found, extraction failed, etc.) and is retryable.

The **Episode object** is the frozen contract between frontend and backend — see `backend/docs/api-contract.md` (mirrored in `client/api-contract.md` and `client/src/care/types.ts`). The episode grows over time; early states have mostly null fields.

Full diagrams: **[ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## Architecture

Three **ADK specialist agents** do the intelligent work. A **deterministic root coordinator** (`backend/coordinator.py`) owns the state machine — the LLM never decides transitions, so episodes advance safely, idempotently, and resumably across days.

```
prescription → intake (ADK, Gemini 3.5 Flash) → tests + urgency
             → logistics (ADK, Places tool) → lab selected → Gmail + Calendar
             → AWAITING_REPORT ……… (Cloud Scheduler wakes it) ………
report       → diagnostics (ADK, Flash extract + Pro significance)
             → compare vs history → NORMAL | ANOMALY → consultation if needed
```

| Component | Role |
|---|---|
| **intake_agent** | Reads prescription, structured output (tests, medicines, urgency) |
| **logistics_agent** | Tool-using ADK agent — finds labs via Places, sends booking emails |
| **diagnostics_agent** | Extracts report values, computes trends, decides significance |
| **coordinator.py** | Deterministic state machine driver — reads state, runs the right leg |
| **Firestore** | Episode state, patient history, idempotency keys |
| **Cloud Scheduler** | Hits `POST /api/tick` to nudge `AWAITING_REPORT` episodes |

**Idempotency:** every booking claims `{episode_id}:{test_code}:{attempt}` in Firestore *before* the side effect, so a duplicate scheduler fire or mid-send crash cannot double-book.

---

## Hackathon requirements

| Requirement | How | Where |
|---|---|---|
| **Gemini 3.5+** | Gemini **3.5 Flash** for extraction & classification (~90% of calls); Gemini **3.1 Pro** for the significance decision | `backend/agents/*.py` |
| **Google agent framework (ADK)** | Three ADK `LlmAgent` specialists via ADK `Runner`; structured output + tool-calling | `backend/agents/adk.py`, `agents/*.py` |
| **Google Cloud service** | **Cloud Run** + **Firestore** + Cloud Scheduler, Vertex AI, Places, Gmail, Calendar | `backend/api`, `backend/tools`, `deploy.sh` |

> `gemini-3.5-pro` is not available to this GCP project, so the single significance call uses `gemini-3.1-pro-preview`. All extraction runs on `gemini-3.5-flash`.

---

## Repo layout

Monorepo with two siblings:

```
care-episodes/
├── backend/                 Python — ADK agents, coordinator, FastAPI, tools, tests
│   ├── agents/              intake · logistics · diagnostics (ADK) + adk.py plumbing
│   ├── coordinator.py       deterministic root coordinator (12-state machine)
│   ├── state/               state machine + idempotency
│   ├── tools/               Firestore store · Places · Gmail · Calendar · OAuth
│   ├── api/main.py          FastAPI service (endpoints the UI calls)
│   ├── docs/                api-contract.md · build plan · status.md
│   ├── scripts/             extraction proofs, Firestore smoke test
│   ├── Dockerfile · deploy.sh
│   └── tests/               pytest (state machine, agents, coordinator, API)
│
├── client/                  Next.js UI (Firebase Hosting), mock-first
│   ├── src/care/            Care Episode product (primary)
│   │   ├── api.ts           single API client (mock / live switch)
│   │   ├── context/         PatientContext (profile picker)
│   │   ├── pages/           Dashboard, Episode detail, Episodes list, Analytics
│   │   └── components/      Timeline, Labs, Bookings, Results, Upload, etc.
│   ├── src/renderer/        Legacy MedLifeSim simulation UI (kept for internal use)
│   └── public/mocks/        one JSON payload per episode state (01–09)
│
├── ARCHITECTURE.md          system + state diagrams
└── README.md                this file
```

---

## API overview

Base URL: `NEXT_PUBLIC_API_BASE_URL` (see `client/.env.example`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/patients` | List demo patient profiles |
| `GET` | `/api/episodes?patient_id=` | List episodes for a profile |
| `POST` | `/api/episodes` | Upload prescription (`file` + `patient_id`) |
| `GET` | `/api/episodes/{id}` | Full episode object (poll while active) |
| `POST` | `/api/episodes/{id}/report` | Upload lab report |
| `POST` | `/api/episodes/{id}/retry` | Retry after `NEEDS_HUMAN` |
| `POST` | `/api/tick` | Internal — Cloud Scheduler only |

Full contract: `backend/docs/api-contract.md` · `client/api-contract.md`

---

## Run locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # fill GOOGLE_CLOUD_PROJECT etc.
uvicorn api.main:app --reload --port 8080
```

Requires Google Cloud auth (`gcloud auth application-default login`) and a project with Vertex AI, Firestore, Places, Gmail, and Calendar enabled. Set `STORE_BACKEND=memory` to run without Firestore.

**Try agents without the API:**

```bash
python scripts/extract_prescription.py demo-data/<rx>.jpg
python scripts/extract_report.py       demo-data/<report>.pdf
python run_skeleton.py                 demo-data/<rx>.jpg
python run_diagnostics_demo.py
```

**Tests:**

```bash
pip install -r requirements-dev.txt
pytest
```

### Frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev       # http://localhost:3000
```

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `true` | In-memory mock API — no backend needed |
| `NEXT_PUBLIC_API_BASE_URL` | — | Live Cloud Run URL when mocks are off |

Set `NEXT_PUBLIC_USE_MOCKS=false` and point `NEXT_PUBLIC_API_BASE_URL` at your backend to run against the live service.

**Cache gotcha:** production builds set `output: 'export'`. If `next dev` breaks after a build, run `rm -rf .next && npm run dev`.

**Verify:** `npm run build` (runs TypeScript check; no separate test/lint scripts).

---

## Deploy

### Backend (Cloud Run)

```bash
cd backend
bash deploy.sh
```

Deploys with `--no-cpu-throttling` (background work after response), `--max-instances 5`, secrets from Secret Manager (Places key, OAuth creds). Cloud Scheduler wires to `POST /api/tick`.

**Pause the scheduler when not demoing** to avoid keeping an instance warm:

```bash
gcloud scheduler jobs pause care-episode-tick --location asia-south1
```

### Frontend (Firebase Hosting)

```bash
cd client
npm run build          # static export → out/
firebase deploy --only hosting
```

Build bakes in `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_USE_MOCKS` at build time — rebuild and redeploy after changing them.

---

## Frontend design

The UI is **mock-first**. `client/src/care/api.ts` is the single switch between in-memory mocks and the live backend.

**Care Episode routes** (primary product):

- `/` — landing page with profile picker
- `/dashboard` — upload, active episode, needs attention, recent episodes
- `/dashboard/episode?id=…` — timeline-driven detail view
- `/dashboard/episodes` — full episode history
- `/dashboard/analytics` — pipeline stats and parameter trends

**Legacy MedLifeSim UI** (`src/renderer/`) — chat, simulations, training — kept for internal use. `react-router-dom` is shimmed to Next.js App Router in `src/shims/react-router-dom.tsx`.

---

## Demo notes

- **The timeline is the demo.** Every agent action appends to `episode.timeline[]`.
- **The wait is real; the clock can be compressed.** Episodes sit in `AWAITING_REPORT` for days in production. A demo scheduler cadence can compress that for recording — the agent does the same work on a shorter clock.
- **Booking is a request, not a confirmed slot.** No Indian lab exposes a booking API. The agent sends a real Gmail booking-request email and creates a tentative Calendar hold — both genuine API calls with visible results.
- **Do not commit secrets or patient documents.** `.env*`, service-account keys, and `demo-data/` are gitignored. Anonymise real medical documents before they enter the repo.

---

## Documentation

| Doc | Purpose |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System diagram, state machine, agent table |
| [backend/docs/status.md](./backend/docs/status.md) | Live build status — read first in any session |
| [backend/docs/care-episode-agent-build-plan.md](./backend/docs/care-episode-agent-build-plan.md) | Full scope, timeline, architecture spec |
| [backend/docs/api-contract.md](./backend/docs/api-contract.md) | Frozen API contract (backend) |
| [client/api-contract.md](./client/api-contract.md) | Same contract (frontend mirror) |
| [CLAUDE.md](./CLAUDE.md) | Conventions for AI coding assistants |

---

## Team

Shashank — agent, backend, deployment  
Neeraj — UI, frontend deployment

Built for Google's All Things Agentic hackathon, Taskmaster track.
