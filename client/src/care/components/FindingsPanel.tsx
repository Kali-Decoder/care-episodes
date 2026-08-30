'use client'

import type { Analysis } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import { cardStyle, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'
import { LinkifiedText } from './TextLink'

const SEVERITY_STYLE: Record<Analysis['severity'], { bg: string; color: string; label: string }> = {
  normal: { bg: `${TEAL}18`, color: TEAL, label: 'All clear' },
  attention: { bg: '#fff8e6', color: '#996600', label: 'Worth discussing with your doctor' },
  urgent: { bg: '#fdeaea', color: '#c83030', label: 'Urgent review recommended' },
}

export default function FindingsPanel({ analysis }: { analysis: Analysis }) {
  const sev = SEVERITY_STYLE[analysis.severity]
  return (
    <section style={cardStyle}>
      <SectionLabel>Findings</SectionLabel>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 18px', lineHeight: 1.55 }}>
        What NaniAi found — compared with your history. Not a diagnosis.
      </p>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 6,
          background: sev.bg,
          marginBottom: 18,
        }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: sev.color,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {sev.label}
        </p>
      </div>
      {analysis.findings.length > 0 && (
        <ul style={{ margin: '0 0 20px', paddingLeft: 18, color: '#4a4a78', fontSize: 14, lineHeight: 1.6 }}>
          {analysis.findings.map((finding) => (
            <li key={finding}>
              <LinkifiedText text={finding} />
            </li>
          ))}
        </ul>
      )}
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: NAVY,
          margin: '0 0 16px',
          fontFamily: sansFont,
        }}
      >
        <LinkifiedText text={analysis.patient_summary} />
      </p>
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: MUTED,
          margin: 0,
          padding: '12px 14px',
          border: '1px solid #e0e0f0',
          borderRadius: 6,
          background: '#fafafe',
        }}
      >
        <LinkifiedText text={analysis.disclaimer} />
      </p>
    </section>
  )
}
