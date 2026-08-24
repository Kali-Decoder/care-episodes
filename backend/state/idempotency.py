"""Idempotency keys (build-plan §4).

Cloud Scheduler *will* fire twice; a crash can land between "email sent" and
"state written". The rule that survives both: build a stable key per action,
claim it in the store *before* doing the side effect, and skip if already
claimed. The claim itself lives in the store (atomic create in Firestore); this
module owns the key format and a thin helper.
"""

from __future__ import annotations

from typing import Protocol


class SupportsClaim(Protocol):
    def claim_idempotency_key(self, key: str, episode_id: str) -> bool:
        """Return True if newly claimed, False if the key already existed."""
        ...


def make_key(episode_id: str, test_code: str, attempt: int = 1) -> str:
    """Stable key for a single booking attempt: `{episode}:{test}:{attempt}`."""
    return f"{episode_id}:{test_code}:{attempt}"


def claim(store: SupportsClaim, episode_id: str, test_code: str, attempt: int = 1) -> bool:
    """Claim the key for this action. True => proceed with the side effect;
    False => a prior attempt already did it, skip. Call this BEFORE sending."""
    return store.claim_idempotency_key(make_key(episode_id, test_code, attempt), episode_id)
