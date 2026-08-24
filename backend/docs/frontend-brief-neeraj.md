# Frontend brief — Neeraj

**Project:** Care Episode Agent
**Hackathon:** Google All Things Agentic, Taskmaster track
**Deadline:** Aug 31 2026, 5:00pm PDT — treat Aug 30 as the last real working day
**Your scope:** the entire `frontend/` directory, plus deploying it

---

## 0. Changes since this brief was written (Aug 20 → Aug 21)

- **Move your existing UI code into a `frontend/` folder.** You pushed to the repository root; the backend needs `backend/` as a sibling. One commit, do it before you go further.
- **Backend infrastructure is fully set up.** GCP project `care-episode-agent`, Firestore, storage, auth, secrets all done. The API itself does not exist yet — keep building against mocks.
- **The API contract is unchanged and still frozen.** Everything in `api-contract.md` holds.
- **A hosted URL is expected at submission**, so getting Firebase Hosting working early matters more than originally stated. Deploy a blank page today if you have not already.
- **The demo must be one continuous unedited take.** This means the UI has to survive a live run without needing a refresh or a manual nudge. Test the full flow end to end before Aug 30.
- **Demo patient story** — agree the exact fictional patient with Shashank so your mock data matches the real demo documents. Suggested: female, 34, suspected iron deficiency anaemia, haemoglobin 12.4 (Feb) → 11.1 (May) → 9.8 (Aug).

---

## 1. What we are building

A patient uploads a doctor's prescription. An AI agent then works on its own, over several days:

1. Reads the prescription, works out which tests were ordered
2. Finds nearby diagnostic labs
3. Emails a booking request and holds a calendar slot
4. **Waits** — possibly for days
5. When the lab report arrives, reads it
6. Compares the values against the patient's earlier reports
7. If something has meaningfully changed, books a follow-up consultation
8. Explains it all to the patient in plain language

Shashank builds the agent. You build what the patient sees.

---

## 2. The single most important thing

**The star of this UI is the timeline, not the forms.**

Judges need to see, at a glance, that an agent did a series of things by itself over time. Every episode carries a `timeline` array — a running log of who did what and when, with entries from `intake_agent`, `logistics_agent`, `diagnostics_agent` and `scheduler`.

If you build one thing well, build that. A clean vertical timeline showing "the agent found 4 labs" then "the agent sent a booking request" then, four days later, "the agent noticed haemoglobin falling" is the entire pitch of this project in one screen.

Forms and uploads are plumbing. The timeline is the product.

---

## 3. You are not blocked on Shashank

Read `api-contract.md`. It is frozen. Every JSON shape you need is in there, with a full worked example and mock files for each state.

Set `NEXT_PUBLIC_USE_MOCKS=true`, build the entire UI against local JSON files, and flip the flag when the backend is live. **Do not wait for the API.** If you finish the UI before the backend exists, that is the ideal outcome, not a problem.

Build a mock cycler — a dev-only control that steps through the mock states on a timer. It lets you watch the whole flow without a backend, and it doubles as a safety net if the backend misbehaves on demo day.

---

## 4. Screens

Four. That is all.

### 4.1 Home / upload
- Drag-and-drop or file picker for a prescription (image or PDF)
- Preview the selected file before submitting
- Submit → creates episode → navigate to episode view
- List of past episodes below, each showing state and `summary_line`

### 4.2 Episode view (the main screen)

This is where 80% of your effort goes. Sections, top to bottom:

**Status header** — current state in human words, not the enum. `AWAITING_REPORT` becomes "Waiting for your lab results". Show days elapsed where relevant.

**Timeline** — vertical, newest at the bottom, each entry showing actor, action, timestamp, detail. Distinguish agent entries from patient entries visually. This is the hero element.

**Prescription card** — diagnosis, doctor, date, medicines, and the test list with urgency badges (`urgent` vs `routine`).

**Labs card** — the shortlisted labs. Highlight the selected one and **show `selection_reason`** — it demonstrates the agent made a judgement rather than picking the first result.

**Bookings card** — per test: lab name, requested time, status, slot hold.

**Results table** — once a report exists. Per value: name, value, unit, reference range, a flag (low/normal/high), and a trend indicator. If `history` has more than one entry, draw a small sparkline. This is worth the effort — a falling line is instantly legible on video.

**Findings panel** — appears when `analysis` is present. Severity banner, findings list, `patient_summary` in plain language, and the disclaimer text rendered visibly.

**Consultation card** — when present: doctor, proposed slot, status.

### 4.3 Report upload
- Available once state is `AWAITING_REPORT`
- Same upload pattern as the prescription
- Can be a modal on the episode screen rather than its own page

### 4.4 Error state
- When state is `NEEDS_HUMAN`, show `error.message` and `error.action_hint` clearly
- If `error.retryable` is true, show a Retry button hitting the retry endpoint
- Do not hide this away — the failure path being handled gracefully is scored

---

## 5. Polling

While the episode is active, poll `GET /api/episodes/{id}` every 3 seconds and re-render. Stop in terminal states (`CLOSED`, `NORMAL`, `NEEDS_HUMAN`). No websockets — not worth the hours.

---

## 6. Design guidance

Calm and clinical. This is health information, and a playful UI would undercut it.

- Restrained palette. One accent colour. Reserve red strictly for out-of-range values and urgent severity — if everything is colourful, nothing reads as important.
- Generous whitespace. The screen carries a lot of information.
- Legible type over decorative type. Numbers especially.
- Loading states everywhere. The agent takes seconds to think; blank screens look broken on video.
- **Test it at the size it will be recorded at.** The demo video is the only way judges see your work. If the timeline needs scrolling to read, it fails on video.

Do not spend hours on animations. Spend them on the results table and the timeline.

---

## 7. Explicitly out of scope

Do not build these. They cost days and earn nothing:

- Login, signup, user accounts. One hardcoded patient: `demo-patient-01`.
- Multi-patient switching
- Settings pages
- Dark mode
- Full mobile responsiveness — desktop is what gets recorded
- Any medical logic of your own. Never compute whether a value is concerning; render what `analysis` says.

That last point matters. All medical judgement lives in the agent. The UI displays, it does not decide.

---

## 8. Stack

- Next.js, deployed to Firebase Hosting
- Your choice on styling — Tailwind is fine
- No state management library needed; the episode object is the entire state
- Keep it a single-file-per-screen structure. This is a 12-day project, not a codebase.

Env vars:
```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_USE_MOCKS=true
```

---

## 9. Your timeline

| Days | What |
|---|---|
| Aug 20–21 | Next.js skeleton, Firebase Hosting set up and deploying, upload screen against mocks |
| Aug 22–23 | Timeline component — the hero piece. Prescription and labs cards. |
| Aug 24–25 | Results table with sparklines, findings panel, consultation card |
| Aug 26–27 | Error state, loading states, polling. Flip to live API. |
| Aug 28 | Polish, deploy final, test end to end with Shashank |
| Aug 29 | Fix whatever breaks in integration |
| Aug 30 | **Demo recording day.** Help Shashank. No new features. |
| Aug 31 | Buffer only |

**Get something deployed to Firebase Hosting on day one**, even if it is a blank page. Deployment problems discovered on Aug 29 are how projects die.

---

## 10. Definition of done

- [ ] Deployed and reachable on a public URL
- [ ] All 12 episode states render without crashing
- [ ] Nulls handled everywhere — early states have mostly null fields
- [ ] Timeline reads clearly and shows agent actions distinctly
- [ ] Results table shows values, ranges, flags and trends
- [ ] Disclaimer text visible wherever findings are shown
- [ ] Error state with working retry
- [ ] Mock cycler works with no backend
- [ ] Readable when recorded at video resolution

---

## 11. Daily sync

15 minutes with Shashank, same time each day. Three questions:

1. What is done
2. What is blocked
3. Is the end-to-end path still working

If anything in the API contract needs to change, raise it at the sync. Do not work around it silently — a mismatch discovered on Aug 29 costs both of you a day.
