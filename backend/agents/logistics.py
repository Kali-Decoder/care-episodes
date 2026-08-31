"""Logistics agent (ADK, tool-using): find nearby labs and request bookings.

The third specialist, and the one that shows ADK *tool-calling*: an ADK LlmAgent
is given a `find_nearby_labs` tool (Google Places, New API) and decides which lab
to use — preferring open, well-rated, close centres, and skipping the nearest if
it's closed (build-plan §3). Selection is genuine agent reasoning; a deterministic
fallback guarantees a choice even if the model output is unusable.

Booking stays deterministic and idempotency-guarded (build-plan §4/§6.2): we never
"book", we request a slot + hold a calendar slot. The email/calendar send is still
stubbed until Gmail/Calendar are wired; the idempotency guard is real.
"""

from __future__ import annotations

import json
import os

from google.genai import types

import patients
from agents.adk import make_agent, run_agent_capturing
from models import Booking, Episode, Lab, iso_now
from state import idempotency
from tools import calendar as calendar_tool
from tools import gmail, google_oauth, places, timeutils

# Demo patient location (Salt Lake, Kolkata). Real system would read patients/{id}.
_MAX_SHORTLIST = 4  # how many candidates to keep on the episode for the UI


def _make_find_nearby_labs(lat: float, lng: float):
    """Build the Places tool bound to this patient's location. A closure keeps the
    coords out of the tool signature (the LLM only passes `tests`), so each
    episode searches the patient's own city with no shared/global state."""

    def find_nearby_labs(tests: list[str]) -> dict:
        """Find diagnostic labs near the patient that can run the ordered tests.

        Args:
            tests: test codes/names ordered for the patient (context for the search).

        Returns:
            {"labs": [{place_id, name, address, rating, open_now, distance_km}, ...]}
            (empty list if none found or Places is unavailable).
        """
        try:
            return {"labs": places.search_labs(lat, lng)}
        except places.PlacesError:
            return {"labs": []}

    return find_nearby_labs


_INSTRUCTION = """You are a logistics agent arranging a patient's diagnostic tests.
Call find_nearby_labs with the ordered tests to get nearby diagnostic centres.
Then choose the SINGLE best lab: prefer centres that are open now, well-rated, and
close. If the closest is closed, pick the next best that is open.
Reply with ONLY a JSON object and nothing else:
{"place_id": "<chosen place_id>", "reason": "<one short sentence>"}"""


def _agent(lat: float, lng: float):
    return make_agent("logistics_agent", os.getenv("VERTEX_MODEL_FAST", "gemini-3.5-flash"),
                      _INSTRUCTION, tools=[_make_find_nearby_labs(lat, lng)])


def shortlist_labs(episode: Episode, lat: float | None = None, lng: float | None = None) -> list[Lab]:
    """Run the ADK logistics agent to find + select a lab. Returns candidate Labs
    (one `selected`), or [] if none found (caller escalates to NEEDS_HUMAN)."""
    tests = [t.test_code for t in episode.prescription.tests] if episode.prescription else []
    # Prefer the device's pinpoint location (passed at episode creation); fall back
    # to the patient profile's home city.
    if lat is None or lng is None:
        lat, lng = patients.location_for(episode.patient_id)
    parts = [types.Part.from_text(
        text=f"Ordered tests: {', '.join(tests) or 'general diagnostics'}. Find and select the best lab."
    )]

    final, tool_out = run_agent_capturing(_agent(lat, lng), parts)
    # fallback: direct Places call at the same location if capture/selection fails
    candidates = _candidates_from(tool_out)
    if not candidates:
        try:
            candidates = places.search_labs(lat, lng)
        except places.PlacesError:
            candidates = []
    if not candidates:
        return []

    candidates = candidates[:_MAX_SHORTLIST]
    sel_id, reason = _parse_selection(final)
    if not any(c["place_id"] == sel_id for c in candidates):
        sel_id, reason = _fallback_select(candidates)  # model unusable -> deterministic

    return [
        Lab(
            place_id=c["place_id"], name=c["name"], address=c["address"],
            rating=c["rating"], distance_km=c["distance_km"], open_now=c["open_now"],
            selected=(c["place_id"] == sel_id),
            selection_reason=reason if c["place_id"] == sel_id else None,
        )
        for c in candidates
    ]


def _candidates_from(tool_out: dict) -> list[dict]:
    resp = tool_out.get("find_nearby_labs") or {}
    # ADK may hand back the dict directly or wrapped under "result".
    if isinstance(resp, dict):
        return resp.get("labs") or (resp.get("result", {}) or {}).get("labs", []) or []
    return []


def _parse_selection(text: str | None) -> tuple[str | None, str]:
    if not text:
        return None, ""
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(cleaned)
        return data.get("place_id"), data.get("reason", "")
    except (json.JSONDecodeError, AttributeError):
        return None, ""


def _fallback_select(candidates: list[dict]) -> tuple[str, str]:
    """Deterministic pick: open first, then highest rating, then nearest."""
    best = sorted(candidates, key=lambda c: (not c["open_now"], -c["rating"], c["distance_km"]))[0]
    return best["place_id"], "Closest well-rated centre currently open (auto-selected)."


def _slot_hold(at: str) -> str:
    """Proposed slot: next day at 8:00 AM IST (stored as UTC ISO)."""
    return timeutils.next_day_slot(at, hour=8)


def request_bookings(episode: Episode, store, *, now: str | None = None) -> list[Booking]:
    """Request one booking per ordered test, guarded by idempotency.

    Returns only the bookings created this call. A test whose key was already
    claimed (a retry / double-fire) is skipped — the guard working, not an error.
    """
    if episode.prescription is None or not episode.labs:
        return []

    at = now or iso_now()
    lab = next((l for l in episode.labs if l.selected), episode.labs[0])
    slot = _slot_hold(at)

    created: list[Booking] = []
    for test in episode.prescription.tests:
        # Claim BEFORE the side effect. False => already requested, skip.
        if not idempotency.claim(store, episode.episode_id, test.test_code):
            continue
        created.append(
            Booking(
                test_code=test.test_code, lab_name=lab.name, requested_at=at,
                status="requested", slot_hold=slot,
                idempotency_key=idempotency.make_key(episode.episode_id, test.test_code),
            )
        )
    return created


def send_booking_request(episode: Episode, store, *, now: str | None = None) -> dict | None:
    """Send the real booking-request email + create a tentative calendar hold.

    Idempotency-guarded (one send per episode, key claimed before the send so a
    retry/double-fire can't re-send). Returns a summary dict, or None if OAuth
    isn't configured, it was already sent, or there's nothing to send. Email and
    calendar failures are captured in the result, not raised — a failed
    notification must not break the episode's progression.
    """
    if not google_oauth.configured():
        return None
    lab = next((l for l in episode.labs if l.selected), None)
    if lab is None or not episode.bookings or episode.prescription is None:
        return None
    if not idempotency.claim(store, episode.episode_id, "BOOKING_NOTIFY"):
        return None  # already sent — the guard working

    slot = episode.bookings[0].slot_hold
    when = timeutils.friendly_ist(slot)
    test_lines = "\n".join(f"  •  {t.display_name}" for t in episode.prescription.tests)
    body = (
        f"Hello,\n\n"
        f"This is a lab booking request from the Care Episode Agent.\n\n"
        f"Tests requested:\n{test_lines}\n\n"
        f"Lab:      {lab.name}\n"
        f"Address:  {lab.address}\n"
        f"Preferred appointment:  {when}\n\n"
        f"Please confirm availability for this slot.\n\n"
        f"Thank you,\nCare Episode Agent\n\n"
        f"— Automated request. This is not medical advice; a doctor reviews all results."
    )
    subject = f"Lab booking request — {lab.name} ({when})"
    result: dict = {"when": when}
    recipient = os.getenv("NOTIFY_EMAIL")
    if recipient:
        try:
            result["message_id"] = gmail.send_email(recipient, subject, body)
            result["to"] = recipient
        except gmail.GmailError as exc:
            result["email_error"] = str(exc)[:150]
    try:
        hold = calendar_tool.create_hold(f"Diagnostic tests — {lab.name}", slot, description=body)
        result.update(event_id=hold["event_id"], html_link=hold["html_link"])
    except calendar_tool.CalendarError as exc:
        result["calendar_error"] = str(exc)[:150]
    return result or None
