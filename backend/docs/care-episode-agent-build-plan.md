# Care Episode Agent — architecture and build plan

**Hackathon:** Google All Things Agentic — Taskmaster track
**Team:** Shashank (agent + backend + deploy), Neeraj (UI + frontend deploy)
**Submission deadline:** Aug 31 2026, 5:00pm PDT (5:30am IST, Sept 1)
**Working days remaining:** 12

---

---

## 0. Changes since this document was first written

This file was generated Aug 20. Everything below is a correction or addition made since. Read this section before trusting anything further down.

### Corrections

**Places API key restriction — earlier advice was wrong.** The pre-flight checklist says "restrict by HTTP referrer or IP." That does not work for this project. HTTP referrer restrictions only apply to browser calls; your Places calls come from Cloud Run, server-side. IP restriction needs a static egress IP, which requires a VPC connector plus Cloud NAT — hours of work for zero marks.

Correct setup, already applied: Application restrictions **None**, API restrictions **Restrict key → Places API only**. Key stored in Secret Manager as `places-api-key`.

**"Gemini Vision" is not a thing.** The old `gemini-pro-vision` is retired. Current Gemini is natively multimodal — pass the image or PDF in the same request as the text prompt, to the same model. Do not write "Gemini Vision" in the README, the write-up, or the video.

**Two setup steps were missing from the original checklist.** Enabling the Firestore API does not create a database, and no storage bucket was listed. Both now created (see section 0.2).

### New constraints discovered

**Refresh tokens expire in ~7 days while the OAuth app is in Testing status.** Token was generated Aug 21, so it dies around Aug 28 — two days before the demo recording. **Regenerate on Aug 29.** This is the single most likely late-stage failure in the project.

**The demo must be live and unedited.** The judging criteria are stricter than "a demo video" — record the main flow in one continuous take. Trimming the start and end is fine; cutting mid-flow to hide a failure is not.

**A hosted project URL is expected at submission.** Neeraj's Firebase deploy gives you one for free.

**Gemma is a bonus option; Veo and Lyria are not.** See section 19.3. Stretch goal only, after the walking skeleton runs.

### Environment gotchas hit during setup

- **macOS Homebrew Python blocks system-wide pip installs** (PEP 668). Always use a venv: `python3 -m venv venv && source venv/bin/activate`.
- **Cloud Shell cannot run the OAuth flow.** `run_local_server()` needs a browser on the same machine. Run `generate_refresh_token.py` on your laptop, never in Cloud Shell or a VM.
- **`gcloud auth login` and `gcloud auth application-default login` are separate credentials.** The CLI uses the first, Python libraries use the second. If they point at different projects, local backend code bills the wrong project or fails with a misleading quota error. Fixed with `gcloud auth application-default set-quota-project care-episode-agent`.
- **`gcloud billing budgets list` is a beta command** and prompts for component installation, which hangs inside a script. Use the console for budgets.

### Open decisions

**Repo structure.** Neeraj has pushed UI code at the repository root. This document assumes `backend/` and `frontend/` as siblings. Recommended fix: he moves his code into `frontend/`. One commit, and it keeps a single submission URL. **Not yet done.**

**Gemini model region.** Confirm in Model Garden whether your Gemini 3.5 model is available in `asia-south1`. If not, set `GOOGLE_CLOUD_LOCATION=global`. Keep Firestore and Cloud Run in `asia-south1` regardless. **Not yet checked.**

### Context

- **Credits:** use Shashank's email on the $150 form. Credits attach to a billing account and cannot be pooled across two, so $300 + $150 on one account beats two separate pots.
- **Competition:** 5,615 registered participants as of Aug 21, up from 4,637 on Aug 18. The Individual/Hobbyist prizes (2 × $10,000) and Honorable Mentions (5 × $2,000) are more realistic targets than the grand prize.

---

## 0.2. GCP setup — completed Aug 21

Project `care-episode-agent`, billing account `0133E9-A5C51E-6C37C7`.

| Item | Status |
|---|---|
| Project created, billing linked | Done |
| 11 APIs enabled | Done |
| Firestore, Native mode, asia-south1 | Done |
| Storage bucket `care-episode-agent-documents` | Done |
| Service account `care-agent-sa` + 4 IAM roles | Done |
| Secret `places-api-key` | Done |
| Secret `google-oauth-credentials` | Done |
| Places API key, restricted to Places API only | Done |
| OAuth consent screen, Testing, both test users | Done |
| Refresh token generated | Done Aug 21 — **regenerate Aug 29** |
| Budget alert $50 | **Pending** |
| Gemini region confirmed | Done Aug 21 — `gemini-3.5-flash` serves in `asia-south1` |

Re-run `check_setup.sh` in Cloud Shell any time to re-verify.

---

## 1. What the agent does, in one sentence

A patient uploads a doctor's prescription. The agent identifies the tests ordered, finds nearby labs, requests bookings, then waits — and when the report comes back days later, it reads it, compares against the patient's history, and books a follow-up consultation only if something genuinely changed.

The thing being demonstrated is not document reading. It is **one medical episode carried forward autonomously over days, with the agent deciding at each fork whether to act.**

---

## 2. Scope decision — what is in and what is cut

With Rakesh out, you have roughly 16 usable build hours. Scope is cut to match.

### In scope (the spine)

| Step | Owner |
|---|---|
| Read prescription, extract tests and diagnosis | Shashank |
| Decide which tests are urgent vs routine | Shashank |
| Find nearby labs via Places API | Shashank |
| Send booking request email + calendar hold | Shashank |
| Wait, and resume when report arrives | Shashank |
| Read report, extract values with reference ranges | Shashank |
| Compare against stored history, decide significance | Shashank |
| Book consultation if anomaly found | Shashank |
| Notify patient with plain-language summary | Shashank |
| Episode timeline UI | Neeraj |
| Upload flow | Neeraj |
| Deploy frontend | Neeraj |

### Cut — do not build these

- **Insurance coverage check.** Was a nice-to-have with three people. With two, it is the first thing to go. Revisit only if you are ahead on Aug 27.
- **Policy renewals, premium reminders, claim filing.** Not agentic, breaks the story.
- **Login / multi-user accounts.** One hardcoded demo patient. Auth is hours of work that earns zero marks.
- **Mobile responsiveness beyond basic.** Demo is recorded on desktop.

### Stretch — only if ahead of schedule

- Coverage check on ordered tests
- Second patient profile to show the agent handling parallel episodes

---

## 3. Agent design

### Structure: one root coordinator, three specialists

Built with ADK (`google/adk-python`). The root does not do work — it reads episode state and decides which specialist to invoke.

**Root coordinator**
- Loads the episode document from Firestore
- Reads current state
- Decides: which specialist runs next, or is this episode complete
- Writes state back after each specialist returns

**Intake agent**
- Input: prescription image or PDF
- Extracts: diagnosis, medicines, tests ordered, doctor name, date
- **Decision:** classifies each test as urgent or routine. Urgent means book within 24h and notify immediately; routine means book at convenience.
- Output: structured JSON written to the episode

**Logistics agent**
- Input: list of tests, patient location
- Calls Places API for nearby diagnostic centres
- **Decision:** picks a lab. Ranking on distance, rating, and open hours. Not just "nearest" — if the nearest is closed for two days and the test is urgent, pick the next one.
- Sends booking request email via Gmail API
- Creates a tentative Calendar hold
- Output: booking record with an idempotency key

**Diagnostics agent**
- Input: lab report PDF
- Extracts test values **and the reference ranges printed on the report itself** (see section 6 — this is important)
- Loads prior reports for the same patient from Firestore
- **Decision:** is this change clinically meaningful? Three outcomes:
  - Normal, within range, no trend → log only, do not disturb the patient
  - Out of range or trending across reports → notify patient, book consultation
  - Unreadable or ambiguous → escalate to human, do not guess
- Output: plain-language summary + consultation booking if warranted

### Why this structure and not more agents

Four agents is enough to demonstrate multi-agent orchestration without spending your hours on coordination logic. Five or six would look impressive in the diagram and cost you a day.

---

## 4. The hard part: handling the wait

This is the core engineering problem and the thing judges will look at. Cloud Run scales to zero and holds no memory. The episode must survive with nothing running.

### State machine

```
PRESCRIPTION_RECEIVED
  -> TESTS_IDENTIFIED
  -> LABS_SHORTLISTED
  -> BOOKING_REQUESTED
  -> AWAITING_REPORT        <- can sit here for days
  -> REPORT_RECEIVED
  -> TRENDS_ANALYZED
  -> ANOMALY_FOUND | NORMAL
  -> CONSULT_REQUESTED
  -> CLOSED
```

Every transition is written to Firestore before the next step begins. If the container dies mid-episode, the next invocation reads state and continues from exactly where it stopped.

### Two ways the agent wakes up

1. **Cloud Scheduler**, hitting a `/tick` endpoint on a schedule. It queries Firestore for episodes in `AWAITING_REPORT` or `BOOKING_REQUESTED` and nudges each one — chasing labs that have not responded, checking elapsed time.
2. **Inbound report.** Either a Gmail watch, or the patient uploading the report through the UI. Either flips the episode to `REPORT_RECEIVED`.

### Idempotency — do not skip this

You already know this problem from duplicate-send prevention. Same thing here, higher stakes.

- Every booking request carries an idempotency key: `{episode_id}:{test_code}:{attempt}`
- Before sending, check Firestore for that key. If present, skip.
- Write the key **before** the send, not after. A crash between send and write must not produce a second booking.
- Cloud Scheduler can and will fire twice. Assume it.

Call this out explicitly in your demo and README. The Aug 13 webinar was entirely about this, judges are primed for it, and most teams will get it wrong.

---

## 5. Tech stack and services

### Required by the hackathon rules

| Requirement | What you use |
|---|---|
| Gemini 3.5+ | Gemini via Vertex AI |
| Google agent framework | ADK (Python) |
| Google Cloud service | Cloud Run + Firestore |

All three satisfied. Confirm this in the README explicitly — do not make judges hunt for it.

### Full service list

- **Cloud Run** — agent service, scale to zero, max instances capped
- **Firestore** — episode state, patient history, idempotency keys
- **Cloud Scheduler** — periodic wake-up
- **Vertex AI** — Gemini calls
- **Places API** — nearby diagnostic centres
- **Gmail API** — booking request emails, patient notifications
- **Calendar API** — tentative holds and consultation slots
- **Firebase Hosting** — Neeraj's frontend

### Model routing (cost control)

- **Gemini 3.5 Flash** — document extraction, classification, summary writing. This is 90% of your calls, and Flash is the model the hackathon brief names explicitly.
- **Gemini Pro** — the significance decision only. It is the one place where reasoning quality actually matters.

Never call Pro in a loop.

State this split in the README. Deliberate model routing reads as engineering judgement, not an accident.

### Multimodal handling — get the wording right

There is no separate "Gemini Vision" model. The old `gemini-pro-vision` is retired. Current Gemini is **natively multimodal**: you pass the image or PDF in the same request as the text prompt, to the same model. Nothing extra to enable, no separate SDK.

Do not write "Gemini Vision" anywhere in the README, the write-up, or the video. It reads as out of date to a Google judge. Say "Gemini 3.5 Flash reads the document directly" instead.

Practical notes:
- PDFs go as base64 with media type `application/pdf`
- Photos go as base64 with the correct image media type
- Handwritten prescriptions are the impressive case. Test early — if extraction is weak, tighten the prompt with an explicit output schema rather than switching models.

---

## 6. Things you have not thought about yet

### 6.1 Reference ranges — good news

You do not need a medical reference database. Indian lab reports print the normal range next to every value. Extract it from the report itself. This removes a whole subsystem and makes the agent more accurate, because ranges vary by lab and by patient age and sex.

Say this out loud in the demo. It sounds like a small thing and it is actually a good engineering decision.

### 6.2 Booking is not really booking

There is no public API to book a slot at an Indian diagnostic centre or clinic. Practo, Apollo, 1mg — none expose this.

What you actually do:
- Find the lab via Places
- **Send a real booking request email** via Gmail API
- **Create a real Calendar hold**

Both are genuine API calls with visible results. Frame it as "requests and holds a slot," never "books." If a judge thinks you faked a booking screen, you lose more than the feature was worth.

### 6.3 The demo clock problem

Your episode spans days. Your video is four minutes.

Build a `DEMO_MODE` flag that compresses waits — Scheduler tick every 60 seconds instead of every 6 hours. Show the flag in the code and mention it in the video: "in demo mode the clock is compressed; in production this waits four days."

Honest, and it turns a weakness into evidence that you thought about time.

### 6.4 Real data

You need, at minimum:
- 2 real prescriptions (handwritten if possible — that is the impressive case)
- 3–4 lab reports for the same fictional patient across time, so the trend is real
- Ideally one where a value genuinely moves

You have access to doctors and hospitals in Kolkata. **Anonymise everything** — strip names, phone numbers, UHIDs, addresses before anything touches your repo. Use a fictional patient name consistently.

This has a lead time. Start asking today, not on Aug 27.

### 6.5 Medical safety framing

Non-negotiable, and cheap to do:
- The agent summarises and flags. It never diagnoses.
- Every output carries a line: this is not medical advice, a doctor decides.
- Ambiguous or unreadable reports escalate to a human rather than being guessed at.
- Say this in the video. Judges notice when a health project has thought about it, and notice harder when it has not.

### 6.6 Failure handling — judges score this

Have an answer for each:
- No lab found within range → widen radius, then tell the patient
- Prescription unreadable → ask the patient to re-upload, do not invent tests
- Lab does not respond within N days → chase once, then escalate
- Gemini returns malformed JSON → retry once with a stricter prompt, then fail loudly
- Report does not match any expected test → store it, flag for human review

Write these down. Two or three appearing in the demo is worth real marks under architectural discipline.

### 6.7 Cost and credit safety

- Put auth on the Cloud Run URL. An open endpoint plus a scheduler loop can drain credits overnight.
- Set max instances to 5.
- Set a billing alert at $50.
- Record your GCP console proof, then tear down. Submissions do not need to stay live.

### 6.8 OAuth scope

Gmail and Calendar APIs need an OAuth consent screen. In testing mode you are limited to 100 test users, which is fine — but set it up early, not on the last day. It is a fiddly hour.

---

## 7. Data model

```
patients/{patient_id}
  name, dob, sex, location

episodes/{episode_id}
  patient_id
  state                    <- the state machine value
  created_at, updated_at
  prescription: { diagnosis, medicines[], tests[], doctor, date }
  bookings[]: { test_code, lab_place_id, lab_name,
                requested_at, idempotency_key, status }
  report: { received_at, values[], source_file }
  analysis: { findings[], severity, summary, consult_needed }
  timeline[]: { at, actor, action, detail }

results/{patient_id}/history/{test_code}
  values[]: { date, value, unit, ref_low, ref_high }

idempotency/{key}
  created_at, episode_id
```

The `timeline` array is what Neeraj renders. Make sure every agent appends to it — that array **is** the demo.

---

## 8. Division of labour

### Shashank

1. GCP project, billing, APIs enabled
2. Firestore schema and state machine
3. ADK agent scaffold — root + three specialists
4. Intake agent (prescription reading)
5. Logistics agent (Places, Gmail, Calendar)
6. Diagnostics agent (report reading, trend, decision)
7. Cloud Scheduler tick endpoint
8. Idempotency and failure handling
9. Cloud Run deployment
10. Architecture diagram, README

### Neeraj

1. Next.js app, Firebase Hosting
2. Upload component (prescription, then report)
3. Episode timeline view — the agent's actions in order, with timestamps
4. Current state indicator (what the agent is waiting on)
5. Report card view (values, ranges, what changed)
6. Notification display
7. Frontend deploy

### Interface contract — agree this on day one

Neeraj should not wait for your backend. Define the JSON shape of an episode document immediately, have him build against a hardcoded mock, and swap in the live API later. If he blocks on you, you lose both your time and his.

---

## 9. Timeline

| Days | Shashank | Neeraj |
|---|---|---|
| Aug 20–21 | GCP setup, ADK scaffold, Firestore schema, episode JSON contract | Next.js skeleton, upload UI against mock JSON |
| Aug 22–23 | Intake agent working end to end | Timeline view |
| Aug 24–25 | Logistics agent — Places, email, calendar | Report card view, polish |
| Aug 26–27 | Diagnostics agent — extraction, trend, decision | Wire to live API |
| Aug 28 | Scheduler, idempotency, failure paths | Deploy frontend |
| Aug 29 | Cloud Run deploy, end-to-end test with real documents | Fix what breaks |
| Aug 30 | **Record demo video.** README, architecture diagram | Help with video |
| Aug 31 | Buffer. Submit by 2pm IST. Blog + social post | Buffer |

**Aug 30 for the video is deliberate.** Do not leave it to the 31st. Something always breaks, and 30% of your score is the demo.

---

## 10. Pre-flight checklist — do these before writing code

### Accounts and access

- [ ] Check whether you are eligible for the $300 GCP free trial (never used Firebase/GCP/Maps before). If not, use Neeraj's account.
- [ ] Create GCP project, enable billing
- [ ] Enable APIs: Vertex AI, Firestore, Cloud Run, Cloud Scheduler, Places, Gmail, Calendar
- [ ] Set billing alert at $50
- [ ] Restrict the Places API key (HTTP referrer or IP)
- [ ] OAuth consent screen configured, both of you added as test users
- [ ] Devpost account registered, team formed
- [ ] Fill the $150 credit form — track is Taskmaster, description ready (section 12)

### Repo and tooling

- [ ] GitHub repo created. Public, or private + shared with `testing@devpost.com` and `cloudhackathons@google.com`
- [ ] Neeraj added as collaborator
- [ ] `.gitignore` covers service account keys, `.env`, patient documents
- [ ] ADK installed locally, hello-world agent running
- [ ] Gemini reachable from your machine

### Data

- [ ] 2 prescriptions sourced (at least 1 handwritten)
- [ ] 3–4 lab reports for one fictional patient, showing a trend
- [ ] All documents anonymised
- [ ] Fictional patient name and profile agreed

### Agreements between you two

- [ ] Episode JSON contract written down and frozen
- [ ] Who owns deployment of what
- [ ] Daily 15-minute sync time fixed
- [ ] Demo script drafted by Aug 27 so both of you build toward it

---

## 11. Submission checklist

- [ ] Category selected: Taskmaster
- [ ] **Hosted project URL** — the frontend on Firebase Hosting. Strongly encouraged by the rules; you will have it anyway, so submit it.
- [ ] Text description: features, tech used, data sources, learnings
- [ ] Public repo with spin-up instructions in README
- [ ] README states explicitly: Gemini 3.5+ via Vertex, ADK, Cloud Run + Firestore
- [ ] Architecture diagram in the repo
- [ ] Demo video, roughly 4 minutes
- [ ] **Video shows the backend running on Google Cloud** — Cloud Run dashboard, Vertex logs, or the `.run` URL visible on screen
- [ ] Demo mode clock compression stated honestly in the video
- [ ] Medical disclaimer visible
- [ ] Bonus: content piece published publicly, stating it was made for this hackathon
- [ ] Bonus: social post with `#AllThingsAgenticHackathon`
- [ ] Bonus (stretch): Gemma integrated, if the spine was solid by Aug 27
- [ ] Video is one continuous take of the real app, not stitched clips
- [ ] Submitted before Aug 31, 5:00pm PDT

---

## 12. Credit form description (draft)

**Track:** Taskmaster

> An autonomous agent that manages a patient's care episode end to end. It reads a doctor's prescription, identifies and prioritises the diagnostic tests ordered, locates nearby labs and requests bookings, then resumes days later when results arrive to compare them against the patient's history and book a follow-up consultation only when a value has meaningfully changed. Built on ADK with Gemini via Vertex AI, deployed on Cloud Run with Firestore-backed episode state.

---

## 13. Demo script skeleton (draft by Aug 27)

1. **0:00–0:30** — the problem. A prescription, four tests, three labs, results nobody compares to last time. Show the paper mess.
2. **0:30–1:15** — upload the prescription. Agent extracts tests, flags one as urgent, finds labs, sends the request. Show the actual sent email.
3. **1:15–1:45** — the wait. Show the episode sitting in `AWAITING_REPORT`, scheduler ticking, nothing running. State the clock compression.
4. **1:45–2:45** — report arrives. Agent reads it, pulls the trend across three reports, flags the rising value, books the consultation, writes the plain-language summary.
5. **2:45–3:30** — under the hood. Architecture diagram, Cloud Run console, Firestore episode document, idempotency, one failure path.
6. **3:30–4:00** — safety framing and close.

---

## 14. Repo structure

```
care-episode-agent/
├── README.md                 <- spin-up instructions, required for submission
├── ARCHITECTURE.md           <- diagram + explanation
├── docs/
│   ├── build-plan.md         <- this file
│   ├── frontend-brief.md     <- Neeraj's scope
│   └── api-contract.md       <- the JSON contract
├── backend/
│   ├── agents/
│   │   ├── root.py           <- coordinator
│   │   ├── intake.py
│   │   ├── logistics.py
│   │   └── diagnostics.py
│   ├── tools/
│   │   ├── places.py
│   │   ├── gmail.py
│   │   ├── calendar.py
│   │   └── firestore_store.py
│   ├── state/
│   │   ├── machine.py        <- state transitions
│   │   └── idempotency.py
│   ├── api/
│   │   └── main.py           <- FastAPI, the endpoints Neeraj calls
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 <- Neeraj owns everything in here
└── demo-data/                <- anonymised prescriptions and reports
```

Agree this structure on day one. It prevents merge pain later, and a clean repo is directly scored under reproducibility.

---

## 15. Environment variables

Backend (`.env`, never committed):

```
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=asia-south1
VERTEX_MODEL_FAST=gemini-flash
VERTEX_MODEL_SMART=gemini-pro
PLACES_API_KEY=
GMAIL_SENDER=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_REFRESH_TOKEN=
FIRESTORE_DATABASE=(default)
DEMO_MODE=true
DEMO_TICK_SECONDS=60
PROD_TICK_HOURS=6
NOTIFY_EMAIL=
```

Frontend:

```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_USE_MOCKS=true
```

`NEXT_PUBLIC_USE_MOCKS` is what keeps Neeraj unblocked. He builds with it `true` and flips it to `false` when the backend is live.

---

## 16. What DEMO_MODE actually does

One flag, three effects:

1. Scheduler tick interval drops from 6 hours to 60 seconds
2. The "wait for report" gate drops from 4 days to 2 minutes
3. The lab chase-up gate drops from 48 hours to 90 seconds

Nothing else changes. No fake data, no skipped steps, no hardcoded outputs. The agent does the same work on a compressed clock.

Show the flag in the video. It converts an obvious question ("did you fake the wait?") into evidence that you handled time properly.

---

## 17. How you will be scored

Worth Neeraj reading this too, since it explains why the timeline view matters more than visual polish.

| Weight | Criterion | What actually earns it |
|---|---|---|
| 40% | Innovation and operational utility | The agent acts on its own across multiple systems. Not a chatbot. |
| 30% | Architectural discipline | State handling, memory, secrets, idempotency, failure paths |
| 30% | Demo and reproducibility | Clear 4-min video, working README, visible Google Cloud proof |

**60% of the score is engineering hygiene and proof, not the idea.** This is why the walking skeleton matters more than any single feature, and why the video gets a full day.

---

## 18. Build order — the rule that protects you

Do not build the agents one at a time to completion. Build the whole path badly first.

**By end of day 3 (Aug 22), this must run end to end:**

- Prescription uploaded
- Tests extracted (real Gemini call)
- One hardcoded lab (no Places yet)
- One real email sent
- Report uploaded
- Values extracted (real Gemini call)
- Comparison against one hardcoded prior result
- Summary printed

Stubs everywhere. Ugly. No scheduler, no calendar, no UI polish. It does not matter.

From day 3 onward you always have something submittable, and every remaining day improves it rather than creating it. This single rule removes most of the risk in the project.

**Your minimum viable submission** — if everything goes wrong, this still satisfies every hard requirement and still scores: prescription in, tests extracted, one lab found, email sent, report read, compared to history, summary out. Roughly 6 hours of work.

---

## 19. Bonus deliverables

The hackathon lists three optional bonus items. Two are cheap and idea-independent. The third costs real hours.

### 19.1 Content piece — 45 minutes, do it

A blog post, video, or podcast covering how the project was built, published somewhere public (Medium, dev.to, YouTube). **It must be public, not unlisted.** It must also include explicit language saying you created it for this hackathon — a single sentence at the top is enough.

Write it on Aug 30 while the demo is fresh.

### 19.2 Social post — 10 minutes, do it

X, LinkedIn, Instagram or Facebook. On X or LinkedIn, include `#AllThingsAgenticHackathon`. Attach a screenshot or a clip.

### 19.3 Gemma integration — stretch only

The bonus reads: "Successfully integrate Google AI models such as Gemma, Veo or Lyria."

**Veo and Lyria have no place in this project.** Veo generates video, Lyria generates music. Forcing either in would look like box-ticking and judges notice.

**Gemma does have an honest use.** Two options:

**Option A — local PII redaction (better story).** Before any document reaches Gemini, a small Gemma model strips patient names, phone numbers, UHIDs and addresses. Only clinical content goes to the larger model. For a health application this is a genuine architectural argument, and it earns marks twice: once for the bonus, once under architectural discipline (30% of the score). Say it out loud in the demo.

**Option B — cheap document triage (easier).** Gemma classifies what the uploaded file is — prescription, lab report, or something else — before Gemini does the expensive extraction. Classic model routing: small model for the cheap decision, large model for the hard one.

**Cost warning.** Gemma needs somewhere to run:
- A Vertex AI Model Garden endpoint does **not** scale to zero. It bills while it exists. If you use one, deploy it on demo-recording day only and delete it immediately after.
- A small Gemma variant inside the Cloud Run container avoids the always-on cost but bloats the image and slows cold starts.

Budget 2–3 hours. **Do not start this until the walking skeleton runs end to end.** The bonus is worth far less than the 30% you lose by shipping a broken core.

Decision point: if it is Aug 27 and the spine is solid, build Option B. If Aug 28 and anything is shaky, skip it entirely.

---

## 20. Note on the demo video

The judging criteria ask for a **live, unedited demo**. That is stricter than "a demo video."

- Record the main flow in one continuous take rather than cutting between clips
- Screen recording of the real app, not slides walking through screenshots
- This is another reason `DEMO_MODE` clock compression matters — a real four-day wait cannot be shown live
- Trimming the start and end is fine. Cutting mid-flow to hide a failure is not, and it is visible.

Practise the run twice before recording. The third take is usually the one you keep.

---

## 21. Daily sync

15 minutes, same time daily, both of you. Three questions only:

1. What is done
2. What is blocked
3. Is the walking skeleton still running end to end

That third question is the one that matters. If the answer is no for two days running, stop adding features and fix it.

---

## 22. The three biggest risks

1. **Scope creep back toward insurance.** You cut it for a reason. If you are tempted on Aug 26, the answer is no.
2. **Leaving the video to Aug 31.** Record on the 30th.
3. **Neeraj blocked on your API.** Freeze the JSON contract on day one and let him build against a mock.
