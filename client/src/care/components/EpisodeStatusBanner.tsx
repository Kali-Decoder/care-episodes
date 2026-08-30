'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Hourglass,
  Loader2,
  Stethoscope,
  Upload,
  UserRound,
} from 'lucide-react'
import type { EpisodeState } from '../types'
import { daysElapsed, stateHint, stateLabel } from '../stateLabels'
import CareLoader from './CareLoader'
import { MUTED, NAVY, monoFont, sansFont } from '../ui'

const STATE_ICON: Partial<Record<EpisodeState, typeof Loader2>> = {
  PRESCRIPTION_RECEIVED: Loader2,
  TESTS_IDENTIFIED: Stethoscope,
  LABS_SHORTLISTED: FlaskConical,
  BOOKING_REQUESTED: Clock,
  AWAITING_REPORT: Hourglass,
  REPORT_RECEIVED: Loader2,
  TRENDS_ANALYZED: Stethoscope,
  ANOMALY_FOUND: AlertTriangle,
  CONSULT_REQUESTED: UserRound,
  NORMAL: CheckCircle2,
  CLOSED: CheckCircle2,
  NEEDS_HUMAN: AlertTriangle,
}

export default function EpisodeStatusBanner({
  state,
  summaryLine,
  createdAt,
  accent,
  live,
  reading,
  action,
}: {
  state: EpisodeState
  summaryLine: string
  createdAt: string
  accent: string
  live?: boolean
  reading?: boolean
  action?: ReactNode
}) {
  const Icon = STATE_ICON[state] ?? Stethoscope
  const waiting = state === 'AWAITING_REPORT'
  const days = waiting ? daysElapsed(createdAt) : 0
  const hint = stateHint(state)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(232,232,242,0.95)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 36px rgba(10,10,92,0.06)',
        overflow: 'hidden',
        fontFamily: sansFont,
      }}
    >
      <div style={{ height: 3, background: accent }} />

      <div style={{ padding: '20px 24px 18px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: '16px 20px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: `${accent}14`,
              color: accent,
              flexShrink: 0,
            }}
          >
            {reading ? (
              <Loader2 size={20} strokeWidth={2.2} style={{ animation: 'spin 1.2s linear infinite' }} />
            ) : (
              <Icon size={20} strokeWidth={2.2} />
            )}
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', marginBottom: 6 }}>
              {live && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: accent,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: accent,
                      boxShadow: `0 0 0 3px ${accent}22`,
                    }}
                  />
                  {reading ? 'Agent working' : waiting ? 'On hold' : 'In progress'}
                </span>
              )}
              <h1
                style={{
                  fontSize: 'clamp(20px, 2.5vw, 24px)',
                  fontWeight: 600,
                  color: NAVY,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {stateLabel(state)}
              </h1>
            </div>

            <p style={{ fontSize: 14, color: '#4a4a78', margin: '0 0 10px', lineHeight: 1.55, maxWidth: 560 }}>
              {summaryLine}
            </p>

            <p
              style={{
                fontSize: 13,
                color: MUTED,
                margin: 0,
                lineHeight: 1.5,
                padding: '10px 14px',
                borderRadius: 10,
                background: '#f8f8fc',
                border: '1px solid #eeeef6',
                maxWidth: 560,
              }}
            >
              {hint}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            {waiting && days > 0 && (
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: accent,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: `${accent}12`,
                  border: `1px solid ${accent}33`,
                  fontWeight: 700,
                }}
              >
                Day {days} waiting
              </span>
            )}
            {reading && <CareLoader variant="inline" label="Reading" />}
            {action}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.section>
  )
}
