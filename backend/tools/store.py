"""Episode persistence: the interface, plus an in-memory implementation.

Everything the agents and API touch goes through `EpisodeStore`. Development,
tests, and the mock/demo fallback use `InMemoryEpisodeStore`; production swaps in
`FirestoreEpisodeStore` (tools/firestore_store.py) behind the same interface, so
no caller changes. This is what keeps the walking skeleton runnable without GCP.
"""

from __future__ import annotations

from typing import Protocol

from models import Episode, ResultHistoryPoint


class EpisodeStore(Protocol):
    def get(self, episode_id: str) -> Episode | None: ...

    def put(self, episode: Episode) -> None:
        """Create or replace the whole episode document."""
        ...

    def list_for_patient(self, patient_id: str) -> list[Episode]: ...

    def list_by_states(self, states: list[str]) -> list[Episode]:
        """Episodes currently in any of the given states — the scheduler query."""
        ...

    def claim_idempotency_key(self, key: str, episode_id: str) -> bool:
        """Atomically claim a key. True if newly claimed, False if it existed."""
        ...

    # --- Patient result history (contract: results/{patient_id}/history/{test}) ---
    # This is the cross-episode memory the diagnostics agent compares against.

    def get_history(self, patient_id: str, test_code: str) -> list[ResultHistoryPoint]:
        """Prior readings for one test, oldest first."""
        ...

    def append_history(self, patient_id: str, test_code: str, point: ResultHistoryPoint) -> None:
        """Record a new reading for future episodes to compare against."""
        ...


class InMemoryEpisodeStore:
    """Non-persistent store for dev, tests, and the demo fallback."""

    def __init__(self) -> None:
        self._episodes: dict[str, Episode] = {}
        self._claimed: set[str] = set()
        self._history: dict[tuple[str, str], list[ResultHistoryPoint]] = {}

    def get(self, episode_id: str) -> Episode | None:
        ep = self._episodes.get(episode_id)
        # Hand back a copy so callers can't mutate stored state by reference.
        return ep.model_copy(deep=True) if ep else None

    def put(self, episode: Episode) -> None:
        self._episodes[episode.episode_id] = episode.model_copy(deep=True)

    def list_for_patient(self, patient_id: str) -> list[Episode]:
        eps = [
            e.model_copy(deep=True)
            for e in self._episodes.values()
            if e.patient_id == patient_id
        ]
        return sorted(eps, key=lambda e: e.created_at, reverse=True)

    def list_by_states(self, states: list[str]) -> list[Episode]:
        return [
            e.model_copy(deep=True)
            for e in self._episodes.values()
            if e.state in states
        ]

    def claim_idempotency_key(self, key: str, episode_id: str) -> bool:
        if key in self._claimed:
            return False
        self._claimed.add(key)
        return True

    def get_history(self, patient_id: str, test_code: str) -> list[ResultHistoryPoint]:
        points = self._history.get((patient_id, test_code), [])
        return [p.model_copy() for p in sorted(points, key=lambda p: p.date)]

    def append_history(self, patient_id: str, test_code: str, point: ResultHistoryPoint) -> None:
        self._history.setdefault((patient_id, test_code), []).append(point.model_copy())
