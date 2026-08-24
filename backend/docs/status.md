# Status — Care Episode Agent

**Last updated:** Aug 21, 2026
**Days to deadline:** 10 (submit by Aug 31, 5:00pm PDT = 5:30am IST Sept 1)

Update this file at the end of each working session. It is the shared context for both Claude Code and chat — read it first, edit it last.

---

## Project in one paragraph

An autonomous agent that manages a patient's care episode end to end. A patient uploads a doctor's prescription; the agent identifies and prioritises the tests ordered, finds nearby diagnostic labs, requests bookings by email and holds a calendar slot, then waits — possibly days — and resumes when the lab report arrives to extract values, compare them against the patient's history, and book a follow-up consultation only when something has meaningfully changed. Built for Google's All Things Agentic hackathon, Taskmaster track, on ADK + Gemini 3.5 Flash + Cloud Run + Firestore.

**Team:** Shashank (agent, backend, deployment), Neeraj (UI, frontend deployment). Rakesh is not currently active.

---

## Where things stand

### Done

- Track chosen: **Taskmaster**
- Idea locked: prescription → tests → labs → booking → wait → report → trend → consultation
- Scope cut: no insurance, no auth, no multi-user (see build plan section 2)
- Devpost account registered, team formed
- Architecture designed, three planning docs written
- **GCP fully provisioned** (project `care-episode-agent`) — 11 APIs, Firestore Native in asia-south1, storage bucket, service account with 4 roles, both secrets stored, Places key restricted, OAuth consent screen configured, refresh token generated
- `check_setup.sh` audit script written and passing
- **Next-action #1 PROVEN (Aug 21): Gemini reads a real HANDWRITTEN prescription cleanly.** `scripts/extract_prescription.py` extracted a real acne-workup prescription end to end — doctor, date, diagnosis, 6 medicines (Indian dosing notation `1-0-1`, `H/S`, `0.025%` preserved), 9 tests with sensible codes, urgency correctly all-routine (no over-flagging), `readable=true`, 1799/657 tokens. **The riskiest assumption holds.**
- **Confirmed it was genuine handwriting recognition, not OCR passthrough.** The source PDF (Adobe-scanned) carried an embedded OCR text layer, but that layer was garbage on the handwritten clinical content (`Acne Vlgoru`, `CBPERP AFT/KF7`, `RRTSH`, page 2 illegible). Gemini's output was correct where the OCR layer was wrong → it read the handwriting visually. The "impressive case" from the build plan works; safe to say "Gemini reads the handwriting directly" in the write-up.
- **`gemini-3.5-flash` confirmed served in `asia-south1`** — closes the model-ID and Gemini-region open questions in one shot. Vertex via the modern `google-genai` SDK, structured output via `response_schema`.
- Backend Python scaffold stood up: `venv`, `requirements.txt` (google-genai 2.19.0 + python-dotenv), `.env`/`.env.example`, `.gitignore`, `demo-data/`.

### In progress

- **Episode backbone built (next-action #8).** Domain models (`models.py`) mirror the frozen contract / frontend types field-for-field, so `Episode.model_dump()` == the JSON the UI consumes == the Firestore doc. State machine (`state/machine.py`) enforces legal transitions and appends to `timeline[]` on every move; `NEEDS_HUMAN` reachable from any live state and retryable back out; `CLOSED` terminal. Idempotency (`state/idempotency.py`) = `{episode}:{test}:{attempt}` claimed before the side effect. Stores (`tools/store.py`, `tools/firestore_store.py`) behind one `EpisodeStore` interface: in-memory for dev/tests/demo-fallback, Firestore for prod (atomic `create` for the idempotency claim). **18 tests green** (`pytest.ini`, `tests/`), incl. an end-to-end double-fire guard.
- Firestore store is written but **not yet exercised against live Firestore** — only the in-memory path is tested. Live smoke test pending.
- **Walking skeleton runs end to end (next-action #9, first leg).** `run_skeleton.py`: prescription file → create episode (`PRESCRIPTION_RECEIVED`) → real Gemini intake → tests land on the episode (`TESTS_IDENTIFIED`), or `NEEDS_HUMAN` if unreadable. Verified both branches on real inputs: IMG_2070 (6–8 tests extracted, dosing shorthand intact) → `TESTS_IDENTIFIED`; a logo PNG → Gemini returns `readable=false` → `NEEDS_HUMAN` with a populated retryable error. Intake logic now shared via `agents/intake.py` (CLI script + skeleton use one code path). Runs on in-memory store; `--store firestore` available (untested). 20 tests green.
- **README + architecture diagram written (Aug 24).** Root `README.md` (submission-ready: explicit Gemini-3.5+/ADK/Cloud-Run+Firestore compliance table, run/deploy/test instructions, safety framing, live URL) and root `ARCHITECTURE.md` (Mermaid system diagram + 12-state diagram + agent table). Replaced the old placeholder README.
- **Extraction prompt tightened for consistency (Aug 24).** Report extractor now instructed to emit one entry per printed row (incl. each differential/panel component), no grouping. Verified: two runs both give 24 values, identical test set (was 23 vs 17). NOTE for the multi-report trend feature: `test_code` naming still varies run-to-run (`PLT` vs `PLATELETS`); history is keyed by test_code, so we'll need canonical codes (a normalization map or fixed enum in the prompt) before trends match reliably across reports.
- **Diagnostics verified on a REAL lab report (Aug 24) — last unrun agent path proven.** `scripts/extract_report.py` read a real multi-page CBC/renal/liver/lipid PDF: 23 values with correct printed reference ranges, `readable=true`. Full flow (`coordinator.ingest_report`, real Flash extract + real Pro significance) on the same report → all values in-range, all `first_reading` (no history) → Pro returned severity=normal, consult_needed=false with a correct "all clear" summary → `NORMAL`. No over-flagging, no invented consult. **Single-report / NORMAL scenario done; multi-report trend→anomaly still to test** (need 2-3 dated reports for one patient). Minor: extraction value count varied run-to-run (23 vs 17 — model groups the CBC differential differently even at temp 0); both valid, worth noting for demo consistency.
- **Gmail + Calendar wired — booking is now a real external action; NO stubs remain (Aug 23).** `tools/gmail.py` (send), `tools/calendar.py` (tentative hold), `tools/google_oauth.py` (refresh-token creds; scopes verified = gmail.send + calendar.events). `logistics.send_booking_request` sends one booking email + one calendar hold per episode, idempotency-guarded (`BOOKING_NOTIFY` key claimed before send), graceful no-op if OAuth unset, failures logged not fatal. Coordinator logs `sent_booking_email` + `calendar_hold` to the timeline. Live-verified: real email delivered + real calendar event created. 52 tests green. **The OAuth account is `shashank@frontier.ventures`** (sender + calendar owner); NOTIFY_EMAIL currently `shekharshashank1211@gmail.com`. Prod redeployed Aug 24 with the OAuth secret + tightened prompt (new revision live, health OK, scheduler stayed PAUSED) → the live service now sends real Gmail/Calendar bookings. deploy.sh injects `--set-secrets OAUTH_CREDENTIALS_JSON=google-oauth-credentials:latest` + `NOTIFY_EMAIL`.
- **DEPLOYED TO CLOUD RUN (Aug 23) — backend is live on Google Cloud.** URL: `https://care-episode-agent-rvudzlzbla-el.a.run.app` (also `...-635845387421.asia-south1.run.app`). Health + `/api/episodes` verified live (Firestore-backed). **Full E2E verified on the deployed service (Aug 23):** POST real prescription → intake ADK (5 tests) → logistics ADK + live Places (4 Kolkata labs, selected Redcliffe NABL) → 5 bookings → AWAITING_REPORT, ~30s incl. cold start, no errors. The whole agentic pipeline runs on GCP. `STORE_BACKEND=firestore`, `--no-cpu-throttling`, `--max-instances 5`, Places key via `--set-secrets`. Cloud Scheduler `care-episode-tick` runs `POST /api/tick` every minute (OIDC). **One-time IAM gap fixed during deploy:** the default compute SA (`635845387421-compute@`) needed `roles/cloudbuild.builds.builder` + `roles/storage.objectViewer` to build from source. **ACTION: pause the scheduler until demo day (`gcloud scheduler jobs pause care-episode-tick --location asia-south1`) and set the $50 budget alert — the tick keeps an instance warm and drains credits.** Give Neeraj: `NEXT_PUBLIC_API_BASE_URL=https://care-episode-agent-rvudzlzbla-el.a.run.app`, `NEXT_PUBLIC_USE_MOCKS=false`.
- **Places wired — logistics is now the 3rd genuine ADK agent (tool-using). All three specialists are real ADK agents.** `tools/places.py` calls Google Places API (New) (`places.googleapis.com/v1/places:searchText`; the legacy API is denied for our key). `agents/logistics.py` is an ADK `LlmAgent` with a `find_nearby_labs` tool: it calls Places, then reasons to pick the best lab (open + rating + distance), with a deterministic fallback and a `NO_LABS_FOUND → NEEDS_HUMAN` path. Live-verified on a real prescription: intake → 4 real Kolkata labs → agent selected Dr Lal PathLabs ("closest 0.7km, open, rating 4.9") → 5 bookings there → AWAITING_REPORT. Stub lab removed. Booking send is the only remaining stub (Gmail/Calendar). 50 tests green. Key from Secret Manager (`--set-secrets` in deploy); patient location `PATIENT_LAT/LNG` (Salt Lake demo default).
- **ADK integration DONE (hackathon hard requirement) — hybrid, genuine, load-bearing.** `google-adk` 2.7.1. The intelligent work runs through real ADK `LlmAgent`s: `intake_agent` and `diagnostics_extractor` (Flash, multimodal, `output_schema`) and `significance_agent` (3.1-pro-preview, `output_schema`), executed via ADK `Runner`/`InMemorySessionService` (`agents/adk.py`). Orchestration is deliberately a deterministic state machine (coordinator.py = the "root coordinator") so a medical episode advances safely/idempotently/resumably — the LLM never decides state transitions. Public agent-function signatures unchanged, so coordinator + all 46 tests stayed green with internals swapped to ADK. Live-verified: run_skeleton (ADK intake → AWAITING_REPORT) and run_diagnostics_demo (ADK significance → CONSULT_REQUESTED). Vertex config passed per-model via `client_kwargs` (all models serve on `global` → `ADK_LOCATION=global`). **Logistics is still deterministic (stub lab); it becomes the 3rd ADK agent — tool-using — when Places is wired.** README can now honestly claim ADK.
- **Firestore prod path verified + deploy artifacts ready (next-action #15/16).** `scripts/smoke_firestore.py` ran live against the real DB — put/get, update-after-transition, list_for_patient, list_by_states, once-only idempotency claim, history append/get — all pass, cleans up after itself. Fixed the `list_for_patient` query to sort in Python (no composite index needed) and switched to `FieldFilter` (no deprecation warning). App boots clean with `STORE_BACKEND=firestore`. `Dockerfile`, `.dockerignore`, and `deploy.sh` written (Cloud Run `--no-cpu-throttling --max-instances 5`, all env vars, Cloud Scheduler → `/api/tick` every 60s with OIDC). **Deploy not yet run** — needs Shashank to run `bash deploy.sh`.
- **HTTP service + scheduler + root coordinator (next-action #14) — it's now a service, not a script.** Extracted all orchestration into `coordinator.py` (build-plan §3 root coordinator: reads state, runs the right leg, writes back; optional `on_step` narrator). Both demo scripts and the API now drive episodes through it — the flow lives in ONE place (run_skeleton.py / run_diagnostics_demo.py refactored to thin wrappers). `api/main.py` (FastAPI) implements every contract endpoint: `POST /api/episodes` (201, then intake+logistics in a BackgroundTask), `GET /api/episodes[/{id}]`, `POST .../report` (202 → diagnostics in background), `POST .../retry`, `POST /api/tick` (scheduler nudges waiting episodes). Uploaded files served at `/files/...`; CORS open (single-patient demo). Store gained `list_by_states` for the scheduler query. **46 tests green** (coordinator + API via TestClient, Gemini monkeypatched). **Live smoke test passed**: uploaded a real prescription → episode advanced to AWAITING_REPORT with 7 bookings, list/tick/file-serving all worked.
- **Diagnostics leg added (next-action #11) — the story arc is complete end to end.** `agents/diagnostics.py`: `extract_report` (Flash, multimodal — values + ref ranges printed on the report, §6.1), deterministic `compute_flag`/`compute_trend`/`build_report` (vs patient history), `decide_significance` (**real Gemini Pro**, §5 — severity/consult/findings/plain summary, fixed disclaimer), `book_consult` (idempotency-guarded). Store gained patient-history memory (`get_history`/`append_history`, contract `results/{patient}/history/{test}`). `run_diagnostics_demo.py` reproduces the contract example live: seeded HB 12.4→11.1→9.8 → flag=low, trend=falling → Pro says severity=urgent, consult_needed=true → `ANOMALY_FOUND → CONSULT_REQUESTED`, summary calm + non-diagnostic + disclaimer. **30 tests green.** Report extraction on a real file is coded but not yet run (no lab-report file yet); demo uses a mock ReportExtraction + real Pro.
- **MODEL FINDING (Aug 22) — RESOLVED.** gemini-3.5-pro is NOT accessible to this project in any region (asia-south1/global/us-central1 all 404); gemini-3.5-pro-preview also 404. Working: gemini-3.5-**flash** (asia-south1) for all extraction; **gemini-3.1-pro-preview @ global** for the one significance call (`VERTEX_MODEL_SMART` / `VERTEX_MODEL_SMART_LOCATION`). 3.1-pro-preview gave better-calibrated output than 2.5-pro (severity=attention vs urgent for low Hb). README nuance: bulk is 3.5-flash (satisfies the 3.5+ requirement); the Pro-tier reasoning call is 3.1-pro-preview.
- **Logistics leg added (next-action #10).** `agents/logistics.py`: `shortlist_labs` (STUB — one hardcoded lab, Places not wired) + `request_bookings` (one booking per test, **real idempotency guard** — claim key before the stubbed Gmail send; replay returns nothing). Skeleton now drives `TESTS_IDENTIFIED → LABS_SHORTLISTED → BOOKING_REQUESTED → AWAITING_REPORT`. Verified on IMG_2070: 7 bookings with keys `ep:{test}:1` and next-day calendar holds; episode sits in `AWAITING_REPORT` (the "wait" state). **24 tests green** incl. a scheduler double-fire replay test. Only the lab lookup and the email send are stubs — the flow, keys, and state are real.

### Still to validate

- **Anonymisation before anything public.** The tested prescriptions are real patients' documents (names, MR numbers, phones visible on the images). `demo-data/` is gitignored so nothing commits, but swap in the fictional patient name before the demo/write-up.
- **Matched demo-trend data.** The extraction test files are scattered across patients/specialties. The demo's trend story (e.g. Hb falling across 3 reports) needs lab reports for ONE fictional patient over time — still to source.
- **(Minor) IMG_2069 diagnosis came back empty.** Confirm whether the prescription actually has no written diagnosis (likely correct — model won't invent one) vs. a miss.

### Blocked / waiting

- Real prescriptions and lab reports from hospital contacts (longest lead time, start chasing immediately)

---

## Next actions

Ordered. Top item is the next thing to do.

1. ~~**Prove Gemini can read an Indian prescription.**~~ DONE Aug 21 (see Done above). Follow-up: test a handwritten prescription (see "Still to validate").
2. **Repo structure with Neeraj** — he moves UI to `frontend/`, Shashank adds `backend/`.
3. **Send Neeraj the three docs** and confirm he is building against mocks.
4. **Agree the demo patient story** so his mock data matches the real documents.
5. Set the $50 budget alert in the console.
6. Check Gemini model availability in `asia-south1`; fall back to `global` if absent.
7. Start sourcing and anonymising real documents.
8. ~~Firestore schema + state machine.~~ DONE Aug 21 (models, machine, stores, idempotency, 18 tests). Remaining: live Firestore smoke test.
9. Walking skeleton — intake leg DONE Aug 21 (`run_skeleton.py`, both happy + NEEDS_HUMAN paths verified). Remaining legs: logistics (labs → booking), the wait, diagnostics (report → trend → consult).
10. Logistics agent — leg DONE Aug 22 (stub lab + idempotency-guarded stub booking; `LABS_SHORTLISTED → BOOKING_REQUESTED → AWAITING_REPORT`). Remaining to make real: Places API lookup + ranking, real Gmail send + Calendar hold (mind the OAuth token expiry ~Aug 28).
11. Diagnostics agent — leg DONE Aug 22 (report → trend → significance → consult, live Pro). Remaining to make real: run `extract_report` on an actual lab-report file (need one).
12. ~~Resolve the smart-model decision~~ DONE — 3.1-pro-preview @ global for significance.
13. Make stubs real: ~~Places API~~ DONE Aug 22; ~~Gmail + Calendar~~ DONE Aug 23. No stubs remain. **Redeploy to activate Gmail/Calendar in prod** (`bash deploy.sh` again — now includes the OAuth secret).
14. FastAPI `api/main.py` + `/tick` + root coordinator — DONE Aug 22 (46 tests, live smoke passed). Remaining: give Neeraj the base URL and have him flip `NEXT_PUBLIC_USE_MOCKS=false`.
15. Cloud Run deploy — DONE Aug 23 (live + verified). NOW: pause the scheduler, set the $50 budget alert, tear down after recording.
16. Live Firestore smoke test — DONE Aug 22 (`scripts/smoke_firestore.py`, all checks pass).
17. Run report extraction on a real lab report (last unrun agent path).
18. Make stubs real: Places, Gmail + Calendar (regen OAuth token ~Aug 28 first).

---

## Planned features (post-wireup)

- **Episode summary / "understand your issue" brief (requested Aug 24).** A patient-facing, plain-language summary that synthesises the WHOLE episode: the prescription's diagnosis (if any) + why tests were ordered, plus the lab report's key values with anomalies/out-of-range results called out — so the patient understands the issue. NOT medical advice; carries the standard disclaimer; unreadable/ambiguous → don't guess. Build later, once the UI is fully wired. Notes: we already produce `analysis.patient_summary` (report-only) — this is the cross-prescription+report synthesis. Likely a small ADK "summary" agent → a new `episode.patient_brief` field (API-contract change: log it in api-contract §8 + mirror in frontend types.ts), surfaced as a UI summary card.

## Decisions made, and why

| Decision | Reasoning |
|---|---|
| Taskmaster over Collaborative Partner | Backend rigour plays to Shashank's strengths; UI-heavy track was chosen against because only one UI person is active |
| Fleet track rejected | Seven unfamiliar Google services; documentation alone would consume most of the build budget |
| Fresh start, not the contributor-scoring project | Different rules (Gemini-locked), on-chain component earns nothing, and judges favour concrete friction removal |
| Insurance domain cut | Indian policies mostly exclude outpatient diagnostics, so the trigger is hospitalisation — a different scenario that breaks the demo's story arc |
| Renewals and premium reminders cut | Calendar reminders, not agentic decisions |
| Reference ranges read from the report itself | Indian lab reports print them; removes a whole subsystem and is more accurate |
| "Booking" reframed as "request and hold" | No public booking API exists for Indian labs or clinics; email + calendar hold are real actions |
| One root coordinator + three specialists | Enough to demonstrate multi-agent orchestration without spending days on coordination |
| Gemini 3.5 Flash default, Pro only for the significance decision | Cost control, and deliberate routing reads as engineering judgement |
| Gemma as stretch bonus only | Veo and Lyria have no honest use here; Gemma does, but not before the core works |
| UI stays at `client/` (root), NOT moved to `frontend/` (Aug 24) | `backend/` added as a sibling; `client/` never moves in the repo, so Neeraj has zero disruption — no path changes, no merge conflicts, he just keeps pushing `client/`. Supersedes build-plan §0's `frontend/` rename recommendation. |

---

## Key facts to keep in context

- **Project ID:** `care-episode-agent`
- **Billing account:** `0133E9-A5C51E-6C37C7`
- **Region:** `asia-south1` for Firestore and Cloud Run; Vertex may need `global`
- **Service account:** `care-agent-sa@care-episode-agent.iam.gserviceaccount.com`
- **Bucket:** `gs://care-episode-agent-documents`
- **Secrets:** `places-api-key`, `google-oauth-credentials`
- **Demo patient:** `demo-patient-01`
- **Hard requirements:** Gemini 3.5+, a Google agent framework (ADK), a Google Cloud service (Cloud Run + Firestore). All three satisfied — state this explicitly in the README.

---

## Live warnings

- **`.env` now holds the real Places API key** (fetched from Secret Manager for local dev). `.env` is gitignored — never commit it. Prod injects the key via `--set-secrets`, not plain env.
- **Cloud Run + BackgroundTasks:** the API does agent work in FastAPI BackgroundTasks (so uploads return instantly). These need CPU after the response — deploy with `--no-cpu-throttling` or `min-instances=1`, or the work freezes. `/api/tick` is the backstop that can re-drive stalled episodes.
- **Model routing:** 3.5-flash (asia-south1) for all extraction; 3.1-pro-preview (global) for the one significance call. gemini-3.5-pro is not accessible to the project. For the README/video: the 3.5+ requirement is met by 3.5-flash (90%+ of calls); the Pro reasoning call is 3.1-pro-preview. Be precise about this — a Google judge will notice.
- **Regenerate the OAuth refresh token on Aug 29.** Generated Aug 21; tokens expire in ~7 days while the app is in Testing status. This will break email sending right before the demo if forgotten.
- **Record the demo on Aug 30, not Aug 31.** 30% of the score.
- **Demo must be one continuous unedited take.** No cutting mid-flow.
- **Never commit** `client_secret.json`, `.env`, `venv/`, or patient documents. The repo must be public for submission.
- **Always use a venv** on macOS — Homebrew Python blocks system-wide pip installs.
- **Do not run OAuth flows in Cloud Shell or a VM** — they need a browser on the same machine.

---

## Session log

### Aug 18–20 — planning
Evaluated the hackathon rules, three tracks, and roughly a dozen project ideas. Rejected the court filing watcher (crowded market, no accessible court data API) and the insurance super-app shape (breaks the story arc). Landed on the care episode cascade. Wrote the build plan, API contract, and frontend brief.

### Aug 21 — infrastructure
Provisioned GCP end to end. Hit and resolved: literal placeholder substitution in IAM commands, missing Firestore database creation, missing storage bucket, PEP 668 blocking pip on macOS, Cloud Shell being unable to run the OAuth local-server flow, expired gcloud auth during the Secret Manager push, and ADC quota project mismatch. Wrote `check_setup.sh`. All automated checks passing except the budget alert.

### Aug 21 (cont.) — backend scaffold + extraction proof script
Stood up the `backend/` Python scaffold (venv, deps, env, gitignore) and wrote `scripts/extract_prescription.py` — the next-action #1 proof: one prescription file in, structured `prescription` JSON out (schema mirrors the frozen API contract, plus a `readable` flag for the NEEDS_HUMAN path). Uses the modern `google-genai` SDK against Vertex (natively multimodal, no separate vision model). **Ran end to end on a real prescription PDF and it worked** — clean extraction of doctor/date/diagnosis, 6 medicines with Indian dosing notation intact, 9 tests correctly coded and all marked routine (no over-flagging). `gemini-3.5-flash` confirmed working in `asia-south1`. The document turned out to be a handwritten prescription (Adobe-scanned to PDF); verified Gemini did real handwriting recognition, not OCR passthrough — the PDF's embedded OCR layer was garbage on the handwritten parts while Gemini got them right. Riskiest assumption in the project is now proven, including the handwriting case. Then ran three raw iPhone HEIC photos (no OCR layer — the actual demo upload path) across derma/ENT/dental: all `readable`, clean extraction, dense Indian shorthand preserved (`BD`, `TDS`, `SOS`, `(8-2-10)`, inhaler strengths). Vertex accepts `image/heic` natively. Raw-photo upload path fully validated.

### Aug 21 (cont.) — episode backbone
Built the state layer the whole agent hangs off: contract-faithful Pydantic models, the state machine (legal transitions + timeline append + NEEDS_HUMAN/retry), idempotency keys, and the `EpisodeStore` interface with in-memory and Firestore implementations. 18 unit tests green including a scheduler double-fire guard. Firestore path written but not yet live-tested. Next: the walking skeleton — connect the proven intake extraction to the store and drive an episode through states.

### Aug 21 (cont.) — walking skeleton (intake leg)
Refactored the proven extraction into `agents/intake.py` (CLI script + skeleton now share one code path; added a no-cost mapping test). Built `run_skeleton.py` connecting the real pieces: upload → episode → real Gemini intake → state transition → store, with the NEEDS_HUMAN failure branch. Ran both paths on real inputs and confirmed contract-shaped output and correct timeline. From day one the project now has a submittable end-to-end slice (build-plan §18 rule). Next: the logistics leg.

### Aug 24 — README + diagram, prompt consistency, (redeploy pending)
Wrote the submission README.md and ARCHITECTURE.md (Mermaid diagrams) at the repo root. Tightened the report-extraction prompt so it emits one entry per printed row — now consistent at 24 values across runs (flagged test_code naming variance for the future trend feature). Redeployed to Cloud Run (new revision live; prompt fix + Gmail/Calendar OAuth secret active; scheduler stayed paused).

### Aug 24 — diagnostics on a real lab report
Added scripts/extract_report.py and tested the diagnostics leg on a real anonymised multi-page lab report. Extraction pulled 23 values with correct printed reference ranges; the full flow (real Flash + real Pro) took the NORMAL "all clear" path — in-range, first_reading, no consult, calm summary + disclaimer. Every agent path has now run on real data. Remaining diagnostics scenario: multi-report trend → anomaly → consult (needs dated reports for one patient — user will supply later). Noted a minor run-to-run variance in extracted value count (CBC differential grouping).

### Aug 23 — Gmail + Calendar (booking is now real)
Wired the last stub: booking now sends a real Gmail email and creates a real tentative Calendar hold, idempotency-guarded and graceful when OAuth is absent. Verified the refresh token's scopes (gmail.send + calendar.events) before building; live-verified a real email + event. The OAuth account is shashank@frontier.ventures. 52 tests green. Prod Cloud Run predates this — needs a redeploy (deploy.sh now injects the OAuth secret) to send from the live service. Every step of the episode is now a real action; nothing faked.

### Aug 23 — Cloud Run deploy
Deployed the backend to Cloud Run (live + health-verified, Firestore-backed) and created the Cloud Scheduler tick job. Hit one one-time IAM gap: deploy-from-source builds as the default compute SA, which lacked build/storage perms — granted `roles/cloudbuild.builds.builder` + `roles/storage.objectViewer`. Service is public (browser frontend, scope cut); guardrails = max-instances 5 + (pending) budget alert + teardown. Scheduler runs every minute → PAUSE it until demo day to avoid credit drain. Frontend can now go live (URL + USE_MOCKS=false). Hard submission requirement "backend on Google Cloud" satisfied.

### Aug 22 — Places API + logistics as ADK tool-using agent
Probed the key (New Places API works; legacy denied), built `tools/places.py`, and turned logistics into an ADK LlmAgent with a `find_nearby_labs` tool — it calls Places and reasons about lab selection. Now all three specialists (intake, logistics, diagnostics) are genuine ADK agents; the last hardcoded lab is gone. Added `NO_LABS_FOUND → NEEDS_HUMAN`, a deterministic selection fallback, and pure-helper tests. 50 tests green; live-verified on a real prescription against real Kolkata labs. Places key stays in Secret Manager (deploy uses `--set-secrets`); fetched to .env for local dev. Only Gmail/Calendar send remains stubbed.

### Aug 22 — ADK integration (hybrid)
Closed the ADK requirement. Installed google-adk 2.7.1, introspected the real API, PoC'd structured multimodal extraction through an ADK LlmAgent (matched known-good output), then swapped the internals of intake + diagnostics extraction + significance to genuine ADK agents (LlmAgent + output_schema, run via Runner). Kept function signatures identical so coordinator.py and all 46 tests stayed green; live-verified both flows. Chose the hybrid the team agreed on: ADK agents do the intelligence, a deterministic state machine is the root coordinator (medical safety — no LLM-driven state transitions). Per-model Vertex config via client_kwargs; everything on `global`. Logistics stays deterministic until Places is wired, when it becomes the 3rd (tool-using) ADK agent.

### Aug 22 — Firestore verified + deploy artifacts
Ran a live Firestore smoke test (all store operations pass against the real DB, self-cleaning) and fixed two Firestore query issues found in the process (composite-index-free listing, FieldFilter). Wrote the Dockerfile, .dockerignore, and deploy.sh (Cloud Run + Cloud Scheduler tick). App boots clean with the Firestore backend. Everything is ready to deploy; the deploy itself is Shashank's to run (`bash deploy.sh`) since it builds a container and creates cloud resources. After deploy: set the $50 budget alert, hand Neeraj the URL, tear down post-recording.

### Aug 22 — API + scheduler + root coordinator
Turned the skeleton into a service. Pulled all flow logic into `coordinator.py` (one place, used by both the API and the demos — no duplication) and built the FastAPI app implementing the full frozen contract, with intake/logistics/diagnostics running in BackgroundTasks so uploads return immediately and the UI polls. Added `/api/tick` for the scheduler and `list_by_states` to the store. 46 tests green; live smoke test with a real prescription passed end to end (create → AWAITING_REPORT → list/tick/file-serving). Learned: BackgroundTasks need >~16s on first call (cold gRPC/ADC warmup in the worker thread) and, on Cloud Run, need `--no-cpu-throttling`. Frontend can now point at the API (flip USE_MOCKS). Next: Cloud Run deploy.

### Aug 22 — diagnostics leg (report → trend → consult, live Pro)
Built `agents/diagnostics.py` and `run_diagnostics_demo.py`; added patient-history memory to the store. The full arc now runs end to end: deterministic flag/trend vs history + a real Gemini Pro significance decision → anomaly → consult, with a fixed safety disclaimer and the NEEDS_HUMAN path for unreadable reports. 30 tests green. Hit the model wall: gemini-3.5-pro isn't accessible to the project anywhere, so the significance call runs on gemini-2.5-pro @ global for now (decision pending). Report extraction on a real file is coded but unrun — need a lab-report document.

### Aug 22 — logistics leg (stub lab + idempotency)
Added `agents/logistics.py` and extended the skeleton through the booking flow to `AWAITING_REPORT`. Lab and email are stubs (build-plan §18 "build ugly first") but the idempotency guard is real and tested against a replay/double-fire. The skeleton now covers upload → intake → labs → booking → wait, all on the real state machine with a growing timeline. 24 tests green. Next: the diagnostics leg (report → trend → consult), the other half of the story arc.

---

## Working agreement

- Every command given should be complete and runnable, with no placeholders to substitute. Where a value must be filled in, it is called out explicitly.
- Ask before assuming when there is a real fork in approach.
- Step by step, one thing at a time.
