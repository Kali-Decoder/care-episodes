'use client'

import Link from 'next/link'
import type { EpisodeSummary } from '../types'
import { CARE_EPISODE } from '../routes'
import { stateLabel } from '../stateLabels'
import DashboardSection, { DashboardEmpty } from './dashboard/DashboardSection'
import CareLoader from './CareLoader'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { BLUE, MUTED, NAVY, TEAL, formatTimestamp, monoFont } from '../ui'

export default function UploadHistorySection({
  episodes,
  loading,
  onRefresh,
  title = 'Upload history',
  id = 'upload-history',
}: {
  episodes: EpisodeSummary[]
  loading: boolean
  onRefresh: () => void
  title?: string
  id?: string
}) {
  return (
    <DashboardSection
      title={title}
      accent={TEAL}
      cta="Refresh"
      onCta={onRefresh}
      id={id}
    >
      {loading ? (
        <CareLoader variant="block" label="Loading episodes…" minHeight={160} />
      ) : episodes.length === 0 ? (
        <DashboardEmpty text="No uploads yet." />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f8', textAlign: 'left' }}>
              {['File', 'Uploaded', 'Status', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    padding: '10px 16px',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => (
              <tr key={ep.episode_id} style={{ borderBottom: '1px solid #f0f0f8' }}>
                <td style={{ padding: '12px 16px', color: NAVY, fontWeight: 500 }}>
                  {ep.upload_name ?? ep.episode_id}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: monoFont, fontSize: 11, color: MUTED }}>
                  {formatTimestamp(ep.created_at)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusPill
                    color={
                      ep.state === 'NEEDS_HUMAN'
                        ? '#c83030'
                        : ep.state === 'AWAITING_REPORT'
                          ? '#cc8a00'
                          : TEAL
                    }
                  >
                    {stateLabel(ep.state)}
                  </StatusPill>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Link
                    href={CARE_EPISODE(ep.episode_id)}
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: BLUE,
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      fontWeight: 700,
                    }}
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardSection>
  )
}
