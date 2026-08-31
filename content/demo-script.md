# Nani AI — Demo Video Script (~4:00)

**Nani AI** — an autonomous *care-episode agent*. (Brand = Nani AI, "a grandmother who
watches over your health"; descriptor = autonomous care-episode agent.)

Screencast (screen capture + voice-over). English. Public on YouTube. **Upload early —
processing can take hours.** Solo presenter — audio narration is enough; a small webcam
corner during the intro/close is optional (hide it during the demo so nothing covers the screen).

Target ≈ 4:00. Narration ≈ 550 words.

---

## Pre-record checklist

1. **Reset demo data (clean start):**
   `cd backend && source venv/bin/activate && python scripts/seed_profiles.py && python scripts/seed_demo_history.py`
2. **Guarantee no cold-start** — pin one warm instance for the recording, then revert after:
   `gcloud run services update care-episode-agent --region asia-south1 --min-instances=1`
   (afterwards: `--min-instances=0` so it scales to zero again and stops costing)
3. **Resume the scheduler** (for autonomous pickup): `gcloud scheduler jobs resume care-episode-tick --location asia-south1` (pause after the take).
4. **Grant location** for `care-episode-agent.web.app` once beforehand (no prompt mid-take) — or allow it on camera as a feature.
5. **Open all tabs** (see list below), logged into the GCP project.
6. Terminal ready with `python scripts/deliver_report.py demo-data/lab3.pdf` (the simulated lab delivery).

### Tabs / links to have open
- App: `https://care-episode-agent.web.app`
- Backend `.run` URL (proof): `https://care-episode-agent-rvudzlzbla-el.a.run.app/`
- Cloud Run: `https://console.cloud.google.com/run/detail/asia-south1/care-episode-agent/metrics?project=care-episode-agent`
- Vertex AI: `https://console.cloud.google.com/vertex-ai?project=care-episode-agent`
- Firestore data: `https://console.cloud.google.com/firestore/databases/-default-/data?project=care-episode-agent`
- Cloud Storage inbox: `https://console.cloud.google.com/storage/browser/care-episode-agent-documents?project=care-episode-agent`
- Cloud Scheduler: `https://console.cloud.google.com/cloudscheduler?project=care-episode-agent`
- Gmail + Google Calendar (to show the real booking/consult email + holds)

---

## The script

### 0:00–0:15 · HOOK (the problem)
**On screen:** the Nani AI landing page.
**Say:**
> "We collect prescriptions, run lab tests, and pile up reports — and nobody connects them. The thing that actually matters — a value quietly drifting the wrong way across visits — slips through, because no one is holding the whole thread."

### 0:15–0:35 · MEET NANI AI (value proposition)
**On screen:** Nani AI name / tagline.
**Say:**
> "Meet **Nani AI** — like a grandmother who keeps track of your health and only speaks up when something's wrong. Under the hood it's an autonomous care-episode agent: built for the All Things Agentic hackathon, it carries one medical episode forward — over days, across systems — deciding at each step whether to act. Not a chatbot, not a document reader. It does the legwork and only bothers you when something has genuinely changed."

### 0:35–0:50 · PICK A PROFILE (no login)
**On screen:** profile picker → choose **Shashank (Kolkata)**.
**Say:**
> "No login — you just pick who you are. Let's follow Shashank, in Kolkata."

### 0:50–1:30 · INTAKE + LOGISTICS (real actions)
**On screen:** upload the handwritten prescription → timeline animates: tests extracted, urgency flagged → labs found → booking. Flash the **booking email** (Gmail tab) + **calendar hold**.
**Say:**
> "He uploads a doctor's prescription — handwritten. Gemini 3.5 Flash, running as an ADK agent, reads it directly and pulls out the tests ordered, flagging what's urgent. A second ADK agent calls Google Places, finds diagnostic labs near Shashank — in his own city — reasons about the best one, and sends a *real* booking request: an actual email and a calendar hold. Real Google API calls, not mockups."

### 1:30–1:45 · THE WAIT
**On screen:** episode in **AWAITING_REPORT**.
**Say:**
> "Now it waits — in the real world, for days. Cloud Run scales to zero: no server is running, nothing is holding state. This is the hard part most demos skip."

### 1:45–2:30 · AUTONOMOUS PICKUP + DIAGNOSTICS (the money shot)
**On screen:** switch to terminal → run `deliver_report.py lab3.pdf`. **Be transparent:** briefly show the file landing in the Cloud Storage inbox. Then back to the app → timeline shows **`[scheduler] retrieved_report`** → trend chart **ESR 22 → 43 → 45** → consult card. Flash the **consult email** in Gmail.
**Say:**
> "There's no public API for diagnostic labs — so I'll simulate the lab delivering the report by dropping it into the Cloud Storage inbox Nani AI watches; in production this would be a lab integration or an inbound email. Now watch: Nani AI picks it up **on its own** — Cloud Scheduler polls that inbox on a timer. No upload, no prompt. It extracts the values *and* the reference ranges printed on the report, and compares them against Shashank's history. Here's the moment — his ESR has climbed across three visits: 22, 43, 45, now out of range and trending up. Gemini 3.1 Pro makes the call — this is meaningful — so it books a follow-up consultation for the next day, sends another real email, and writes a plain-language summary."

*(Timing note: for an unedited take, either wait ~60s for the scheduler tick, or fire one `POST /api/tick` right after delivering and say "the scheduler runs this on a timer — here's a tick" — same endpoint, keeps the pace tight and honest.)*

### 2:30–3:00 · THE OTHER SCENARIOS (range + restraint)
**On screen:** open the profile picker →
- **Neeraj (Udaipur)** → open his episode → **NORMAL → Done**, "all clear" summary.
- **Rakesh (Bengaluru)** → a new patient, booking requested → **awaiting report** (note labs are in *Bengaluru* — per-patient location).
**Say:**
> "But Nani AI doesn't cry wolf. Neeraj's results are all in range, so the episode closes calmly — done, no consult. Rakesh is a brand-new patient mid-episode, waiting on his first report — and notice his labs are in Bengaluru, not Kolkata: Nani AI searches near each patient. And if a prescription orders no tests at all, it simply marks the episode done rather than inventing work. It acts only when it should."

### 3:00–3:40 · UNDER THE HOOD — GOOGLE CLOUD PROOF *(required)*
**On screen (cut between tabs):** Cloud Run service (green, **`.run` URL** visible) → Vertex AI / Gemini → Firestore (`episodes/…` doc + `results/…/history`) → Cloud Storage bucket (the inbox) → Cloud Scheduler job.
**Say:**
> "It all runs on Google Cloud. Here's the backend live on Cloud Run — that's the real `.run` URL. The intelligence is three ADK agents — intake, logistics, diagnostics — on Gemini through Vertex AI. A deterministic coordinator drives a twelve-state machine, so a language model never decides a medical transition. Episode state, patient history, and idempotency keys live in Firestore; reports arrive through Cloud Storage; Cloud Scheduler is the heartbeat. Every booking is idempotency-guarded — the scheduler can fire twice and it never double-books."

### 3:40–4:00 · SAFETY + CLOSE
**On screen:** the disclaimer on an analysis; the `NEEDS_HUMAN` state.
**Say:**
> "And Nani AI is careful by design: it summarises and flags — it never diagnoses. Every result carries a disclaimer, and anything it can't read confidently goes to a human. That's Nani AI — a grandmother's watchfulness, as an autonomous agent on Google Cloud, carrying one episode from a prescription all the way to the consultation that actually matters."

### End card
Nani AI · `care-episode-agent.web.app` · GitHub repo · **#AllThingsAgenticHackathon**

---

## Editing notes
- If unedited: use the manual-tick option so there's no dead air waiting on the scheduler.
- If lightly edited: trim the cold-start and the wait; cut straight from "it waits" to the report arriving.
- Keep the **timeline visible** during agent steps — it *is* the story.
- Pre-frame each GCP tab so you can cut between them quickly. Re-do a take if a live call hiccups — the ESR trend and the consult are the two beats that must land.

## Google services to name
ADK · Gemini 3.5 Flash + 3.1 Pro (Vertex AI) · Cloud Run · Firestore · Cloud Storage · Cloud Scheduler · Places API (New) · Gmail API · Calendar API · Firebase Hosting.
