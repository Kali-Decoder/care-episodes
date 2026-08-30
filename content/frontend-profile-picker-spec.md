# Frontend spec — Profile picker (for Neeraj)

We dropped Google auth in favour of a no-login **"pick a profile"** selector. The
backend now supports multiple patients; the UI just needs to let the user choose
one and pass its `patient_id` to the API. Backend changes are additive and already
deployed — nothing existing breaks.

## New/changed API (see backend/docs/api-contract.md §8, 2026-08-30)

- **`GET /api/patients`** → `{ "patients": [ { "patient_id", "name", "city", "scenario" } ] }`
  Three profiles today: Shashank Shekhar (`demo-patient-01`), Neeraj Choubisa (`neeraj`), Rakesh Kumar (`rakesh`).
- **`GET /api/episodes?patient_id=<id>`** — list for a profile. Omitting it defaults to `demo-patient-01`.
- **`POST /api/episodes`** — already takes `patient_id` (form field). Send the selected one.

## What to build

1. On app load (or a small dropdown in the header/dashboard), call `GET /api/patients` and show the profiles by `name` (optionally `city` / `scenario` as subtext).
2. Store the selected `patient_id` (context or localStorage). Default to `demo-patient-01`.
3. Wire it through the existing `care/api.ts` calls:
   - `listEpisodes()` → `GET /api/episodes?patient_id=${selected}`
   - `createEpisode(file)` → keep sending `patient_id=${selected}` in the FormData (it already sends `PATIENT_ID`; make that the selected id instead of the hardcoded constant).
   - report upload / retry are per-episode — no change.
4. Switching profile re-fetches the dashboard for that patient.

## Notes

- No auth, no tokens — this is a demo profile switch, not login. Keep it that way.
- Each profile is pre-seeded with a different scenario (rising-trend/anomaly, all-normal, new-patient waiting), so switching profiles visibly shows the agent's range.
- The single-patient flow still works unchanged if you don't add the picker (defaults to `demo-patient-01`), so this is safe to land incrementally.
