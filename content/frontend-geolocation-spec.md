# Frontend spec — device geolocation for lab search (for Neeraj)

Goal: when a patient uploads a prescription, book the lab **nearest to their actual
device location** (pinpoint), instead of the profile's general city. Backend support
is **already built + deployed** and fully optional — if you send `lat`/`lng` it uses
them; if you don't, it falls back to the profile city (nothing breaks).

## Backend contract (already live)

`POST /api/episodes` now accepts two **optional** extra form fields:

| Field | Type | Meaning |
|---|---|---|
| `lat` | float | device latitude |
| `lng` | float | device longitude |

Send both, or neither. (See `backend/docs/api-contract.md` §8, 2026-08-30.)

## What to build (small)

In the prescription-upload flow (`createEpisode` in `client/src/care/api.ts`), before
posting, try to get the device location and append it to the existing FormData:

```ts
function getCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),                 // denied / error -> fall back to city
      { timeout: 8000, maximumAge: 300000 }
    )
  })
}

// inside createEpisode(file), live mode:
const body = new FormData()
body.append('file', file)
body.append('patient_id', selectedPatientId)
const coords = await getCoords()
if (coords) {
  body.append('lat', String(coords.lat))
  body.append('lng', String(coords.lng))
}
// POST body to /api/episodes as today
```

That's it — the agent then finds labs around those coordinates.

## Notes / gotchas

- **HTTPS required** for `navigator.geolocation`. Your Firebase site is HTTPS and
  `localhost` is allowed, so both work. (Plain-IP dev hosts won't.)
- **Permission prompt:** the browser asks once and remembers per site. For the demo,
  grant it once beforehand so no prompt appears mid-recording.
- **Graceful fallback:** on denied/timeout, just don't append `lat`/`lng` — the
  backend uses the profile city. Never block the upload on geolocation.
- **Optional polish:** a tiny "📍 using your location" indicator when coords are sent.
- **Demo behavior:** geolocation only affects newly-created episodes. The pre-seeded
  Neeraj/Rakesh episodes keep their seeded-city labs, so switching profiles still
  shows different cities.
