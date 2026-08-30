'use client'

import type { ReportValue } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import { cardStyle, MUTED, NAVY, monoFont } from '../ui'
import { ExternalLink } from './TextLink'

function Sparkline({ history }: { history: { date: string; value: number }[] }) {
  if (history.length < 2) return <span style={{ color: MUTED, fontSize: 12 }}>—</span>
  const w = 72
  const h = 28
  const vals = history.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = history
    .map((p, i) => {
      const x = (i / (history.length - 1)) * w
      const y = h - ((p.value - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  const falling = history[history.length - 1].value < history[0].value
  return (
    <svg width={w} height={h} aria-hidden>
      <polyline
        fill="none"
        stroke={falling ? '#C45C5C' : '#3EC4C0'}
        strokeWidth="1.75"
        points={pts}
      />
    </svg>
  )
}

function flagColor(flag: ReportValue['flag']) {
  if (flag === 'low' || flag === 'high') return '#C45C5C'
  return MUTED
}

const TREND_LABEL: Record<ReportValue['trend'], string> = {
  rising: '↑ rising',
  falling: '↓ falling',
  stable: '→ stable',
  first_reading: 'first reading',
}

export default function ResultsTable({
  values,
  sourceFileUrl,
}: {
  values: ReportValue[]
  sourceFileUrl?: string
}) {
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <SectionLabel>Results</SectionLabel>
        {sourceFileUrl && (
          <ExternalLink href={sourceFileUrl} mono>
            View report file →
          </ExternalLink>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E2D6', textAlign: 'left' }}>
              {['Test', 'Value', 'Reference', 'Flag', 'Trend'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    padding: '8px 12px 10px 0',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row) => (
              <tr key={row.test_code} style={{ borderBottom: '1px solid #F0EBE3' }}>
                <td style={{ padding: '12px 12px 12px 0', color: NAVY, fontWeight: 500 }}>{row.display_name}</td>
                <td style={{ padding: '12px 12px 12px 0', fontFamily: monoFont, fontSize: 15, fontWeight: 700, color: NAVY }}>
                  {row.value} <span style={{ fontWeight: 400, fontSize: 12, color: MUTED }}>{row.unit}</span>
                </td>
                <td style={{ padding: '12px 12px 12px 0', color: MUTED, fontFamily: monoFont, fontSize: 12 }}>
                  {row.ref_low}–{row.ref_high}
                </td>
                <td style={{ padding: '12px 12px 12px 0' }}>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: flagColor(row.flag),
                      fontWeight: 700,
                    }}
                  >
                    {row.flag}
                  </span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkline history={row.history} />
                    <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>{TREND_LABEL[row.trend]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
