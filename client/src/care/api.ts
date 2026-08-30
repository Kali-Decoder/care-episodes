import type { Episode, EpisodeSummary, Patient } from './types'
import { buildMockEpisode, DEMO_EPISODE_ID, PATIENT_ID } from './mockEpisodes'
import { DEFAULT_PATIENT_ID, MOCK_PATIENTS } from './patients'

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

const store: Map<string, Episode> = new Map()
let list: EpisodeSummary[] = []

function uploadName(ep: Episode): string | undefined {
  return ep.timeline.find((t) => t.action === 'uploaded_prescription')?.detail
}

function initStore() {
  if (store.size > 0) return

  const demo = buildMockEpisode('AWAITING_REPORT', DEMO_EPISODE_ID)
  if (demo.timeline[0]) demo.timeline[0].detail = 'rx1.jpg'

  const feb = buildMockEpisode('CLOSED', 'ep_feb2026')
  feb.created_at = '2026-02-11T09:00:00Z'
  feb.summary_line = 'Iron studies — completed with consult'
  if (feb.timeline[0]) feb.timeline[0].detail = 'iron-panel-feb.pdf'
  if (feb.report) feb.report.received_at = '2026-02-11T10:00:00Z'

  const may = buildMockEpisode('CLOSED', 'ep_may2026')
  may.created_at = '2026-05-19T10:00:00Z'
  may.summary_line = 'CBC follow-up — episode closed'
  if (may.timeline[0]) may.timeline[0].detail = 'prescription-may.pdf'
  if (may.report) may.report.received_at = '2026-05-19T10:00:00Z'

  const jun = buildMockEpisode('NORMAL', 'ep_jun2026')
  jun.created_at = '2026-06-12T14:30:00Z'
  jun.summary_line = 'Thyroid panel — all clear'
  if (jun.timeline[0]) jun.timeline[0].detail = 'thyroid-rx-jun.jpg'
  if (jun.report) jun.report.received_at = '2026-06-12T14:30:00Z'

  const aug = buildMockEpisode('TRENDS_ANALYZED', 'ep_aug2026')
  aug.created_at = '2026-08-20T09:14:00Z'
  aug.summary_line = 'Iron panel — haemoglobin falling'
  if (aug.timeline[0]) aug.timeline[0].detail = 'rx1.jpg'
  if (aug.report) aug.report.received_at = '2026-08-24T10:58:00Z'

  for (const ep of [demo, aug, may, jun, feb]) {
    store.set(ep.episode_id, ep)
  }
  list = [demo, aug, may, jun, feb].map(toSummary).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function toSummary(ep: Episode): EpisodeSummary {
  return {
    episode_id: ep.episode_id,
    state: ep.state,
    summary_line: ep.summary_line,
    created_at: ep.created_at,
    upload_name: uploadName(ep),
  }
}

async function liveFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export async function listPatients(): Promise<Patient[]> {
  if (USE_MOCKS) return [...MOCK_PATIENTS]
  try {
    const data = await liveFetch<{ patients: Patient[] }>('/api/patients')
    return data.patients?.length ? data.patients : MOCK_PATIENTS
  } catch {
    return [...MOCK_PATIENTS]
  }
}

export async function listEpisodes(patientId: string = DEFAULT_PATIENT_ID): Promise<EpisodeSummary[]> {
  if (USE_MOCKS) {
    initStore()
    if (patientId !== PATIENT_ID) return []
    return [...list]
  }
  const data = await liveFetch<{ episodes: EpisodeSummary[] }>(
    `/api/episodes?patient_id=${encodeURIComponent(patientId)}`,
  )
  return data.episodes
}

export async function getEpisode(episodeId: string): Promise<Episode> {
  if (USE_MOCKS) {
    initStore()
    const ep = store.get(episodeId)
    if (!ep) throw new Error('Episode not found')
    return structuredClone(ep)
  }
  return liveFetch<Episode>(`/api/episodes/${episodeId}`)
}

export async function createEpisode(
  file: File,
  patientId: string = DEFAULT_PATIENT_ID,
): Promise<Episode> {
  if (USE_MOCKS) {
    initStore()
    const episodeId = `ep_${Date.now().toString(36)}`
    const ep = buildMockEpisode('PRESCRIPTION_RECEIVED', episodeId)
    ep.patient_id = patientId
    if (ep.timeline[0]) ep.timeline[0].detail = file.name
    store.set(episodeId, ep)
    if (patientId === PATIENT_ID) list = [toSummary(ep), ...list]
    setTimeout(() => advanceMock(episodeId, 'TESTS_IDENTIFIED'), 1200)
    setTimeout(() => advanceMock(episodeId, 'LABS_SHORTLISTED'), 2400)
    setTimeout(() => advanceMock(episodeId, 'BOOKING_REQUESTED'), 3600)
    return structuredClone(ep)
  }
  const body = new FormData()
  body.append('file', file)
  body.append('patient_id', patientId)
  return liveFetch<Episode>('/api/episodes', { method: 'POST', body })
}

export async function uploadReport(episodeId: string, file: File): Promise<Episode> {
  if (USE_MOCKS) {
    const ep = store.get(episodeId)
    if (!ep) throw new Error('Episode not found')
    const next = buildMockEpisode('REPORT_RECEIVED', episodeId)
    if (next.timeline[5]) next.timeline[5].detail = file.name
    store.set(episodeId, next)
    syncList(next)
    setTimeout(() => advanceMock(episodeId, 'TRENDS_ANALYZED'), 1200)
    setTimeout(() => advanceMock(episodeId, 'ANOMALY_FOUND'), 2800)
    setTimeout(() => advanceMock(episodeId, 'CONSULT_REQUESTED'), 4200)
    return structuredClone(next)
  }
  const body = new FormData()
  body.append('file', file)
  return liveFetch<Episode>(`/api/episodes/${episodeId}/report`, { method: 'POST', body })
}

export async function retryEpisode(episodeId: string): Promise<Episode> {
  if (USE_MOCKS) {
    const next = buildMockEpisode('BOOKING_REQUESTED', episodeId)
    store.set(episodeId, next)
    syncList(next)
    setTimeout(() => advanceMock(episodeId, 'AWAITING_REPORT'), 1500)
    return structuredClone(next)
  }
  return liveFetch<Episode>(`/api/episodes/${episodeId}/retry`, { method: 'POST' })
}

/** Dev / mock cycler — force episode to a specific state. */
export function setMockEpisodeState(episodeId: string, state: Episode['state']): Episode | null {
  if (!USE_MOCKS) return null
  initStore()
  const ep = buildMockEpisode(state, episodeId)
  store.set(episodeId, ep)
  syncList(ep)
  return structuredClone(ep)
}

function advanceMock(episodeId: string, state: Episode['state']) {
  const current = store.get(episodeId)
  if (!current || current.state === 'NEEDS_HUMAN' || current.state === 'CLOSED' || current.state === 'NORMAL') return
  const ep = buildMockEpisode(state, episodeId)
  store.set(episodeId, ep)
  syncList(ep)
}

function syncList(ep: Episode) {
  const idx = list.findIndex((e) => e.episode_id === ep.episode_id)
  const summary = toSummary(ep)
  if (idx >= 0) list[idx] = summary
  else list.unshift(summary)
}

export function getMockStoreEpisode(episodeId: string): Episode | undefined {
  initStore()
  return store.get(episodeId)
}
