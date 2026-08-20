import type { EpisodeState } from './types'

export const STATE_LABELS: Record<EpisodeState, string> = {
  PRESCRIPTION_RECEIVED: 'Reading your prescription',
  TESTS_IDENTIFIED: 'Tests identified on your prescription',
  LABS_SHORTLISTED: 'Nearby labs found',
  BOOKING_REQUESTED: 'Booking request sent — awaiting lab reply',
  AWAITING_REPORT: 'Waiting for your lab results',
  REPORT_RECEIVED: 'Reading your lab report',
  TRENDS_ANALYZED: 'Compared with your history',
  ANOMALY_FOUND: 'A meaningful change was detected',
  CONSULT_REQUESTED: 'Follow-up consultation requested',
  NORMAL: 'All clear — no follow-up needed',
  CLOSED: 'Episode complete',
  NEEDS_HUMAN: 'Needs your attention',
}

export const ACTION_LABELS: Record<string, string> = {
  uploaded_prescription: 'Uploaded prescription',
  extracted_tests: 'Extracted tests from prescription',
  found_labs: 'Found nearby labs',
  selected_lab: 'Selected a lab',
  requested_booking: 'Requested lab booking',
  uploaded_report: 'Uploaded lab report',
  compared_history: 'Compared with prior reports',
  flagged_anomaly: 'Flagged a meaningful change',
  requested_consultation: 'Requested follow-up consultation',
}

export const TERMINAL_STATES: EpisodeState[] = ['NORMAL', 'CLOSED', 'NEEDS_HUMAN']

export function isTerminal(state: EpisodeState): boolean {
  return TERMINAL_STATES.includes(state)
}

export function stateLabel(state: EpisodeState): string {
  return STATE_LABELS[state] ?? state.replace(/_/g, ' ').toLowerCase()
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
}

/** Days since episode started (for AWAITING_REPORT UI). */
export function daysElapsed(createdAt: string): number {
  const start = new Date(createdAt).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
}
