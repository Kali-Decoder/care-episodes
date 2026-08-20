import type { ReactNode } from 'react'
import { MUTED, NAVY, monoFont } from '../../theme'

/**
 * KPI tile used on the Dashboard. Renders a small mono uppercase
 * label, a larger NAVY value, and an optional subtext line. If
 * `onClick` is provided, the whole block becomes clickable and
 * surfaces a subtle hover state.
 *
 * The value is a ReactNode so callers can pass plain text, a
 * `<StatusPill>`, or any other small inline element.
 */
export default function StatItem({
  label,
  value,
  subtext,
  onClick,
}: {
  label: string
  value: ReactNode
  subtext?: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        marginRight: 32,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: '0.10em',
          color: MUTED,
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 18,
          fontWeight: 700,
          color: NAVY,
          margin: 0,
        }}
      >
        {value}
      </p>
      {subtext !== undefined && (
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            color: MUTED,
            margin: 0,
            marginTop: 2,
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  )
}
