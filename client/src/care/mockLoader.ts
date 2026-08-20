import type { Episode } from './types'
import { MOCK_FILE_NAMES } from './mockEpisodes'

const stateByFile: Record<(typeof MOCK_FILE_NAMES)[number], Episode['state']> = {
  '01-prescription-received.json': 'PRESCRIPTION_RECEIVED',
  '02-tests-identified.json': 'TESTS_IDENTIFIED',
  '03-labs-shortlisted.json': 'LABS_SHORTLISTED',
  '04-booking-requested.json': 'BOOKING_REQUESTED',
  '05-awaiting-report.json': 'AWAITING_REPORT',
  '06-trends-analyzed.json': 'TRENDS_ANALYZED',
  '07-normal.json': 'NORMAL',
  '08-needs-human.json': 'NEEDS_HUMAN',
  '09-closed.json': 'CLOSED',
}

export async function loadMockFromFile(fileName: (typeof MOCK_FILE_NAMES)[number]): Promise<Episode> {
  const res = await fetch(`/mocks/${fileName}`)
  if (!res.ok) throw new Error(`Failed to load mock ${fileName}`)
  return res.json() as Promise<Episode>
}

export function stateForMockFile(fileName: (typeof MOCK_FILE_NAMES)[number]): Episode['state'] {
  return stateByFile[fileName]
}

export { MOCK_FILE_NAMES }
