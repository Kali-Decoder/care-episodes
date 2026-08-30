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
  border: '1px solid #e8e8f2',
  borderRadius: 14,
  padding: '24px 26px',
  boxShadow: '0 4px 20px rgba(10, 10, 92, 0.04)',
} as const

export const cardStyleFlat = {
  background: '#fff',
  border: '1px solid #e8e8f2',
  borderRadius: 12,
  padding: '20px 22px',
} as const

export const sectionGap = 20

export const bodyText = { fontSize: 14, color: '#4a4a78', lineHeight: 1.55 } as const

export const pageBackground = `
  radial-gradient(ellipse 70% 50% at 100% 0%, rgba(26,26,232,0.06), transparent 55%),
  radial-gradient(ellipse 50% 40% at 0% 30%, rgba(62,196,192,0.07), transparent 50%),
  ${LIGHT_BLUE}
` as const

export const agentAccent = BLUE
export const patientAccent = TEAL

export { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont }
