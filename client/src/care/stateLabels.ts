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

/** Plain-language hint — what the user should know or do right now. */
export const STATE_HINTS: Record<EpisodeState, string> = {
  PRESCRIPTION_RECEIVED: 'NaniAi is reading your prescription to identify tests and urgency.',
  TESTS_IDENTIFIED: 'Tests are identified. NaniAi is finding nearby labs that can run them.',
  LABS_SHORTLISTED: 'Nearby labs are shortlisted. A booking request goes out next.',
  BOOKING_REQUESTED: 'A lab booking was requested. NaniAi is waiting for confirmation.',
  AWAITING_REPORT: 'Your lab visit is booked. Upload the report when results arrive.',
  REPORT_RECEIVED: 'NaniAi is reading your lab report and extracting values.',
  TRENDS_ANALYZED: 'Results are being compared with your previous reports.',
  ANOMALY_FOUND: 'Something changed compared to your history — review the findings.',
  CONSULT_REQUESTED: 'A follow-up consultation was requested based on your results.',
  NORMAL: 'Everything looks stable. No follow-up needed for this episode.',
  CLOSED: 'This care episode is complete.',
  NEEDS_HUMAN: 'Something needs your input before NaniAi can continue.',
}

export function stateHint(state: EpisodeState): string {
  return STATE_HINTS[state] ?? 'NaniAi is working on your care episode.'
}

export function stateColor(state: EpisodeState): string {
  if (state === 'NEEDS_HUMAN' || state === 'ANOMALY_FOUND') return '#c83030'
  if (state === 'AWAITING_REPORT' || state === 'BOOKING_REQUESTED') return '#cc8a00'
  if (state === 'NORMAL' || state === 'CLOSED') return '#3EC4C0'
  return '#1A1AE8'
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
