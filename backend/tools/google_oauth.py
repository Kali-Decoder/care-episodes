"""OAuth user credentials for Gmail + Calendar (build-plan §6.8).

We hold a long-lived refresh token (Secret Manager: google-oauth-credentials) for
a test-user account with the gmail.send and calendar.events scopes. In prod the
whole secret JSON is injected as OAUTH_CREDENTIALS_JSON; locally the three fields
are individual env vars. Either way we mint short-lived access tokens on demand.

Token expiry warning: while the OAuth app is in Testing, refresh tokens die in
~7 days — regenerate before the demo (see docs/status.md).
"""

from __future__ import annotations

import json
import os

from google.oauth2.credentials import Credentials

_TOKEN_URI = "https://oauth2.googleapis.com/token"


class OAuthError(Exception):
    """Raised when OAuth credentials are missing or malformed."""


def _fields() -> tuple[str | None, str | None, str | None]:
    raw = os.getenv("OAUTH_CREDENTIALS_JSON")
    if raw:
        d = json.loads(raw)
        return d.get("client_id"), d.get("client_secret"), d.get("refresh_token")
    return (
        os.getenv("OAUTH_CLIENT_ID"),
        os.getenv("OAUTH_CLIENT_SECRET"),
        os.getenv("OAUTH_REFRESH_TOKEN"),
    )


def configured() -> bool:
    """True if OAuth creds are present (lets callers skip real sends gracefully)."""
    return all(_fields())


def credentials(scopes: list[str]) -> Credentials:
    client_id, client_secret, refresh_token = _fields()
    if not (client_id and client_secret and refresh_token):
        raise OAuthError("OAuth credentials not configured")
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri=_TOKEN_URI,
        scopes=scopes,
    )
