# API contract — Care Episode Agent

**Status: frozen as of Aug 20. Any change must be agreed by both of us.**

This document exists so Neeraj never waits on Shashank. Every shape below is final. Build the entire frontend against the mock payloads in section 6, then flip `NEXT_PUBLIC_USE_MOCKS` to `false` when the backend is live.

Base URL: `NEXT_PUBLIC_API_BASE_URL`
All responses are JSON. All timestamps are ISO 8601 UTC.

---

## 1. The episode states

There are ten. The UI must handle every one.

| State | Meaning | What the UI shows |
|---|---|---|
| `PRESCRIPTION_RECEIVED` | Uploaded, not yet read | Spinner, "reading prescription" |
| `TESTS_IDENTIFIED` | Tests extracted | Test list with urgency badges |
| `LABS_SHORTLISTED` | Nearby labs found | Lab cards |
| `BOOKING_REQUESTED` | Emails sent, awaiting lab reply | "Requested" status per test |
| `AWAITING_REPORT` | Booked, waiting for results | Waiting state, days elapsed |
| `REPORT_RECEIVED` | Report uploaded, not yet read | Spinner, "reading report" |
| `TRENDS_ANALYZED` | Compared against history | Results table with trends |
| `ANOMALY_FOUND` | Something changed meaningfully | Alert banner + findings |
| `CONSULT_REQUESTED` | Follow-up consultation requested | Consultation card |
| `NORMAL` | Nothing of concern | Calm "all clear" state |
| `CLOSED` | Episode complete | Read-only summary |
| `NEEDS_HUMAN` | Agent could not proceed | Clear explanation + retry action |

`NEEDS_HUMAN` can occur from any state. Do not forget it — it is the failure path and judges look for it.

---

## 2. Endpoints

### `POST /api/episodes`
Create an episode by uploading a prescription.

Request: `multipart/form-data`
- `file` — image or PDF
- `patient_id` — string, use `"demo-patient-01"`

Response `201`: a full episode object (section 3), state `PRESCRIPTION_RECEIVED`.

### `GET /api/episodes`
List all episodes for the demo patient.

Response `200`:
```json
{ "episodes": [ { "episode_id": "...", "state": "...", "created_at": "...", "summary_line": "..." } ] }
```

### `GET /api/episodes/{episode_id}`
The main one. Poll this every 3 seconds while the episode is active.

Response `200`: a full episode object (section 3).

### `POST /api/episodes/{episode_id}/report`
Upload a lab report.

Request: `multipart/form-data` with `file`.
Response `202`: episode object, state `REPORT_RECEIVED`.

### `POST /api/episodes/{episode_id}/retry`
Retry after `NEEDS_HUMAN`.

Response `200`: episode object.

### `POST /api/tick`
Internal. Cloud Scheduler only. **Neeraj never calls this.**

---

## 3. The episode object

This is the single shape the whole UI is built on.

```json
{
  "episode_id": "ep_7f3a9c",
  "patient_id": "demo-patient-01",
  "state": "TRENDS_ANALYZED",
  "created_at": "2026-08-20T09:14:00Z",
  "updated_at": "2026-08-24T11:02:00Z",
  "summary_line": "3 tests ordered, results in, one value rising",

  "prescription": {
    "doctor": "Dr. A. Sen",
    "date": "2026-08-20",
    "diagnosis": "Suspected iron deficiency anaemia",
    "medicines": [
      { "name": "Ferrous ascorbate", "dose": "100mg", "frequency": "once daily" }
    ],
    "tests": [
      { "test_code": "CBC", "display_name": "Complete blood count", "urgency": "urgent" },
      { "test_code": "FERRITIN", "display_name": "Serum ferritin", "urgency": "routine" },
      { "test_code": "TSH", "display_name": "Thyroid stimulating hormone", "urgency": "routine" }
    ],
    "source_file_url": "https://storage.googleapis.com/.../rx1.jpg"
  },

  "labs": [
    {
      "place_id": "ChIJ...",
      "name": "Suraksha Diagnostics, Salt Lake",
      "address": "DD-27, Sector 1, Salt Lake, Kolkata",
      "rating": 4.3,
      "distance_km": 2.1,
      "open_now": true,
      "selected": true,
      "selection_reason": "Closest centre open today offering all three tests"
    }
  ],

  "bookings": [
    {
      "test_code": "CBC",
      "lab_name": "Suraksha Diagnostics, Salt Lake",
      "requested_at": "2026-08-20T09:16:00Z",
      "status": "requested",
      "slot_hold": "2026-08-21T08:00:00Z",
      "idempotency_key": "ep_7f3a9c:CBC:1"
    }
  ],

  "report": {
    "received_at": "2026-08-24T10:58:00Z",
    "source_file_url": "https://storage.googleapis.com/.../report1.pdf",
    "values": [
      {
        "test_code": "HB",
        "display_name": "Haemoglobin",
        "value": 9.8,
        "unit": "g/dL",
        "ref_low": 12.0,
        "ref_high": 15.0,
        "flag": "low",
        "trend": "falling",
        "history": [
          { "date": "2026-02-11", "value": 12.4 },
          { "date": "2026-05-19", "value": 11.1 },
          { "date": "2026-08-24", "value": 9.8 }
        ]
      }
    ]
  },

  "analysis": {
    "severity": "attention",
    "consult_needed": true,
    "findings": [
      "Haemoglobin has fallen across three consecutive reports and is now below the reference range."
    ],
    "patient_summary": "Your haemoglobin has been dropping steadily since February and is now below normal. This is worth discussing with your doctor.",
    "disclaimer": "This is not medical advice. A doctor should review these results."
  },

  "consultation": {
    "requested_at": "2026-08-24T11:01:00Z",
    "doctor": "Dr. A. Sen",
    "proposed_slot": "2026-08-26T17:00:00Z",
    "status": "requested"
  },

  "timeline": [
    { "at": "2026-08-20T09:14:00Z", "actor": "patient", "action": "uploaded_prescription", "detail": "rx1.jpg" },
    { "at": "2026-08-20T09:15:00Z", "actor": "intake_agent", "action": "extracted_tests", "detail": "3 tests found, 1 marked urgent" },
    { "at": "2026-08-20T09:15:00Z", "actor": "logistics_agent", "action": "found_labs", "detail": "4 centres within 5km" },
    { "at": "2026-08-20T09:16:00Z", "actor": "logistics_agent", "action": "requested_booking", "detail": "Email sent to Suraksha Diagnostics" },
    { "at": "2026-08-24T10:58:00Z", "actor": "patient", "action": "uploaded_report", "detail": "report1.pdf" },
    { "at": "2026-08-24T11:00:00Z", "actor": "diagnostics_agent", "action": "compared_history", "detail": "3 prior reports found" },
    { "at": "2026-08-24T11:01:00Z", "actor": "diagnostics_agent", "action": "flagged_anomaly", "detail": "Haemoglobin falling, now below range" }
  ],

  "error": null
}
```

### Nullability rules

- `prescription` is null only in `PRESCRIPTION_RECEIVED`
- `labs`, `bookings` are empty arrays until `LABS_SHORTLISTED` / `BOOKING_REQUESTED`
- `report` is null until `REPORT_RECEIVED`
- `analysis` is null until `TRENDS_ANALYZED`
- `consultation` is null unless `consult_needed` is true
- `timeline` is **never** empty and never null
- `error` is null unless state is `NEEDS_HUMAN`

**Rule for Neeraj: code defensively against every one of these being null.** The episode grows over time; early states have mostly nulls.

---

## 4. Enumerated values

Do not invent others. If you need one, message Shashank.

- `urgency`: `urgent` | `routine`
- `booking.status`: `requested` | `confirmed` | `no_response` | `failed`
- `value.flag`: `low` | `normal` | `high`
- `value.trend`: `rising` | `falling` | `stable` | `first_reading`
- `analysis.severity`: `normal` | `attention` | `urgent`
- `consultation.status`: `requested` | `confirmed` | `declined`
- `timeline.actor`: `patient` | `intake_agent` | `logistics_agent` | `diagnostics_agent` | `scheduler`

---

## 5. Errors

`NEEDS_HUMAN` populates the `error` object:

```json
{
  "error": {
    "code": "PRESCRIPTION_UNREADABLE",
    "message": "The prescription image could not be read clearly.",
    "action_hint": "Try uploading a clearer photo in good light.",
    "retryable": true
  }
}
```

Codes: `PRESCRIPTION_UNREADABLE`, `REPORT_UNREADABLE`, `NO_LABS_FOUND`, `LAB_NO_RESPONSE`, `EXTRACTION_FAILED`, `UNKNOWN_TEST`

HTTP errors use the same shape:
```json
{ "error": { "code": "NOT_FOUND", "message": "Episode not found", "retryable": false } }
```

---

## 6. Mock data

Create `frontend/mocks/` with one file per state. Suggested set:

- `01-prescription-received.json` — everything null except `prescription: null`, `state`, `timeline` with one entry
- `02-tests-identified.json` — prescription populated, labs empty
- `03-labs-shortlisted.json` — four labs, one `selected: true`
- `04-booking-requested.json` — bookings array populated, status `requested`
- `05-awaiting-report.json` — same, with days elapsed visible in timeline
- `06-trends-analyzed.json` — the full example from section 3
- `07-normal.json` — analysis present, `severity: normal`, `consult_needed: false`, no consultation
- `08-needs-human.json` — `error` populated with `PRESCRIPTION_UNREADABLE`
- `09-closed.json` — everything populated, state `CLOSED`

Build a mock loader that cycles through these on a timer so you can watch the UI progress without a backend at all. That also becomes a useful fallback if the backend has problems on demo day.

---

## 7. Polling

While state is not `CLOSED`, `NORMAL`, or `NEEDS_HUMAN`, poll `GET /api/episodes/{id}` every 3 seconds. Stop polling in terminal states. No websockets — not worth the hours.

---

## 8. Change log

Any change to this contract gets appended here with a date and a reason. If it is not in this file, it is not in the API.

- `2026-08-20` — initial version, frozen.
