"""Indian-timezone helpers for scheduling + friendly display.

Slots are stored as UTC ISO ("...Z") for machine use (Calendar API, contract),
but computed at sensible IST clock times and formatted for humans in IST.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def _parse_utc(iso_z: str) -> datetime:
    return datetime.strptime(iso_z, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def next_day_slot(at_iso_z: str, hour: int = 8, minute: int = 0) -> str:
    """The next calendar day at hour:minute IST, returned as UTC ISO ('...Z')."""
    ist = _parse_utc(at_iso_z).astimezone(IST)
    slot = (ist + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)
    return slot.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def friendly_ist(iso_z: str) -> str:
    """Format a UTC ISO timestamp for humans in IST, e.g. 'Fri, 21 Aug 2026, 8:00 AM IST'."""
    ist = _parse_utc(iso_z).astimezone(IST)
    return ist.strftime("%a, %d %b %Y, %-I:%M %p IST")
