# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An autonomous **Care Episode Agent** built for Google's "All Things Agentic" hackathon (Taskmaster track). A patient uploads a doctor's prescription; the agent extracts and prioritises the tests ordered, finds nearby labs, requests bookings by email + calendar hold, then **waits days** and resumes when the lab report arrives to extract values, compare against history, and book a follow-up consultation only if something meaningfully changed. The whole point being demonstrated is one medical episode carried forward autonomously over days — not document reading.

Read `backend/docs/status.md` first in any session — it is the shared running context ("read it first, edit it last"). `backend/docs/care-episode-agent-build-plan.md` is the full architecture/scope/timeline spec.

## Repo layout

Monorepo with two siblings at the root:

- `client/` — the Next.js app (frontend), the MedLifeSim/naniai UI repurposed for the Care Episode product; all UI code lives here. Owned by Neeraj and kept at the repo root (the earlier plan to rename it `frontend/` was dropped to avoid disrupting his workflow).
- `backend/` — the Python **ADK + FastAPI** agent service, built and deployed to Cloud Run. Read `backend/docs/status.md` for the live state.

## Commands

All frontend work runs from `client/`:

```bash
cd client
npm install
cp .env.example .env.local
npm run dev          # next dev, http://localhost:3000/welcome
npm run build        # static export -> out/ (production only)
firebase deploy --only hosting   # deploys out/ per firebase.json
```

There is **no test framework, linter script, or typecheck script** configured. Verification is `npm run build` (which runs `next build` / TypeScript).

**Cache gotcha:** `next.config.ts` sets `output: 'export'` only when `NODE_ENV=production`. After a production build, `next dev` can break — fix with `rm -rf .next && npm run dev`.

## Architecture

### The Episode object is the contract

Everything centers on one JSON shape — the **Episode object** — and a **12-state machine** (`PRESCRIPTION_RECEIVED → TESTS_IDENTIFIED → LABS_SHORTLISTED → BOOKING_REQUESTED → AWAITING_REPORT → REPORT_RECEIVED → TRENDS_ANALYZED → ANOMALY_FOUND | NORMAL → CONSULT_REQUESTED → CLOSED`, plus `NEEDS_HUMAN` reachable from any state).

The contract is **frozen** and duplicated in `backend/docs/api-contract.md` and `client/api-contract.md`. It defines the Episode shape, endpoints, enumerated values, nullability rules (the episode grows over time — early states are mostly null, code defensively), and error codes. **Any change must be agreed by both sides and appended to the contract's change log (section 8) — if it's not in that file, it's not in the API.** The frontend mirrors this shape in `client/src/care/types.ts`.

### Frontend: mock-first

The UI is built to run fully without a backend, gated by `NEXT_PUBLIC_USE_MOCKS` (default `true`):

- `src/care/api.ts` — the single API client. Every function branches on `USE_MOCKS`: mock mode drives an in-memory `store` with `setTimeout`-based state progression (`advanceMock`); live mode hits `NEXT_PUBLIC_API_BASE_URL`. When wiring the real backend, this file is the only switch.
- `src/care/mockEpisodes.ts` / `mockLoader.ts` — seed episodes and the per-state JSON payloads in `public/mocks/` (`01-...` through `09-...`, one per state).
- `src/care/pages/` — `CareHomePage`, `CareDashboardPage`, `CareEpisodePage` (the timeline-driven detail view). `src/care/components/` holds the cards (Labs, Bookings, Results, Prescription, Consultation, Timeline, etc.).
- The `timeline[]` array on the episode **is** the demo — every agent action appends to it and the UI renders it in order.

### Two product surfaces coexist

1. **Care Episode** (primary, new) — `src/care/*`, routes `/welcome`, `/dashboard`, `/dashboard/episode?id=...`.
2. **Legacy MedLifeSim simulation UI** (kept for internal use) — `src/renderer/*` (originally a Vite/Electron app) and the `src/app/(app)/` route group (chat, simulations, training, etc.), plus `src/preload/` type defs.

Because the legacy code was written for react-router, **`react-router-dom` is shimmed** to Next.js App Router navigation in `src/shims/react-router-dom.tsx` (aliased in both `next.config.ts` turbopack/webpack and `tsconfig.json` paths). `useNavigate`, `useParams`, `NavLink`, `Navigate`, etc. map onto `next/navigation`. When editing legacy renderer code, import router primitives from `react-router-dom` as-is — the shim handles it.

### Backend (built & deployed)

Python **ADK + FastAPI** service. A **deterministic root coordinator** (`backend/coordinator.py`) drives the 12-state machine and decides which specialist runs next; the intelligence is in **three ADK `LlmAgent` specialists** (`backend/agents/`): intake, logistics (tool-using, Google Places), diagnostics (Flash extract + a Pro model for significance). Firestore (`backend/tools/firestore_store.py`) holds episode state + patient history + **idempotency keys** (`{episode_id}:{test_code}:{attempt}`, claimed before every send). FastAPI (`backend/api/main.py`) on Cloud Run; Cloud Scheduler hits `/api/tick` to wake `AWAITING_REPORT` episodes. Real Gmail + Calendar for bookings. Run/test/deploy details are in the root `README.md`; live state in `backend/docs/status.md`. Note: agent function signatures are stable — internals run through ADK, so tests monkeypatch the agent functions.

## Conventions & constraints

- **Medical safety framing is non-negotiable:** the agent summarises and flags, never diagnoses; every analysis output carries a disclaimer; ambiguous/unreadable inputs go to `NEEDS_HUMAN` rather than being guessed.
- Single hardcoded demo patient `demo-patient-01`; no auth, no multi-user (deliberately cut).
- Do not reintroduce cut scope: insurance, policy renewals, login. See build plan §2.
- Never commit `.env*`, service-account keys (`client_secret.json`), `venv/`, or patient documents — the repo is public for submission. Anonymise any real medical documents before they touch the repo.
