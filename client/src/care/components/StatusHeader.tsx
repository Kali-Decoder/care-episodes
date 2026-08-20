'use client'

import type { Episode } from '../types'
import { daysElapsed, stateLabel } from '../stateLabels'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import Spinner from '../../renderer/src/components/ui/Spinner'
import { BLUE, cardStyle, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'

export default function StatusHeader({ episode }: { episode: Episode }) {
  const reading = episode.state === 'PRESCRIPTION_RECEIVED' || episode.state === 'REPORT_RECEIVED'
  const waiting = episode.state === 'AWAITING_REPORT'
  const anomaly = episode.state === 'ANOMALY_FOUND'
  const error = episode.state === 'NEEDS_HUMAN'
  const pillColor = error ? '#c83030' : anomaly ? '#c83030' : waiting ? '#cc8a00' : TEAL
  const days = waiting ? daysElapsed(episode.created_at) : 0

  return (
    <header style={{ ...cardStyle, padding: '28px 32px' }}>
      <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.16em', color: MUTED, textTransform: 'uppercase', margin: '0 0 10px' }}>
        Care episode · {episode.episode_id}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' }}>
        {reading && <Spinner />}
        <h1 style={{ fontSize: 28, fontWeight: 300, color: NAVY, margin: 0, letterSpacing: '-0.02em', fontFamily: sansFont }}>
          {stateLabel(episode.state)}
        </h1>
        <StatusPill color={pillColor}>{episode.state.replace(/_/g, ' ')}</StatusPill>
      </div>
      <p style={{ fontSize: 15, color: '#4a4a78', margin: '12px 0 0', lineHeight: 1.5 }}>{episode.summary_line}</p>
      {waiting && days > 0 && (
        <p style={{ fontFamily: monoFont, fontSize: 11, color: BLUE, margin: '10px 0 0' }}>
          Day {days} waiting for results
        </p>
      )}
      {anomaly && (
        <p
          style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            borderRadius: 6,
            background: '#fdeaea',
            border: '1px solid #f0c0c0',
            fontSize: 14,
            color: '#8a2020',
            lineHeight: 1.5,
          }}
        >
          A meaningful change was detected in your results. Review the findings below.
        </p>
      )}
    </header>
  )
}
