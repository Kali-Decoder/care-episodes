<!--
HANDOFF NOTES FOR RAKESH (delete this whole comment block before publishing):
- Platform: Medium (or dev.to). Must be PUBLIC, not unlisted.
- The italic disclosure line near the top is REQUIRED by the hackathon rules — keep it.
- Fill in: author byline, and (optional) add screenshots where marked [SCREENSHOT].
- Good screenshots to grab from https://care-episode-agent.web.app :
    1) the episode timeline showing agent actions in order
    2) the results table with the ESR trend (22 -> 43 -> 45)
    3) the architecture diagram from ARCHITECTURE.md (renders on GitHub)
- Suggested tags: Google Cloud, AI Agents, Gemini, Healthcare, Hackathon
- Links to include: live app + GitHub repo (paste once the repo is public).
-->

# Building an Autonomous Care Episode Agent for Google's "All Things Agentic" Hackathon

*This post was created for the purpose of entering Google's All Things Agentic Hackathon.*

## The problem nobody wants to manage

A doctor hands you a prescription. It orders four tests. You find a lab, book them, wait days for the results — and then the report sits in a drawer, never compared against the last time you got the same tests done. The trend that actually matters (a value quietly drifting the wrong way across three visits) is invisible, because no single person is holding the whole thread.

That thread — one **care episode**, carried forward over days — is exactly what an agent is good at. So we built one.

## What it does

The **Care Episode Agent** takes a prescription and runs the whole episode end to end:

1. **Reads the prescription** (including handwritten ones), extracts the tests ordered and the diagnosis, and flags which tests are urgent.
2. **Finds nearby diagnostic labs**, reasons about which one to use (open now, well-rated, close), and **requests a booking** — a real email plus a tentative calendar hold.
3. **Waits.** Possibly for days. This is the interesting part.
4. **Picks up the lab report on its own** when it arrives, extracts the values *and the reference ranges printed on the report itself*, and compares them against the patient's history.
5. **Decides if anything meaningfully changed** — and books a follow-up consultation only if it did, with a plain-language summary.

The point we set out to demonstrate isn't document reading. It's an agent **acting on its own, across multiple systems, over time** — deciding at each fork whether to act.

## The architecture: three ADK agents, one deterministic brain

We built on Google's **Agent Development Kit (ADK)** with three specialist `LlmAgent`s:

- **Intake agent** — Gemini 3.5 Flash reads the prescription (natively multimodal, no separate OCR step) and returns structured JSON.
- **Logistics agent** — a *tool-using* agent that calls the Google Places API, then reasons about which lab to pick.
- **Diagnostics agent** — extracts the report values, then uses a Pro-tier Gemini model for the one decision where reasoning quality actually matters: *is this change clinically meaningful?*

The one deliberate design choice we're proud of: **the orchestrator is not an LLM.** A deterministic state machine (a 12-state coordinator) decides which specialist runs next and guarantees the episode advances safely, idempotently, and resumably. In a medical workflow, you do not want a language model deciding state transitions. The agents do the intelligent work; the state machine keeps it safe. That separation is the whole game.

[SCREENSHOT: architecture diagram]

## The hard parts (and the decisions we made)

**Handling the wait.** Cloud Run scales to zero and holds no memory. An episode can sit in `AWAITING_REPORT` for days with nothing running. Every state transition is written to Firestore *before* the next step, so if the container dies mid-episode, the next invocation resumes from exactly where it stopped. A Cloud Scheduler job periodically wakes waiting episodes.

**Removing the human from the loop.** Our first version had the patient *upload* the report through the UI — and we caught ourselves: a manual upload is exactly the friction this project is supposed to remove. So the report now arrives autonomously. A lab "delivers" it to a cloud inbox; the scheduler discovers it on its next tick and runs the entire diagnostics pipeline — extraction, trend analysis, significance, consultation — with **no human action at all.** That's the difference between a document reader and an agent.

**Idempotency.** Cloud Scheduler *will* fire twice, and a crash can land between "email sent" and "state written." Every booking claims a key (`episode:test:attempt`) in Firestore *before* the side effect. A duplicate fire or a mid-send crash can never produce a second booking.

**No medical reference database.** Indian lab reports print the normal range next to every value. So we extract the range *from the report itself* — which is more accurate (ranges vary by lab, age, and sex) and removes an entire subsystem.

**Model routing as cost discipline.** Gemini 3.5 Flash handles ~90% of the work (all the extraction and classification). A Pro-tier model is called exactly once per report — the significance decision — and never in a loop.

**"Booking" is honest.** No Indian diagnostic lab exposes a booking API. So we don't fake a booking screen — the agent sends a real booking-request email and creates a real tentative calendar hold. Both are genuine API calls with visible results.

**Safety, framed explicitly.** The agent summarizes and flags; it never diagnoses. Every analysis carries a disclaimer, and anything unreadable or ambiguous is escalated to a human rather than guessed at.

## The moment it all comes together

Here's a real run. Three lab reports for one patient over three months. The agent tracked the **ESR** (an inflammation marker):

```
Report 1 (June):  ESR 22   — normal
Report 2 (July):  ESR 43   — high, rising
Report 3 (Aug):   ESR 45   — high, still rising
```

The agent didn't just read the newest number. It saw the *trend* across all three, recognized the value had moved out of range and kept climbing, and recommended a consultation — in plain language, with a disclaimer. That's the whole thesis in one screenshot.

[SCREENSHOT: results table with the ESR trend]

## The stack

- **ADK** (Python) — three specialist agents
- **Gemini via Vertex AI** — 3.5 Flash for extraction/classification, a Pro model for significance
- **Cloud Run** — the FastAPI agent service (scale-to-zero)
- **Firestore** — episode state, patient history, idempotency keys
- **Cloud Scheduler** — the autonomous heartbeat
- **Google Places / Gmail / Calendar APIs** — real-world actions
- **Firebase Hosting** — the patient-facing UI
- 50+ unit tests, including the double-fire idempotency guard

## What's next

Multi-patient support with auth, richer lab-email parsing, and coverage checks on the ordered tests. But the spine — an autonomous agent that carries one medical episode forward across days and multiple systems — is done and deployed.

---

*Built for Google's All Things Agentic Hackathon (Taskmaster track). Live app and source code linked below.*

- 🔗 Live app: https://care-episode-agent.web.app
- 🔗 Code: [GitHub repo link]
