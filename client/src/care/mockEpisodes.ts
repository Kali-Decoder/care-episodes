import type { Episode, EpisodeState, Lab, Prescription, TimelineEntry } from './types'

export const PATIENT_ID = 'demo-patient-01'
export const DEMO_EPISODE_ID = 'ep_7f3a9c'

const prescription: Prescription = {
  doctor: 'Dr. A. Sen',
  date: '2026-08-20',
  diagnosis: 'Suspected iron deficiency anaemia',
  medicines: [{ name: 'Ferrous ascorbate', dose: '100mg', frequency: 'once daily' }],
  tests: [
    { test_code: 'CBC', display_name: 'Complete blood count', urgency: 'urgent' },
    { test_code: 'FERRITIN', display_name: 'Serum ferritin', urgency: 'routine' },
    { test_code: 'TSH', display_name: 'Thyroid stimulating hormone', urgency: 'routine' },
  ],
  source_file_url: 'https://storage.googleapis.com/demo/rx1.jpg',
}

const labs: Lab[] = [
  {
    place_id: 'ChIJ-suraksha',
    name: 'Suraksha Diagnostics, Salt Lake',
    address: 'DD-27, Sector 1, Salt Lake, Kolkata',
    rating: 4.3,
    distance_km: 2.1,
    open_now: true,
    selected: true,
    selection_reason: 'Closest centre open today offering all three tests',
  },
  {
    place_id: 'ChIJ-apollo',
    name: 'Apollo Clinic Labs',
    address: '88 Park Street, Kolkata',
    rating: 4.6,
    distance_km: 3.4,
    open_now: true,
    selected: false,
  },
  {
    place_id: 'ChIJ-srl',
    name: 'SRL Diagnostics',
    address: '5 Salt Lake Sector V',
    rating: 4.2,
    distance_km: 4.0,
    open_now: false,
    selected: false,
  },
  {
    place_id: 'ChIJ-thyro',
    name: 'Thyrocare Collection',
    address: 'Kolkata Central',
    rating: 4.5,
    distance_km: 4.8,
    open_now: true,
    selected: false,
  },
]

function tl(at: string, actor: TimelineEntry['actor'], action: string, detail?: string): TimelineEntry {
  return { at, actor, action, detail }
}

function buildTimeline(state: EpisodeState): TimelineEntry[] {
  const all: TimelineEntry[] = [
    tl('2026-08-20T09:14:00Z', 'patient', 'uploaded_prescription', 'rx1.jpg'),
    tl('2026-08-20T09:15:00Z', 'intake_agent', 'extracted_tests', '3 tests found, 1 marked urgent'),
    tl('2026-08-20T09:15:00Z', 'logistics_agent', 'found_labs', '4 centres within 5km'),
    tl('2026-08-20T09:15:30Z', 'logistics_agent', 'selected_lab', 'Suraksha Diagnostics selected'),
    tl('2026-08-20T09:16:00Z', 'logistics_agent', 'requested_booking', 'Email sent to Suraksha Diagnostics'),
    tl('2026-08-24T10:58:00Z', 'patient', 'uploaded_report', 'report1.pdf'),
    tl('2026-08-24T11:00:00Z', 'diagnostics_agent', 'compared_history', '3 prior reports found'),
    tl('2026-08-24T11:01:00Z', 'diagnostics_agent', 'flagged_anomaly', 'Haemoglobin falling, now below range'),
    tl('2026-08-24T11:02:00Z', 'scheduler', 'requested_consultation', 'Dr. A. Sen — 26 Aug 17:00'),
  ]

  const cut: Record<EpisodeState, number> = {
    PRESCRIPTION_RECEIVED: 1,
    TESTS_IDENTIFIED: 2,
    LABS_SHORTLISTED: 4,
    BOOKING_REQUESTED: 5,
    AWAITING_REPORT: 5,
    REPORT_RECEIVED: 6,
    TRENDS_ANALYZED: 7,
    ANOMALY_FOUND: 8,
    CONSULT_REQUESTED: 9,
    NORMAL: 7,
    CLOSED: 9,
    NEEDS_HUMAN: 5,
  }
  return all.slice(0, cut[state])
}

function summary(state: EpisodeState): string {
  const map: Record<EpisodeState, string> = {
    PRESCRIPTION_RECEIVED: 'Prescription uploaded — reading in progress',
    TESTS_IDENTIFIED: '3 tests identified on your prescription',
    LABS_SHORTLISTED: '4 nearby labs found — one selected',
    BOOKING_REQUESTED: 'Booking request sent — awaiting lab reply',
    AWAITING_REPORT: 'Waiting for lab results',
    REPORT_RECEIVED: 'Report uploaded — reading in progress',
    TRENDS_ANALYZED: '3 tests ordered, results in, one value rising',
    ANOMALY_FOUND: 'Haemoglobin falling — meaningful change detected',
    CONSULT_REQUESTED: 'Follow-up consultation requested with Dr. A. Sen',
    NORMAL: 'All clear — no follow-up needed',
    CLOSED: 'Episode complete',
    NEEDS_HUMAN: 'Prescription could not be read — action needed',
  }
  return map[state]
}

export function buildMockEpisode(state: EpisodeState, episodeId = DEMO_EPISODE_ID): Episode {
  const hasPrescription = state !== 'PRESCRIPTION_RECEIVED'
  const hasLabs = ['LABS_SHORTLISTED', 'BOOKING_REQUESTED', 'AWAITING_REPORT', 'NEEDS_HUMAN', 'REPORT_RECEIVED', 'TRENDS_ANALYZED', 'ANOMALY_FOUND', 'CONSULT_REQUESTED', 'NORMAL', 'CLOSED'].includes(state)
  const hasBookings = ['BOOKING_REQUESTED', 'AWAITING_REPORT', 'REPORT_RECEIVED', 'TRENDS_ANALYZED', 'ANOMALY_FOUND', 'CONSULT_REQUESTED', 'NORMAL', 'CLOSED'].includes(state)
  const hasReport = ['REPORT_RECEIVED', 'TRENDS_ANALYZED', 'ANOMALY_FOUND', 'CONSULT_REQUESTED', 'NORMAL', 'CLOSED'].includes(state)
  const hasAnalysis = ['TRENDS_ANALYZED', 'ANOMALY_FOUND', 'CONSULT_REQUESTED', 'NORMAL', 'CLOSED'].includes(state)
  const hasConsult = ['CONSULT_REQUESTED', 'CLOSED'].includes(state) ||
    (state === 'TRENDS_ANALYZED' && false) // consult only when consult_needed

  const reportValues = [
    {
      test_code: 'HB',
      display_name: 'Haemoglobin',
      value: 9.8,
      unit: 'g/dL',
      ref_low: 12.0,
      ref_high: 15.0,
      flag: 'low' as const,
      trend: 'falling' as const,
      history: [
        { date: '2026-02-11', value: 12.4 },
        { date: '2026-05-19', value: 11.1 },
        { date: '2026-08-24', value: 9.8 },
      ],
    },
  ]

  const analysisNormal = {
    severity: 'normal' as const,
    consult_needed: false,
    findings: ['All values are within expected ranges compared with your prior reports.'],
    patient_summary: 'Your latest results look stable. No follow-up visit is needed at this time.',
    disclaimer: 'This is not medical advice. A doctor should review these results.',
  }

  const analysisAttention = {
    severity: 'attention' as const,
    consult_needed: true,
    findings: ['Haemoglobin has fallen across three consecutive reports and is now below the reference range.'],
    patient_summary:
      'Your haemoglobin has been dropping steadily since February and is now below normal. This is worth discussing with your doctor.',
    disclaimer: 'This is not medical advice. A doctor should review these results.',
  }

  const analysis =
    state === 'NORMAL'
      ? analysisNormal
      : state === 'TRENDS_ANALYZED'
        ? { ...analysisAttention, consult_needed: false }
        : hasAnalysis
          ? analysisAttention
          : null

  const showConsult =
    hasConsult ||
    (analysis?.consult_needed === true && ['TRENDS_ANALYZED', 'ANOMALY_FOUND'].includes(state))

  return {
    episode_id: episodeId,
    patient_id: PATIENT_ID,
    state,
    created_at: '2026-08-20T09:14:00Z',
    updated_at: '2026-08-24T11:02:00Z',
    summary_line: summary(state),
    prescription: hasPrescription ? prescription : null,
    labs: hasLabs ? (state === 'LABS_SHORTLISTED' ? labs.map((l) => ({ ...l, selected: l.place_id === 'ChIJ-suraksha' })) : labs) : [],
    bookings: hasBookings
      ? [
          {
            test_code: 'CBC',
            lab_name: 'Suraksha Diagnostics, Salt Lake',
            requested_at: '2026-08-20T09:16:00Z',
            status: state === 'BOOKING_REQUESTED' ? 'requested' : 'confirmed',
            slot_hold: '2026-08-21T08:00:00Z',
            idempotency_key: `${episodeId}:CBC:1`,
          },
          {
            test_code: 'FERRITIN',
            lab_name: 'Suraksha Diagnostics, Salt Lake',
            requested_at: '2026-08-20T09:16:00Z',
            status: 'requested',
            slot_hold: '2026-08-21T08:00:00Z',
            idempotency_key: `${episodeId}:FERRITIN:1`,
          },
        ]
      : [],
    report: hasReport
      ? {
          received_at: '2026-08-24T10:58:00Z',
          source_file_url: 'https://storage.googleapis.com/demo/report1.pdf',
          values: state === 'REPORT_RECEIVED' ? [] : reportValues,
        }
      : null,
    analysis,
    consultation: showConsult
      ? {
          requested_at: '2026-08-24T11:01:00Z',
          doctor: 'Dr. A. Sen',
          proposed_slot: '2026-08-26T17:00:00Z',
          status: state === 'CONSULT_REQUESTED' ? 'requested' : 'confirmed',
        }
      : null,
    timeline: buildTimeline(state),
    error:
      state === 'NEEDS_HUMAN'
        ? {
            code: 'PRESCRIPTION_UNREADABLE',
            message: 'The prescription image could not be read clearly.',
            action_hint: 'Try uploading a clearer photo in good light.',
            retryable: true,
          }
        : null,
  }
}

export const MOCK_STATE_CYCLE: EpisodeState[] = [
  'PRESCRIPTION_RECEIVED',
  'TESTS_IDENTIFIED',
  'LABS_SHORTLISTED',
  'BOOKING_REQUESTED',
  'AWAITING_REPORT',
  'REPORT_RECEIVED',
  'TRENDS_ANALYZED',
  'ANOMALY_FOUND',
  'CONSULT_REQUESTED',
  'NORMAL',
  'NEEDS_HUMAN',
  'CLOSED',
]

export const MOCK_FILE_NAMES = [
  '01-prescription-received.json',
  '02-tests-identified.json',
  '03-labs-shortlisted.json',
  '04-booking-requested.json',
  '05-awaiting-report.json',
  '06-trends-analyzed.json',
  '07-normal.json',
  '08-needs-human.json',
  '09-closed.json',
] as const
