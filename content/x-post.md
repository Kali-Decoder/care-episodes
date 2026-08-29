HANDOFF NOTES FOR RAKESH (delete before posting):
- Post on X (and/or LinkedIn). The hashtag #AllThingsAgenticHackathon is REQUIRED on X/LinkedIn.
- Attach a screenshot or a short clip (best: the episode timeline, or the ESR trend table).
- Paste the GitHub link once the repo is public.
- Option A = single tweet. Option B = a thread (more reach). Use one.

======================================================================
OPTION A — single post
======================================================================

We built an autonomous Care Episode Agent for #AllThingsAgenticHackathon 🩺

Upload a prescription → it finds labs, requests bookings, waits days, then picks up the report on its own, spots a lab value trending the wrong way across visits, and books a follow-up.

Built on Google ADK + Gemini + Cloud Run.
🔗 https://care-episode-agent.web.app

======================================================================
OPTION B — thread
======================================================================

1/ Most health apps read one document. We wanted an agent that carries a whole medical episode forward — over days, across systems, deciding when to act.

So we built the Care Episode Agent for #AllThingsAgenticHackathon 🧵

2/ Upload a doctor's prescription (handwritten works). The agent:
• extracts the tests + flags what's urgent
• finds nearby labs and reasons about which to pick
• sends a real booking request (email + calendar hold)

3/ Then it waits — possibly days. Cloud Run scales to zero; state lives in Firestore. When the lab report is delivered, the agent picks it up ON ITS OWN and runs the analysis. No human upload. That was the whole point: remove the friction.

4/ It extracts each value + the reference range printed on the report, compares against the patient's history, and books a consult only if something meaningfully changed.

Real run: ESR 22 → 43 → 45 across 3 months → flagged → consult booked.

5/ Architecture: 3 Google ADK agents (intake, logistics, diagnostics) doing the intelligence, driven by a deterministic state machine — because an LLM should never decide medical state transitions.

Gemini 3.5 Flash + Pro on Vertex AI, Cloud Run, Firestore, Places/Gmail/Calendar.

6/ It summarizes and flags — never diagnoses. Every output carries a disclaimer; anything ambiguous escalates to a human.

Built for #AllThingsAgenticHackathon
🔗 Live: https://care-episode-agent.web.app
🔗 Code: [GitHub link]
