'use client'

import type { TimelineEntry } from '../types'
import { actionLabel } from '../stateLabels'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import {
  ACTOR_LABELS,
  agentAccent,
  cardStyle,
  formatTimestamp,
  MUTED,
  monoFont,
  NAVY,
  patientAccent,
  sansFont,
} from '../ui'
import { LinkifiedText } from './TextLink'
import { Bot, User } from 'lucide-react'

function isAgent(actor: TimelineEntry['actor']) {
  return actor !== 'patient'
}

export default function EpisodeTimeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  return (
    <section style={cardStyle}>
      <SectionLabel>Timeline</SectionLabel>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px', lineHeight: 1.55 }}>
        Every step NaniAi took — and anything you uploaded — in order.
      </p>
      <div style={{ position: 'relative', paddingLeft: 36 }}>
        <div
          style={{
            position: 'absolute',
            left: 15,
            top: 12,
            bottom: 12,
            width: 2,
            background: 'linear-gradient(180deg, #e0e0f0 0%, #eeeef6 100%)',
            borderRadius: 2,
          }}
        />
        {sorted.map((entry, i) => {
          const agent = isAgent(entry.actor)
          const dotColor = agent ? agentAccent : patientAccent
          const isLast = i === sorted.length - 1
          return (
            <div
              key={`${entry.at}-${entry.action}`}
              style={{
                position: 'relative',
                paddingBottom: isLast ? 0 : 24,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -28,
                  top: 2,
                  width: 30,
                  height: 30,
                  borderRadius: agent ? 8 : 999,
                  background: agent ? `${dotColor}12` : `${dotColor}18`,
                  border: `2px solid ${dotColor}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: dotColor,
                }}
              >
                {agent ? <Bot size={14} strokeWidth={2.2} /> : <User size={14} strokeWidth={2.2} />}
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: agent ? '#fafafe' : `${patientAccent}08`,
                  border: `1px solid ${agent ? '#eeeef6' : `${patientAccent}22`}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px 12px',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: dotColor,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: `${dotColor}14`,
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
                  <p style={{ fontSize: 13, color: '#4a4a78', margin: 0, lineHeight: 1.55, fontFamily: sansFont }}>
                    <LinkifiedText text={entry.detail} />
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
