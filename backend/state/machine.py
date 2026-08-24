"""The episode state machine (build-plan §4, contract §1).

Every transition is explicit and legal-checked. This is the single place that
decides what may follow what, so the agents never silently jump states. Each
transition also appends to the episode timeline — that array *is* the demo.
"""

from __future__ import annotations

from models import Episode, EpisodeState, TimelineActor, TimelineEntry, iso_now

# The happy-path graph. NEEDS_HUMAN is handled separately (reachable from any
# live state, and retryable back out) so it doesn't clutter every entry here.
TRANSITIONS: dict[EpisodeState, set[EpisodeState]] = {
    "PRESCRIPTION_RECEIVED": {"TESTS_IDENTIFIED"},
    "TESTS_IDENTIFIED": {"LABS_SHORTLISTED"},
    "LABS_SHORTLISTED": {"BOOKING_REQUESTED"},
    "BOOKING_REQUESTED": {"AWAITING_REPORT"},
    "AWAITING_REPORT": {"REPORT_RECEIVED"},
    "REPORT_RECEIVED": {"TRENDS_ANALYZED"},
    "TRENDS_ANALYZED": {"ANOMALY_FOUND", "NORMAL"},
    "ANOMALY_FOUND": {"CONSULT_REQUESTED"},
    "CONSULT_REQUESTED": {"CLOSED"},
    "NORMAL": {"CLOSED"},
    "CLOSED": set(),
    "NEEDS_HUMAN": set(),
}

# CLOSED is the only fully terminal state. NORMAL and NEEDS_HUMAN stop UI polling
# (contract §7) but can still move on (NORMAL -> CLOSED, NEEDS_HUMAN -> retry).
TERMINAL: frozenset[EpisodeState] = frozenset({"CLOSED"})

# States a NEEDS_HUMAN episode may resume into on retry — everything that is
# still "live" work. Not CLOSED (nothing to retry) and not NEEDS_HUMAN itself.
_RESUMABLE: frozenset[EpisodeState] = frozenset(
    s for s in TRANSITIONS if s not in ("CLOSED", "NEEDS_HUMAN")
)


class InvalidTransition(Exception):
    """Raised when a state change is not permitted by the machine."""


def can_transition(src: EpisodeState, dst: EpisodeState) -> bool:
    if src in TERMINAL:
        return False
    if dst == "NEEDS_HUMAN":
        return src != "NEEDS_HUMAN"  # any live state may escalate
    if src == "NEEDS_HUMAN":
        return dst in _RESUMABLE  # retry resumes live work
    return dst in TRANSITIONS.get(src, set())


def transition(
    episode: Episode,
    to: EpisodeState,
    actor: TimelineActor,
    action: str,
    detail: str | None = None,
    now: str | None = None,
) -> Episode:
    """Move `episode` to state `to`, appending a timeline entry.

    Mutates and returns the same episode (convenient for chaining). Raises
    InvalidTransition if the move is illegal — callers should let that surface
    rather than swallow it; an illegal transition is a bug, not a user error.
    """
    if not can_transition(episode.state, to):
        raise InvalidTransition(
            f"{episode.state} -> {to} is not a legal transition"
        )
    at = now or iso_now()
    episode.state = to
    episode.updated_at = at
    episode.timeline.append(
        TimelineEntry(at=at, actor=actor, action=action, detail=detail)
    )
    return episode


def log(
    episode: Episode,
    actor: TimelineActor,
    action: str,
    detail: str | None = None,
    now: str | None = None,
) -> Episode:
    """Append a timeline entry without changing state (e.g. scheduler nudges)."""
    at = now or iso_now()
    episode.updated_at = at
    episode.timeline.append(
        TimelineEntry(at=at, actor=actor, action=action, detail=detail)
    )
    return episode
