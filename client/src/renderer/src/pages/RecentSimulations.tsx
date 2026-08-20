import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'
import RecentSimulationRow from '../components/simulation/RecentSimulationRow'
import { useProfile } from '../context/ProfileContext'
import { MUTED, TEAL, monoFont, sansFont } from '../theme'
import type {
  SimulationOutcome,
  SimulationParent,
  SimulationProgressEvent,
} from '../../../preload/simulation'

export default function RecentSimulations() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [sims, setSims] = useState<SimulationParent[]>([])
  const [outcomesBySim, setOutcomesBySim] = useState<Record<string, SimulationOutcome[]>>({})
  const [outcomesLoading, setOutcomesLoading] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedSimIds, setSelectedSimIds] = useState<Set<string>>(new Set())

  const loadSims = useCallback(async () => {
    if (!profile) return
    try {
      const list = await window.api.simulations.list(profile.id)
      setSims(list)
    } catch (err) {
      console.error('Failed to load simulations:', err)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const loadOutcomes = useCallback(
    async (simId: string) => {
      if (!profile) return
      setOutcomesLoading((m) => ({ ...m, [simId]: true }))
      try {
        const list = await window.api.simulations.listOutcomes(profile.id, simId)
        setOutcomesBySim((m) => ({ ...m, [simId]: list }))
      } catch (err) {
        console.error('Failed to load outcomes for', simId, err)
      } finally {
        setOutcomesLoading((m) => ({ ...m, [simId]: false }))
      }
    },
    [profile]
  )

  useEffect(() => {
    loadSims()
  }, [loadSims])

  // Subscribe to worker progress events and patch the matching row + outcome.
  useEffect(() => {
    if (!profile) return
    const unsubscribe = window.api.simulations.onProgress(
      (event: SimulationProgressEvent) => {
        setSims((prev) =>
          prev.map((s) =>
            s.id === event.simId
              ? {
                  ...s,
                  completedCount: event.completedCount,
                  outcomeCount: event.outcomeCount,
                  status: deriveStatus(event),
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        )
        setOutcomesBySim((prev) => {
          const list = prev[event.simId]
          if (!list) return prev
          // Planning-pass events use `outcomeId: ''` so no outcome in
          // the list matches — the map call below leaves outcomes
          // untouched, which is exactly what we want.
          return {
            ...prev,
            [event.simId]: list.map((o) =>
              o.id === event.outcomeId
                ? { ...o, status: event.status, error: event.error }
                : o
            ),
          }
        })
      }
    )
    return unsubscribe
  }, [profile])

  async function handleToggle(simId: string) {
    const isOpen = expanded.has(simId)
    const next = new Set(expanded)
    if (isOpen) {
      next.delete(simId)
    } else {
      next.add(simId)
      if (!outcomesBySim[simId] && !outcomesLoading[simId]) {
        await loadOutcomes(simId)
      }
    }
    setExpanded(next)
  }

  function handleOpenOutcome(sessionSlug: string) {
    navigate(`/chat?session=${sessionSlug}`)
  }

  function handleOpenReport(simId: string) {
    navigate(`/simulations/${simId}/report`)
  }

  async function handleRequeueOutcome(simId: string, outcomeId: string) {
    if (!profile) return
    try {
      await window.api.simulations.requeue(profile.id, simId, outcomeId)
      // Optimistic local update — the worker will re-emit progress.
      setOutcomesBySim((prev) => {
        const list = prev[simId]
        if (!list) return prev
        return {
          ...prev,
          [simId]: list.map((o) =>
            o.id === outcomeId ? { ...o, status: 'pending', error: undefined } : o
          ),
        }
      })
      // The server decremented the parent's errorCount; refresh so the
      // row reads the new count immediately rather than waiting for the
      // next progress event.
      await loadSims()
    } catch (err) {
      console.error('Failed to requeue outcome:', err)
    }
  }

  async function handleRequeueAll(simId: string) {
    if (!profile) return
    try {
      await window.api.simulations.requeue(profile.id, simId)
      // Refresh both the outcomes (now pending) and the parent
      // (errorCount decremented, status recomputed by bumpCompleted).
      await Promise.all([loadOutcomes(simId), loadSims()])
    } catch (err) {
      console.error('Failed to requeue all:', err)
    }
  }

  async function handleDelete(sim: SimulationParent) {
    if (!profile) return
    const confirmed = window.confirm(
      `Delete "${sim.name}"? This will also remove all child chat sessions.`
    )
    if (!confirmed) return
    try {
      await window.api.simulations.delete(profile.id, sim.id)
      setSims((prev) => prev.filter((s) => s.id !== sim.id))
      setOutcomesBySim((prev) => {
        const { [sim.id]: _removed, ...rest } = prev
        void _removed
        return rest
      })
      const next = new Set(expanded)
      next.delete(sim.id)
      setExpanded(next)
    } catch (err) {
      console.error('Failed to delete sim:', err)
    }
  }

  async function handleRefresh() {
    setLoading(true)
    await loadSims()
    // Reload outcomes for expanded sims
    for (const simId of expanded) {
      await loadOutcomes(simId)
    }
  }

  const toggleSimSelected = useCallback((id: string) => {
    setSelectedSimIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectableSims = useMemo(
    () => sims.filter((s) => (s.completedCount ?? 0) > 0),
    [sims],
  )

  const allSelectableSelected =
    selectableSims.length > 0 && selectedSimIds.size === selectableSims.length

  const toggleSelectAll = useCallback(() => {
    setSelectedSimIds((prev) => {
      if (prev.size === selectableSims.length) {
        return new Set()
      }
      return new Set(selectableSims.map((s) => s.id))
    })
  }, [selectableSims])

  function handleTrainOnSelected() {
    if (selectedSimIds.size === 0) return
    const ids = Array.from(selectedSimIds).join(',')
    navigate(`/training?simIds=${ids}`)
  }

  return (
    <PageWrapper
      title="Recent simulations"
      category="Account"
      buttons={
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 14px',
            background: '#fff',
            color: MUTED,
            border: '1px solid #e0e0f0',
            borderRadius: 6,
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      }
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 3, background: TEAL }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 140px 140px 120px 100px',
            padding: '12px 16px',
            background: '#f7f7fc',
            borderBottom: '1px solid #e0e0f0',
          }}
        >
          <input
            type="checkbox"
            checked={allSelectableSelected}
            disabled={selectableSims.length === 0}
            onChange={toggleSelectAll}
            aria-label="Select all"
            title="Select all completed simulations"
          />
          <span style={thStyle}>Name</span>
          <span style={thStyle}>Created</span>
          <span style={thStyle}>Outcomes</span>
          <span style={thStyle}>Status</span>
          <span style={{ ...thStyle, textAlign: 'right' }}>Actions</span>
        </div>

        {loading ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: MUTED,
              fontFamily: monoFont,
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Loading…
          </div>
        ) : sims.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: MUTED,
              fontFamily: sansFont,
              fontSize: 13,
            }}
          >
            No simulations yet. Build a scenario to get started.
          </div>
        ) : (
          sims.map((sim) => (
            <RecentSimulationRow
              key={sim.id}
              sim={sim}
              expanded={expanded.has(sim.id)}
              outcomes={outcomesBySim[sim.id] ?? []}
              outcomesLoading={!!outcomesLoading[sim.id]}
              selected={selectedSimIds.has(sim.id)}
              onSelectToggle={() => toggleSimSelected(sim.id)}
              onToggle={() => handleToggle(sim.id)}
              onOpenReport={() => handleOpenReport(sim.id)}
              onOpenOutcome={handleOpenOutcome}
              onRequeueOutcome={(oid) => handleRequeueOutcome(sim.id, oid)}
              onRequeueAll={() => handleRequeueAll(sim.id)}
              onDelete={() => handleDelete(sim)}
            />
          ))
        )}
      </div>
      {selectedSimIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 24,
            padding: '14px 20px',
            background: TEAL,
            color: '#fff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(8,80,65,0.25)',
          }}
        >
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {selectedSimIds.size} simulation{selectedSimIds.size === 1 ? '' : 's'} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelectedSimIds(new Set())}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #ffffff66',
                borderRadius: 4,
                fontFamily: monoFont,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleTrainOnSelected}
              style={{
                padding: '8px 14px',
                background: '#fff',
                color: TEAL,
                border: 'none',
                borderRadius: 4,
                fontFamily: monoFont,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Train on selected →
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

const thStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.12em',
  color: MUTED,
  textTransform: 'uppercase',
}

function deriveStatus(e: SimulationProgressEvent): SimulationParent['status'] {
  if (e.status === 'error') {
    return e.completedCount + e.outcomeCount > 0 && e.completedCount >= e.outcomeCount
      ? 'partial'
      : 'processing'
  }
  if (e.completedCount >= e.outcomeCount && e.outcomeCount > 0) return 'completed'
  if (e.completedCount > 0) return 'processing'
  return 'queued'
}
