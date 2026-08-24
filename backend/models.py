"""Domain models for the Care Episode Agent.

These mirror the frozen API contract (docs/api-contract.md §3) field-for-field,
which is also what the frontend expects (frontend/client/src/care/types.ts).
`Episode.model_dump()` therefore produces exactly the JSON the UI consumes and
the shape stored in Firestore. Do not add fields without updating the contract.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

EpisodeState = Literal[
    "PRESCRIPTION_RECEIVED",
    "TESTS_IDENTIFIED",
    "LABS_SHORTLISTED",
    "BOOKING_REQUESTED",
    "AWAITING_REPORT",
    "REPORT_RECEIVED",
    "TRENDS_ANALYZED",
    "ANOMALY_FOUND",
    "CONSULT_REQUESTED",
    "NORMAL",
    "CLOSED",
    "NEEDS_HUMAN",
]

TimelineActor = Literal[
    "patient",
    "intake_agent",
    "logistics_agent",
    "diagnostics_agent",
    "scheduler",
]


def iso_now() -> str:
    """Current UTC time as an ISO-8601 string, per the contract (all UTC)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class TimelineEntry(BaseModel):
    at: str
    actor: TimelineActor
    action: str
    detail: str | None = None


class Medicine(BaseModel):
    name: str
    dose: str = ""
    frequency: str = ""


class PrescriptionTest(BaseModel):
    test_code: str
    display_name: str
    urgency: Literal["urgent", "routine"]


class Prescription(BaseModel):
    doctor: str = ""
    date: str = ""
    diagnosis: str = ""
    medicines: list[Medicine] = Field(default_factory=list)
    tests: list[PrescriptionTest] = Field(default_factory=list)
    source_file_url: str | None = None


class Lab(BaseModel):
    place_id: str
    name: str
    address: str
    rating: float
    distance_km: float
    open_now: bool
    selected: bool
    selection_reason: str | None = None


class Booking(BaseModel):
    test_code: str
    lab_name: str
    requested_at: str
    status: Literal["requested", "confirmed", "no_response", "failed"]
    slot_hold: str | None = None
    idempotency_key: str


class ResultHistoryPoint(BaseModel):
    date: str
    value: float


class ReportValue(BaseModel):
    test_code: str
    display_name: str
    value: float
    unit: str
    ref_low: float
    ref_high: float
    flag: Literal["low", "normal", "high"]
    trend: Literal["rising", "falling", "stable", "first_reading"]
    history: list[ResultHistoryPoint] = Field(default_factory=list)


class Report(BaseModel):
    received_at: str
    source_file_url: str | None = None
    values: list[ReportValue] = Field(default_factory=list)


class Analysis(BaseModel):
    severity: Literal["normal", "attention", "urgent"]
    consult_needed: bool
    findings: list[str] = Field(default_factory=list)
    patient_summary: str
    disclaimer: str


class Consultation(BaseModel):
    requested_at: str
    doctor: str
    proposed_slot: str
    status: Literal["requested", "confirmed", "declined"]


class EpisodeError(BaseModel):
    code: str
    message: str
    action_hint: str = ""
    retryable: bool = True


class Episode(BaseModel):
    episode_id: str
    patient_id: str
    state: EpisodeState
    created_at: str
    updated_at: str
    summary_line: str = ""

    prescription: Prescription | None = None
    labs: list[Lab] = Field(default_factory=list)
    bookings: list[Booking] = Field(default_factory=list)
    report: Report | None = None
    analysis: Analysis | None = None
    consultation: Consultation | None = None
    timeline: list[TimelineEntry] = Field(default_factory=list)
    error: EpisodeError | None = None

    def summary(self) -> dict:
        """The lightweight shape returned by GET /api/episodes (contract §2)."""
        upload = next(
            (t.detail for t in self.timeline if t.action == "uploaded_prescription"),
            None,
        )
        return {
            "episode_id": self.episode_id,
            "state": self.state,
            "summary_line": self.summary_line,
            "created_at": self.created_at,
            "upload_name": upload,
        }


def new_episode(
    episode_id: str,
    patient_id: str,
    upload_name: str,
    now: str | None = None,
) -> Episode:
    """Create a fresh episode in PRESCRIPTION_RECEIVED.

    The timeline is never empty (contract §3): it starts with the patient's
    upload. `now` is injectable so callers/tests can control timestamps.
    """
    at = now or iso_now()
    return Episode(
        episode_id=episode_id,
        patient_id=patient_id,
        state="PRESCRIPTION_RECEIVED",
        created_at=at,
        updated_at=at,
        timeline=[
            TimelineEntry(
                at=at,
                actor="patient",
                action="uploaded_prescription",
                detail=upload_name,
            )
        ],
    )
