"""Firestore-backed EpisodeStore (production).

Collections (build-plan §7):
  episodes/{episode_id}     the full episode document
  idempotency/{key}         one doc per claimed action key

The idempotency claim is an atomic `create` — it fails if the doc already
exists, which is exactly the guarantee we need against double-fires. The
google-cloud-firestore import is lazy so the rest of the backend (and the
in-memory tests) run without the dependency installed.
"""

from __future__ import annotations

from models import Episode, ResultHistoryPoint

_EPISODES = "episodes"
_IDEMPOTENCY = "idempotency"
_RESULTS = "results"
_HISTORY = "history"


class FirestoreEpisodeStore:
    def __init__(self, project: str | None = None, database: str = "(default)") -> None:
        from google.cloud import firestore  # lazy: not needed for in-memory path
        from google.cloud.firestore_v1.base_query import FieldFilter

        self._db = firestore.Client(project=project, database=database)
        self._firestore = firestore
        self._FieldFilter = FieldFilter

    def get(self, episode_id: str) -> Episode | None:
        snap = self._db.collection(_EPISODES).document(episode_id).get()
        return Episode.model_validate(snap.to_dict()) if snap.exists else None

    def put(self, episode: Episode) -> None:
        self._db.collection(_EPISODES).document(episode.episode_id).set(
            episode.model_dump()
        )

    def list_for_patient(self, patient_id: str) -> list[Episode]:
        # Sort in Python: where + order_by on different fields would force a
        # composite index, and the demo's volume doesn't warrant one.
        query = self._db.collection(_EPISODES).where(
            filter=self._FieldFilter("patient_id", "==", patient_id)
        )
        eps = [Episode.model_validate(d.to_dict()) for d in query.stream()]
        return sorted(eps, key=lambda e: e.created_at, reverse=True)

    def list_by_states(self, states: list[str]) -> list[Episode]:
        query = self._db.collection(_EPISODES).where(
            filter=self._FieldFilter("state", "in", states)
        )
        return [Episode.model_validate(d.to_dict()) for d in query.stream()]

    def claim_idempotency_key(self, key: str, episode_id: str) -> bool:
        doc = self._db.collection(_IDEMPOTENCY).document(key)
        try:
            # create() raises AlreadyExists if the key was claimed before —
            # atomic, so two concurrent scheduler fires cannot both proceed.
            doc.create(
                {"episode_id": episode_id, "created_at": self._firestore.SERVER_TIMESTAMP}
            )
            return True
        except Exception as exc:  # google.api_core.exceptions.AlreadyExists
            if type(exc).__name__ == "AlreadyExists":
                return False
            raise

    def _history_doc(self, patient_id: str, test_code: str):
        # results/{patient_id}/history/{test_code}, a single doc holding values[].
        return (
            self._db.collection(_RESULTS)
            .document(patient_id)
            .collection(_HISTORY)
            .document(test_code)
        )

    def get_history(self, patient_id: str, test_code: str) -> list[ResultHistoryPoint]:
        snap = self._history_doc(patient_id, test_code).get()
        if not snap.exists:
            return []
        values = snap.to_dict().get("values", [])
        points = [ResultHistoryPoint.model_validate(v) for v in values]
        return sorted(points, key=lambda p: p.date)

    def append_history(self, patient_id: str, test_code: str, point: ResultHistoryPoint) -> None:
        self._history_doc(patient_id, test_code).set(
            {"values": self._firestore.ArrayUnion([point.model_dump()])}, merge=True
        )
