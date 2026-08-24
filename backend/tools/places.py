"""Google Places API (New) client — find nearby diagnostic labs.

Uses the New Places API (places.googleapis.com/v1) — confirmed served for our key
(the legacy API is denied). Key comes from PLACES_API_KEY (Secret Manager in prod,
.env locally). Pure distance math is separated out so it's unit-testable without
a network call.

Build-plan §6.2: we never book — we find the lab, then request a slot by email and
hold a calendar slot. This module only does discovery.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from math import asin, cos, radians, sin, sqrt

_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.currentOpeningHours.openNow",
    "places.location",
])


class PlacesError(Exception):
    """Raised when the Places call fails (no key, HTTP error, etc.)."""


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km between two lat/lng points."""
    r = 6371.0
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def search_labs(
    lat: float,
    lng: float,
    *,
    query: str = "diagnostic pathology lab",
    radius_m: int = 6000,
    max_results: int = 8,
) -> list[dict]:
    """Return nearby diagnostic labs, each normalised to the fields the Lab model
    needs. Sorted by distance. Raises PlacesError on failure."""
    key = os.getenv("PLACES_API_KEY")
    if not key:
        raise PlacesError("PLACES_API_KEY not set")

    body = json.dumps({
        "textQuery": query,
        "maxResultCount": max_results,
        "locationBias": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": float(radius_m)}
        },
    }).encode()
    req = urllib.request.Request(
        _SEARCH_URL, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": _FIELD_MASK,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as exc:
        raise PlacesError(f"Places HTTP {exc.code}: {exc.read().decode()[:200]}") from exc
    except Exception as exc:  # noqa: BLE001
        raise PlacesError(f"Places call failed: {exc}") from exc

    labs = [_normalise(p, lat, lng) for p in data.get("places", [])]
    return sorted(labs, key=lambda c: c["distance_km"])


def _normalise(place: dict, lat: float, lng: float) -> dict:
    loc = place.get("location", {})
    plat, plng = loc.get("latitude", lat), loc.get("longitude", lng)
    # openNow absent (lab didn't publish live hours) -> treat as available rather
    # than penalise it in ranking.
    open_now = place.get("currentOpeningHours", {}).get("openNow", True)
    return {
        "place_id": place.get("id", ""),
        "name": place.get("displayName", {}).get("text", ""),
        "address": place.get("formattedAddress", ""),
        "rating": float(place.get("rating") or 0.0),
        "open_now": bool(open_now),
        "distance_km": round(haversine_km(lat, lng, plat, plng), 1),
    }
