import type { ReactNode } from 'react'
import { MUTED, BLUE, monoFont } from '../../theme'

/**
 * Generic tone-based pill. Visual: bordered, mono uppercase, 999
 * radius. Used by SharedResources for P2P provider/consumer state and
 * by the new Dashboard's Subsystems footer strip.
 *
 * Distinct from `StatusPill`: this one uses a 1px solid border + a
 * slightly muted background, and the tone is a discrete enum
 * (`idle | busy | ok | error`) rather than a free color.
 */
const TONE_COLORS: Record<
  'idle' | 'busy' | 'ok' | 'error',
  { bg: string; fg: string; border: string }
> = {
  idle: { bg: '#f3f3f8', fg: MUTED, border: '#e0e0f0' },
  busy: { bg: '#e6e6ff', fg: BLUE, border: '#d0d0ff' },
  ok: { bg: '#d6f5f3', fg: '#1a7a76', border: '#a8e6e2' },
  error: { bg: '#fbe6e6', fg: '#a82020', border: '#f0b0b0' },
}

export type PillTone = keyof typeof TONE_COLORS

export default function Pill({
  tone,
  children,
}: {
  tone: PillTone
  children: ReactNode
}) {
  const c = TONE_COLORS[tone]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: 999,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}
