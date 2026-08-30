'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, BarChart3, CheckCircle2, Hourglass, AlertTriangle } from 'lucide-react'
import { listEpisodes } from '../api'
import type { EpisodeState, EpisodeSummary } from '../types'
import { CARE_EPISODE } from '../routes'
import { daysElapsed, isTerminal, stateLabel } from '../stateLabels'
import DashboardSection from '../components/dashboard/DashboardSection'
import CareLoader from '../components/CareLoader'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { TextLink } from '../components/TextLink'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'

const STATE_ORDER: EpisodeState[] = [
  'PRESCRIPTION_RECEIVED',
  'TESTS_IDENTIFIED',
  'LABS_SHORTLISTED',
  'BOOKING_REQUESTED',
  'AWAITING_REPORT',
  'REPORT_RECEIVED',
  'TRENDS_ANALYZED',
  'ANOMALY_FOUND',
  'NORMAL',
  'CONSULT_REQUESTED',
  'CLOSED',
  'NEEDS_HUMAN',
]

function stateColor(state: EpisodeState): string {
  if (state === 'NEEDS_HUMAN' || state === 'ANOMALY_FOUND') return '#c83030'
  if (state === 'AWAITING_REPORT') return '#cc8a00'
  if (state === 'NORMAL' || state === 'CLOSED') return TEAL
  return BLUE
}

export default function CareAnalyticsPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const eps = await listEpisodes()
      setEpisodes([...eps].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const stats = useMemo(() => {
    const total = episodes.length
    const active = episodes.filter((e) => !isTerminal(e.state)).length
    const completed = episodes.filter((e) => e.state === 'CLOSED' || e.state === 'NORMAL').length
    const awaiting = episodes.filter((e) => e.state === 'AWAITING_REPORT').length
    const needsYou = episodes.filter(
      (e) => e.state === 'NEEDS_HUMAN' || e.state === 'ANOMALY_FOUND',
    ).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const byState = STATE_ORDER.map((state) => ({
      state,
      count: episodes.filter((e) => e.state === state).length,
    })).filter((row) => row.count > 0)

    const maxCount = Math.max(1, ...byState.map((r) => r.count))

    const waitingEpisodes = episodes.filter((e) => e.state === 'AWAITING_REPORT')
    const avgWaitDays =
      waitingEpisodes.length > 0
        ? Math.round(
            waitingEpisodes.reduce((sum, e) => sum + daysElapsed(e.created_at), 0) /
              waitingEpisodes.length,
          )
        : 0

    return { total, active, completed, awaiting, needsYou, completionRate, byState, maxCount, avgWaitDays }
  }, [episodes])

  if (loading) {
    return <CareLoader variant="full" embedded label="Loading analytics…" />
  }

  return (
    <div
      style={{
        fontFamily: sansFont,
        minHeight: '100%',
        background: `
          radial-gradient(ellipse 60% 40% at 100% 0%, rgba(26,26,232,0.06), transparent 50%),
          radial-gradient(ellipse 50% 40% at 0% 20%, rgba(62,196,192,0.08), transparent 50%),
          ${LIGHT_BLUE}
        `,
        padding: '28px 36px 72px',
        boxSizing: 'border-box',
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '0 0 8px',
          }}
        >
          NaniAi · Analytics
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: NAVY,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Episode <strong style={{ fontWeight: 600 }}>insights</strong>
        </h1>
        <p style={{ fontSize: 15, color: '#4a4a78', margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          How your care episodes are moving — active load, completion, and where agents spend time.
        </p>
      </motion.header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <MetricCard label="Total episodes" value={stats.total} icon={<BarChart3 size={16} />} />
        <MetricCard label="Active now" value={stats.active} icon={<Activity size={16} />} accent={BLUE} />
        <MetricCard
          label="Completion rate"
          value={`${stats.completionRate}%`}
          icon={<CheckCircle2 size={16} />}
          accent={TEAL}
        />
        <MetricCard
          label="Avg wait (days)"
          value={stats.avgWaitDays}
          icon={<Hourglass size={16} />}
          accent="#cc8a00"
        />
        <MetricCard
          label="Needs attention"
          value={stats.needsYou}
          icon={<AlertTriangle size={16} />}
          accent={stats.needsYou > 0 ? '#c83030' : MUTED}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
          gap: 16,
        }}
        className="care-dash-split"
      >
        <DashboardSection title="Episodes by state" accent={BLUE}>
          {stats.byState.length === 0 ? (
            <p style={{ padding: '24px 20px', margin: 0, color: MUTED, fontSize: 14 }}>
              No episodes yet — upload a prescription to start tracking.
            </p>
          ) : (
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.byState.map(({ state, count }) => (
                <div key={state}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                      {stateLabel(state)}
                    </span>
                    <span style={{ fontFamily: monoFont, fontSize: 11, color: MUTED }}>{count}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: '#eef0f8',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.maxCount) * 100}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        background: stateColor(state),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Pipeline snapshot" accent={TEAL}>
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'In progress', value: stats.active, color: BLUE },
              { label: 'Waiting on report', value: stats.awaiting, color: '#cc8a00' },
              { label: 'Completed', value: stats.completed, color: TEAL },
              { label: 'Flagged / needs you', value: stats.needsYou, color: '#c83030' },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  ...cardStyle,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: '#4a4a78' }}>{row.label}</span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 18,
                    fontWeight: 700,
                    color: row.color,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div style={{ marginTop: 20 }}>
        <DashboardSection title="Recent activity" accent={NAVY}>
          {episodes.length === 0 ? (
            <p style={{ padding: '24px 20px', margin: 0, color: MUTED, fontSize: 14 }}>No activity yet.</p>
          ) : (
            <div>
              {episodes.slice(0, 8).map((ep) => (
                <div
                  key={ep.episode_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 20px',
                    borderTop: '1px solid #f0f0f8',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: NAVY,
                        margin: '0 0 4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {ep.summary_line}
                    </p>
                    <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
                      {ep.upload_name ?? ep.episode_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <StatusPill color={stateColor(ep.state)}>{stateLabel(ep.state)}</StatusPill>
                    <TextLink href={CARE_EPISODE(ep.episode_id)} mono>
                      Open
                    </TextLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  accent = NAVY,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderRadius: 12,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MUTED,
          }}
        >
          {label}
        </span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 700, color: accent, margin: 0 }}>
        {value}
      </p>
    </div>
  )
}
