"""Patient profiles (no auth — "pick who you are").

A small registry of demo patients. Everything downstream is already keyed by
patient_id (episodes, history, idempotency), so multiple profiles just work; this
adds display names + a per-patient location so the logistics agent finds labs in
each patient's own city.

`demo-patient-01` is kept as Shashank's id for backward compatibility (the
originally-deployed frontend + already-seeded ESR history use it).

Locations/names are demo values — edit freely.
"""

from __future__ import annotations

# Default location if a patient isn't in the registry (Salt Lake, Kolkata).
DEFAULT_LOCATION = (22.5808, 88.4258)

PROFILES: dict[str, dict] = {
    "demo-patient-01": {
        "name": "Shashank Shekhar",
        "city": "Salt Lake, Kolkata",
        "lat": 22.5808, "lng": 88.4258,
        "scenario": "Rising ESR across three reports → anomaly → consult",
    },
    "neeraj": {
        "name": "Neeraj Choubisa",
        "city": "Udaipur",
        "lat": 24.5854, "lng": 73.7125,
        "scenario": "All results within range → normal, no consult",
    },
    "rakesh": {
        "name": "Rakesh Kumar",
        "city": "Bengaluru",
        "lat": 12.9716, "lng": 77.5946,
        "scenario": "New patient, booking requested → awaiting first report",
    },
}


def exists(patient_id: str) -> bool:
    return patient_id in PROFILES


def location_for(patient_id: str) -> tuple[float, float]:
    p = PROFILES.get(patient_id)
    return (p["lat"], p["lng"]) if p else DEFAULT_LOCATION


def name_for(patient_id: str) -> str:
    p = PROFILES.get(patient_id)
    return p["name"] if p else patient_id


def list_profiles() -> list[dict]:
    """Shape the picker consumes: id + display fields."""
    return [
        {"patient_id": pid, "name": p["name"], "city": p["city"], "scenario": p["scenario"]}
        for pid, p in PROFILES.items()
    ]
