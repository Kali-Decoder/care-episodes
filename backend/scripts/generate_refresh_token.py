"""Regenerate the Gmail + Calendar OAuth refresh token.

Refresh tokens expire in ~7 days while the OAuth app is in Testing mode, so this
must be re-run before a demo. Runs the OAuth consent flow in your browser and
prints a fresh refresh token (same scopes: gmail.send + calendar.events).

MUST run on your laptop (needs a local browser) — NOT Cloud Shell / a VM.

Usage:
    cd backend && source venv/bin/activate
    pip install google-auth-oauthlib
    python scripts/generate_refresh_token.py

Then update the token in three places (see the printout at the end):
  1) backend/.env  ->  OAUTH_REFRESH_TOKEN=...
  2) Secret Manager google-oauth-credentials (so Cloud Run picks it up)
  3) redeploy is NOT needed if the secret is read at :latest — but restart/redeploy
     to be safe (deploy.sh uses google-oauth-credentials:latest).
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events",
]


def main() -> int:
    client_id = os.getenv("OAUTH_CLIENT_ID")
    client_secret = os.getenv("OAUTH_CLIENT_SECRET")
    if not (client_id and client_secret):
        raise SystemExit("OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET missing from .env")

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    # Opens a browser; sign in as the account that sends email / owns the calendar.
    # access_type=offline + prompt=consent forces a fresh refresh token.
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")

    if not creds.refresh_token:
        raise SystemExit("No refresh token returned. Retry with a fresh consent.")

    print("\n" + "=" * 70)
    print("NEW REFRESH TOKEN (update everywhere below):\n")
    print(creds.refresh_token)
    print("\n" + "=" * 70)
    print("Update these:")
    print("  1) backend/.env  ->  OAUTH_REFRESH_TOKEN=<the token above>")
    print("  2) Secret Manager google-oauth-credentials (new version) — see command below")
    print("  3) redeploy Cloud Run so it picks up the new secret version")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
