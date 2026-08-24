"""Gmail API — send the booking-request email (build-plan §6.2).

We never "book" (no Indian lab exposes a booking API); we send a real booking
request by email. Sends as the authenticated account (userId="me").
"""

from __future__ import annotations

import base64
from email.message import EmailMessage

from googleapiclient.discovery import build

from tools import google_oauth

_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


class GmailError(Exception):
    pass


def send_email(to: str, subject: str, body: str) -> str:
    """Send a plain-text email; returns the Gmail message id."""
    try:
        service = build("gmail", "v1", credentials=google_oauth.credentials(_SCOPES),
                        cache_discovery=False)
        message = EmailMessage()
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        return sent["id"]
    except Exception as exc:  # noqa: BLE001
        raise GmailError(f"Gmail send failed: {exc}") from exc
