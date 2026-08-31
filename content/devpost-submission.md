# Devpost submission — Nani AI

Copy-paste into the Devpost fields. Fill the bracketed links before submitting.

**Tagline (one line):**
Nani AI — an autonomous care-episode agent that carries one medical episode forward over days: reads the prescription, books the labs, waits, picks up the report on its own, and flags a follow-up only when something has meaningfully changed.

**Category:** Taskmaster

**Links:**
- Live app: https://care-episode-agent.web.app
- Backend (Cloud Run): https://care-episode-agent-rvudzlzbla-el.a.run.app
- Repo: [GitHub URL]
- Demo video: [YouTube URL]

---

## Inspiration
We collect prescriptions, run lab tests, and pile up reports — but nobody connects them. The signal that actually matters — a value quietly drifting the wrong way across visits — slips through, because no one is holding the whole thread. We wanted an agent that does what a caring grandmother would: keep track over time and speak up only when something's wrong. Hence **Nani AI**.

## What it does
Nani AI manages a patient's care episode end to end:
1. Reads a doctor's prescription (including handwriting), extracts the tests ordered, and flags what's urgent.
2. Finds nearby diagnostic labs (in the patient's own city), reasons about the best one, and sends a real booking-request email + calendar hold.
3. Waits — possibly for days — with nothing running.
4. When the lab delivers the report, it **picks it up autonomously** (no human upload), extracts the values and the reference ranges printed on the report, and compares them against the patient's history.
5. Decides significance with a Pro-tier model and books a follow-up consultation **only when a value has meaningfully changed** — with a plain-language summary. All-clear episodes close calmly; a prescription with no tests simply completes.

The point isn't document reading — it's **one episode carried forward autonomously, across systems, over time.**

## How we built it
- **Agents:** three ADK `LlmAgent` specialists — intake, logistics (tool-using, Google Places), diagnostics — on **Gemini 3.5 Flash** (extraction/classification) and **Gemini 3.1 Pro** (the one significance decision), via **Vertex AI**.
- **Orchestration:** a deterministic root coordinator drives a 12-state machine, so a language model never decides a medical state transition — the episode advances safely, idempotently, and resumably.
- **Cloud:** **Cloud Run** (FastAPI service, scale-to-zero), **Firestore** (episode state, patient history, idempotency keys), **Cloud Storage** (the lab "inbox" the agent auto-picks reports from), **Cloud Scheduler** (the heartbeat that wakes waiting episodes and ingests delivered reports), **Gmail** + **Calendar** (real booking + consult actions), **Firebase Hosting** (the Next.js UI), no-auth multi-patient profiles.
- **Safety:** summarise and flag, never diagnose; every analysis carries a disclaimer; unreadable/ambiguous inputs escalate to `NEEDS_HUMAN`.

## Challenges we ran into
- **Handling the wait.** Cloud Run scales to zero and holds no memory, so the episode had to survive with nothing running — state persisted to Firestore before each step, and a scheduler to resume.
- **Removing the human from the loop.** Our first cut had the patient upload the report; we caught that a manual upload is exactly the friction we set out to remove, and rebuilt it as autonomous pickup from a Cloud Storage inbox.
- **Idempotency.** Cloud Scheduler can fire twice; every side effect claims a key before acting, so nothing double-books.
- **No booking/lab APIs exist** for Indian labs, so we send real booking-request emails + calendar holds rather than faking a booking screen.

## Accomplishments we're proud of
An agent that genuinely acts on its own across five Google services and multiple days — and knows when *not* to act (all-clear closes quietly; only meaningful change triggers a consult).

## What we learned
Deterministic orchestration + LLM specialists is the right split for a safety-critical flow: let the models do the reading and judgment, but never let them drive state.

## What's next
Real lab/Gmail inbound integration, coverage checks on ordered tests, and per-user accounts.

## Built with
ADK · Gemini 3.5 Flash · Gemini 3.1 Pro · Vertex AI · Cloud Run · Firestore · Cloud Storage · Cloud Scheduler · Places API (New) · Gmail API · Calendar API · Firebase Hosting · FastAPI · Next.js.
