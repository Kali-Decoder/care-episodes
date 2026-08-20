import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../../theme'
import StatusPill, { STATUS_COLOR, STATUS_LABEL } from '../ui/StatusPill'
import { relativeDate } from '../../utils/format'
import type {
  PathStatus,
  SimulationOutcome,
  SimulationParent,
} from '../../../../preload/simulation'

const OUTCOME_STATUS_COLOR: Record<PathStatus, string> = {
  pending: MUTED,
  processing: BLUE,
  done: TEAL,
  error: '#c83030',
}

const OUTCOME_STATUS_LABEL: Record<PathStatus, string> = {
  pending: 'Pending',
  processing: 'Running',
  done: 'Done',
  error: 'Error',
}

interface OutcomeRowProps {
  outcome: SimulationOutcome
  onOpen: (sessionSlug: string) => void
  onRequeue: (outcomeId: string) => void
}

export function OutcomeRow({ outcome, onOpen, onRequeue }: OutcomeRowProps) {
  const color = OUTCOME_STATUS_COLOR[outcome.status]
  const label = OUTCOME_STATUS_LABEL[outcome.status]
  const summary =
    `${outcome.pathLabels.subject} · ` +
    `${outcome.pathLabels.exposure} · ` +
    `${outcome.pathLabels.intervention}`
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 110px 90px',
        alignItems: 'center',
        padding: '10px 16px 10px 40px',
        borderTop: '1px solid #f0f0f8',
        background: '#fcfcff',
        fontFamily: sansFont,
        fontSize: 12,
        color: NAVY,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 500 }}>{summary}</span>
        {outcome.error && (
          <span style={{ color: '#a02020', fontSize: 11 }}>{outcome.error}</span>
        )}
      </div>
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          background: color + '22',
          color,
          borderRadius: 999,
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
          width: 'fit-content',
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: monoFont, fontSize: 11, color: MUTED }}>
        {outcome.pathLabels.intervention}
      </span>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onOpen(outcome.sessionSlug)}
          title="Open chat"
          style={{
            padding: '4px 10px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontFamily: monoFont,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Chat
        </button>
        {outcome.status === 'error' && (
          <button
            onClick={() => onRequeue(outcome.id)}
            title="Requeue"
            style={{
              padding: '4px 10px',
              background: '#fff',
              color: BLUE,
              border: '1px solid ' + BLUE,
              borderRadius: 4,
              fontFamily: monoFont,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

interface RecentSimulationRowProps {
  sim: SimulationParent
  expanded: boolean
  outcomes: SimulationOutcome[]
  outcomesLoading: boolean
  selected: boolean
  onSelectToggle: () => void
  onToggle: () => void
  onOpenReport: () => void
  onOpenOutcome: (sessionSlug: string) => void
  onRequeueOutcome: (outcomeId: string) => void
  onRequeueAll: () => void
  onDelete: () => void
}

export default function RecentSimulationRow({
  sim,
  expanded,
  outcomes,
  outcomesLoading,
  selected,
  onSelectToggle,
  onToggle,
  onOpenReport,
  onOpenOutcome,
  onRequeueOutcome,
  onRequeueAll,
  onDelete,
}: RecentSimulationRowProps) {
  const color = STATUS_COLOR[sim.status]
  const label = STATUS_LABEL[sim.status]
  const completed = sim.completedCount
  const total = sim.outcomeCount
  const errorCount = sim.errorCount
  const hasErrors = errorCount > 0
  const canSelect = completed > 0
  return (
    <div style={{ borderBottom: '1px solid #e0e0f0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 140px 140px 120px 100px',
          alignItems: 'center',
          padding: '14px 16px',
          background: selected ? '#f0fafa' : '#fff',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            disabled={!canSelect}
            onChange={onSelectToggle}
            title={canSelect ? 'Select for training' : 'No completed outcomes to train on'}
            aria-label={`Select simulation ${sim.name} for training`}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: sansFont,
              fontSize: 14,
              color: '#1a1a2e',
              fontWeight: 500,
            }}
          >
            {sim.name}
          </span>
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.10em',
              color: MUTED,
              textTransform: 'uppercase',
            }}
          >
            {expanded ? '▾ Click to collapse' : '▸ Click to expand'}
          </span>
        </div>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 11,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {relativeDate(sim.createdAt)}
        </span>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 12,
            color: MUTED,
          }}
        >
          {completed} / {total}
          {hasErrors && (
            <span style={{ color: '#c83030', marginLeft: 6 }}>
              ({errorCount} err)
            </span>
          )}
        </span>
        <StatusPill color={color}>{label}</StatusPill>
        <div
          style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          {(sim.status === 'completed' || sim.status === 'partial') && (
            <button
              onClick={onOpenReport}
              title="View report"
              style={{
                padding: '4px 10px',
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontFamily: monoFont,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(26,26,232,0.18)',
              }}
            >
              Report
            </button>
          )}
          {hasErrors && (
            <button
              onClick={onRequeueAll}
              title="Requeue all failed outcomes"
              style={{
                padding: '4px 10px',
                background: '#fff',
                color: BLUE,
                border: '1px solid ' + BLUE,
                borderRadius: 4,
                fontFamily: monoFont,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
          <button
            onClick={onDelete}
            title="Delete simulation"
            style={{
              padding: '4px 10px',
              background: '#fff',
              color: '#cc4444',
              border: '1px solid #ffcccc',
              borderRadius: 4,
              fontFamily: monoFont,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="outcomes"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', background: '#fafaff' }}
          >
            {outcomesLoading ? (
              <div
                style={{
                  padding: 16,
                  color: MUTED,
                  fontFamily: monoFont,
                  fontSize: 11,
                }}
              >
                Loading outcomes…
              </div>
            ) : outcomes.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  color: MUTED,
                  fontFamily: monoFont,
                  fontSize: 11,
                }}
              >
                No outcomes.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 110px 110px 90px',
                  padding: '8px 16px 8px 40px',
                  background: '#f7f7fc',
                  borderTop: '1px solid #e0e0f0',
                  borderBottom: '1px solid #e0e0f0',
                  fontFamily: monoFont,
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  color: MUTED,
                  textTransform: 'uppercase',
                }}
              >
                <span>Path</span>
                <span>Status</span>
                <span>Intervention</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>
            )}
            {outcomes.map((o) => (
              <OutcomeRow
                key={o.id}
                outcome={o}
                onOpen={onOpenOutcome}
                onRequeue={onRequeueOutcome}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
