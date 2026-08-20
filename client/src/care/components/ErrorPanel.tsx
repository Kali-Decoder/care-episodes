'use client'

import type { EpisodeError } from '../types'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import { cardStyle, MUTED, NAVY, sansFont } from '../ui'

export default function ErrorPanel({
  error,
  onRetry,
  retrying,
}: {
  error: EpisodeError
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <section
      style={{
        ...cardStyle,
        border: '1px solid #f0d0d0',
        background: '#fffafa',
      }}
    >
      <SectionLabel>Action needed</SectionLabel>
      <p style={{ fontSize: 17, fontWeight: 600, color: NAVY, margin: '0 0 10px', fontFamily: sansFont }}>
        {error.message}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: '#4a4a78', margin: '0 0 18px' }}>{error.action_hint}</p>
      {error.retryable && onRetry && (
        <MonoButton onClick={onRetry} disabled={retrying} variant="danger">
          {retrying ? 'Retrying…' : 'Retry'}
        </MonoButton>
      )}
      {!error.retryable && (
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: MUTED, margin: 0 }}>
          Contact support if this persists.
        </p>
      )}
    </section>
  )
}
