"""Calendar API — hold a tentative slot for the lab visit (build-plan §6.2).

A real Calendar event with status=tentative on the account's primary calendar.
No attendees (avoids emailing anyone); it's a hold, not an invite.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from googleapiclient.discovery import build

from tools import google_oauth

_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


class CalendarError(Exception):
    pass


def _plus_hour(iso_z: str) -> str:
    base = datetime.strptime(iso_z, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    return (base + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")


def create_hold(summary: str, start_iso_z: str, *, description: str = "") -> dict:
    """Create a 1-hour tentative hold starting at start_iso_z (RFC3339 UTC).
    Returns {event_id, html_link}."""
    try:
        service = build("calendar", "v3", credentials=google_oauth.credentials(_SCOPES),
                        cache_discovery=False)
        event = {
            "summary": summary,
            "description": description,
            "status": "tentative",
            "start": {"dateTime": start_iso_z, "timeZone": "UTC"},
            "end": {"dateTime": _plus_hour(start_iso_z), "timeZone": "UTC"},
        }
        created = service.events().insert(calendarId="primary", body=event).execute()
        return {"event_id": created["id"], "html_link": created.get("htmlLink", "")}
    except Exception as exc:  # noqa: BLE001
        raise CalendarError(f"Calendar hold failed: {exc}") from exc
