import type { ReactNode } from 'react'
import { MUTED, TEAL, BLUE, monoFont } from '../../theme'
import type { SimulationStatus } from '../../../../preload/simulation'

/**
 * Single source of truth for the simulation status colors and labels.
 * Was previously duplicated in `pages/SimulationReport.tsx:25-39` and
 * `components/simulation/RecentSimulationRow.tsx:10-24`.
 */
export const STATUS_COLOR: Record<SimulationStatus, string> = {
  queued: MUTED,
  processing: BLUE,
  completed: TEAL,
  partial: '#cc8a00',
  error: '#c83030',
}

export const STATUS_LABEL: Record<SimulationStatus, string> = {
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  partial: 'Partial',
  error: 'Error',
}

/**
 * Status pill used on the report header and on rows in
 * RecentSimulations / the new Dashboard. Renders a colored dot of
 * the status's color (13% alpha background + solid foreground) inside
 * a 999-radius mono-typography pill.
 *
 * Color is a free string so callers can pass either a SimulationStatus
 * key via `STATUS_COLOR[sim.status]` or a custom color when they need
 * to (e.g. for path-level outcomes that share the same look).
 */
export default function StatusPill({
  color,
  children,
}: {
  color: string
  children: ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: color + '22',
        color,
        borderRadius: 999,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}
