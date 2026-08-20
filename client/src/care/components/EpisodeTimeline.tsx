'use client'

import type { TimelineEntry } from '../types'
import { actionLabel } from '../stateLabels'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import { ACTOR_LABELS, agentAccent, cardStyle, formatTimestamp, MUTED, monoFont, NAVY, patientAccent, sansFont } from '../ui'

function isAgent(actor: TimelineEntry['actor']) {
  return actor !== 'patient'
}

export default function EpisodeTimeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  return (
    <section style={cardStyle}>
      <SectionLabel>Timeline</SectionLabel>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px', lineHeight: 1.5 }}>
        What happened, step by step — agent actions and your uploads.
      </p>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: 8,
            bottom: 8,
            width: 2,
            background: '#e0e0f0',
          }}
        />
        {sorted.map((entry, i) => {
          const agent = isAgent(entry.actor)
          const dotColor = agent ? agentAccent : patientAccent
          return (
            <div
              key={`${entry.at}-${entry.action}`}
              style={{
                position: 'relative',
                paddingBottom: i === sorted.length - 1 ? 0 : 22,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -22,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: agent ? 2 : 999,
                  background: dotColor,
                  boxShadow: agent ? 'none' : `0 0 0 3px ${dotColor}22`,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px 12px',
                  alignItems: 'baseline',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: agent ? agentAccent : patientAccent,
                    fontWeight: 700,
                  }}
                >
                  {ACTOR_LABELS[entry.actor]}
                </span>
                <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
                  {formatTimestamp(entry.at)}
                </span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: NAVY, margin: '0 0 4px', lineHeight: 1.35 }}>
                {actionLabel(entry.action)}
              </p>
              {entry.detail && (
                <p style={{ fontSize: 13, color: '#4a4a78', margin: 0, lineHeight: 1.5, fontFamily: sansFont }}>
                  {entry.detail}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
