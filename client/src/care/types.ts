export type EpisodeState =
  | 'PRESCRIPTION_RECEIVED'
  | 'TESTS_IDENTIFIED'
  | 'LABS_SHORTLISTED'
  | 'BOOKING_REQUESTED'
  | 'AWAITING_REPORT'
  | 'REPORT_RECEIVED'
  | 'TRENDS_ANALYZED'
  | 'ANOMALY_FOUND'
  | 'CONSULT_REQUESTED'
  | 'NORMAL'
  | 'CLOSED'
  | 'NEEDS_HUMAN'

export type TimelineActor =
  | 'patient'
  | 'intake_agent'
  | 'logistics_agent'
  | 'diagnostics_agent'
  | 'scheduler'

export interface TimelineEntry {
  at: string
  actor: TimelineActor
  action: string
  detail?: string
}

export interface Medicine {
  name: string
  dose: string
  frequency: string
}

export interface PrescriptionTest {
  test_code: string
  display_name: string
  urgency: 'urgent' | 'routine'
}

export interface Prescription {
  doctor: string
  date: string
  diagnosis: string
  medicines: Medicine[]
  tests: PrescriptionTest[]
  source_file_url?: string
}

export interface Lab {
  place_id: string
  name: string
  address: string
  rating: number
  distance_km: number
  open_now: boolean
  selected: boolean
  selection_reason?: string
}

export type BookingStatus = 'requested' | 'confirmed' | 'no_response' | 'failed'

export interface Booking {
  test_code: string
  lab_name: string
  requested_at: string
  status: BookingStatus
  slot_hold: string | null
  idempotency_key: string
}

export type ResultFlag = 'low' | 'normal' | 'high'
export type ResultTrend = 'rising' | 'falling' | 'stable' | 'first_reading'

export interface ResultHistoryPoint {
  date: string
  value: number
}

export interface ReportValue {
  test_code: string
  display_name: string
  value: number
  unit: string
  ref_low: number
  ref_high: number
  flag: ResultFlag
  trend: ResultTrend
  history: ResultHistoryPoint[]
}

export interface Report {
  received_at: string
  source_file_url?: string
  values: ReportValue[]
}

export type AnalysisSeverity = 'normal' | 'attention' | 'urgent'

export interface Analysis {
  severity: AnalysisSeverity
  consult_needed: boolean
  findings: string[]
  patient_summary: string
  disclaimer: string
}

export type ConsultationStatus = 'requested' | 'confirmed' | 'declined'

export interface Consultation {
  requested_at: string
  doctor: string
  proposed_slot: string
  status: ConsultationStatus
}

export type ErrorCode =
  | 'PRESCRIPTION_UNREADABLE'
  | 'REPORT_UNREADABLE'
  | 'NO_LABS_FOUND'
  | 'LAB_NO_RESPONSE'
  | 'EXTRACTION_FAILED'
  | 'UNKNOWN_TEST'
  | 'NOT_FOUND'

export interface EpisodeError {
  code: ErrorCode | string
  message: string
  action_hint: string
  retryable: boolean
}

export interface EpisodeSummary {
  episode_id: string
  state: EpisodeState
  summary_line: string
  created_at: string
  /** Present in mock/UI when upload filename is known from timeline. */
  upload_name?: string
}

export interface Episode extends EpisodeSummary {
  patient_id: string
  updated_at: string
  prescription: Prescription | null
  labs: Lab[]
  bookings: Booking[]
  report: Report | null
  analysis: Analysis | null
  consultation: Consultation | null
  timeline: TimelineEntry[]
  error: EpisodeError | null
}

export interface EpisodeListResponse {
  episodes: EpisodeSummary[]
}
