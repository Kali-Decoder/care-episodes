import type { TimelineActor } from './types'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../renderer/src/theme'

export const ACTOR_LABELS: Record<TimelineActor, string> = {
  patient: 'You',
  intake_agent: 'Intake agent',
  logistics_agent: 'Logistics agent',
  diagnostics_agent: 'Diagnostics agent',
  scheduler: 'Scheduler',
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const cardStyle = {
  background: '#fff',
  border: '1px solid #e0e0f0',
  borderRadius: 8,
  padding: '22px 24px',
} as const

export const sectionGap = 20

export const agentAccent = BLUE
export const patientAccent = TEAL

export { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont }
