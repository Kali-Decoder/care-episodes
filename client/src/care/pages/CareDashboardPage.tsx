'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileUp,
  FlaskConical,
  Hourglass,
  Stethoscope,
} from 'lucide-react'
import { createEpisode, listEpisodes } from '../api'
import type { EpisodeState, EpisodeSummary } from '../types'
import { CARE_EPISODE, CARE_EPISODES } from '../routes'
import { daysElapsed, isTerminal, stateLabel } from '../stateLabels'
import PrescriptionUpload from '../components/PrescriptionUpload'
import DashboardSection, { DashboardEmpty } from '../components/dashboard/DashboardSection'
import CareLoader from '../components/CareLoader'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { relativeDate } from '../../renderer/src/utils/format'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'
import { useProfile } from '../../renderer/src/context/ProfileContext'

const JOURNEY = [
  {
    key: 'rx',
    label: 'Prescription',
    detail: 'Read tests & urgency',
    icon: ClipboardList,
    states: ['PRESCRIPTION_RECEIVED', 'TESTS_IDENTIFIED'] as EpisodeState[],
  },
  {
    key: 'lab',
    label: 'Labs & booking',
    detail: 'Find lab · request slot',
    icon: FlaskConical,
    states: ['LABS_SHORTLISTED', 'BOOKING_REQUESTED'] as EpisodeState[],
  },
  {
    key: 'wait',
    label: 'Waiting',
    detail: 'Hold until report arrives',
    icon: Hourglass,
    states: ['AWAITING_REPORT'] as EpisodeState[],
  },
  {
    key: 'dx',
    label: 'Results',
    detail: 'Trends · consult if needed',
    icon: Stethoscope,
    states: [
      'REPORT_RECEIVED',
      'TRENDS_ANALYZED',
      'ANOMALY_FOUND',
      'CONSULT_REQUESTED',
      'NORMAL',
      'CLOSED',
    ] as EpisodeState[],
  },
] as const

function journeyIndex(state: EpisodeState): number {
  const idx = JOURNEY.findIndex((step) => (step.states as readonly EpisodeState[]).includes(state))
  return idx >= 0 ? idx : 0
}

function stateColor(state: EpisodeState): string {
  if (state === 'NEEDS_HUMAN' || state === 'ANOMALY_FOUND') return '#c83030'
  if (state === 'AWAITING_REPORT') return '#cc8a00'
  if (state === 'NORMAL' || state === 'CLOSED') return TEAL
  return BLUE
}

const ease = [0.22, 1, 0.36, 1] as const

export default function CareDashboardPage() {
  const router = useRouter()
  const { profile } = useProfile()
  const displayName = profile?.name?.trim() || 'Guest'
  const firstName = displayName.split(' ')[0]
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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

  useEffect(() => {
    const hasActive = episodes.some((e) => !isTerminal(e.state))
    if (!hasActive) return
    const id = setInterval(() => void refresh(), 5000)
    return () => clearInterval(id)
  }, [episodes, refresh])

  const stats = useMemo(() => {
    const active = episodes.filter((e) => !isTerminal(e.state)).length
    const awaiting = episodes.filter((e) => e.state === 'AWAITING_REPORT').length
    const needsYou = episodes.filter(
      (e) => e.state === 'NEEDS_HUMAN' || e.state === 'ANOMALY_FOUND',
    ).length
    const completed = episodes.filter((e) => e.state === 'CLOSED' || e.state === 'NORMAL').length
    return { active, awaiting, needsYou, completed }
  }, [episodes])

  const activeEpisode = episodes.find((e) => !isTerminal(e.state))
  const activeStep = activeEpisode ? journeyIndex(activeEpisode.state) : -1

  const needsAttention = useMemo(
    () =>
      episodes.filter(
        (e) => e.state === 'NEEDS_HUMAN' || e.state === 'AWAITING_REPORT' || e.state === 'ANOMALY_FOUND',
      ),
    [episodes],
  )

  const recentEpisodes = useMemo(() => episodes.slice(0, 5), [episodes])
  const awaitingEpisode = needsAttention.find((e) => e.state === 'AWAITING_REPORT')

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const ep = await createEpisode(file)
      router.push(CARE_EPISODE(ep.episode_id))
    } finally {
      setUploading(false)
    }
  }

  const scrollToUpload = () => {
    document.getElementById('upload-episode')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      style={{
        fontFamily: sansFont,
        minHeight: '100%',
        background: `
          radial-gradient(ellipse 70% 50% at 100% 0%, rgba(26,26,232,0.07), transparent 55%),
          radial-gradient(ellipse 50% 40% at 0% 30%, rgba(62,196,192,0.08), transparent 50%),
          ${LIGHT_BLUE}
        `,
        padding: '28px 36px 72px',
        boxSizing: 'border-box',
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 110, background: BLUE }} />
        <div style={{ position: 'absolute', top: 110, right: 0, width: 110, height: 80, background: TEAL }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 88, background: TEAL }} />

        <div
          className="care-dash-hero"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '32px 36px 28px 40px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 0.8fr)',
            gap: 24,
            alignItems: 'end',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.16em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              Care dashboard · {displayName}
            </p>
            <h1
              style={{
                fontSize: 'clamp(26px, 3.2vw, 34px)',
                fontWeight: 300,
                color: NAVY,
                margin: '0 0 10px',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Welcome back, <strong style={{ fontWeight: 600 }}>{firstName}</strong>
            </h1>
            <p style={{ fontSize: 15, color: '#4a4a78', margin: '0 0 22px', maxWidth: 480, lineHeight: 1.55 }}>
              {activeEpisode
                ? 'NaniAi is mid-episode — continue where agents left off, or start a new prescription.'
                : 'Upload a prescription and NaniAi runs the episode: tests, labs, the wait, and what changed.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {activeEpisode ? (
                <PrimaryButton href={CARE_EPISODE(activeEpisode.episode_id)}>Continue episode →</PrimaryButton>
              ) : (
                <PrimaryButton onClick={scrollToUpload}>Upload episode →</PrimaryButton>
              )}
              {awaitingEpisode && (
                <GhostButton href={CARE_EPISODE(awaitingEpisode.episode_id)}>Upload lab report</GhostButton>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              label="Active"
              value={stats.active}
              icon={<Activity size={16} />}
              onClick={
                activeEpisode
                  ? () => router.push(CARE_EPISODE(activeEpisode.episode_id))
                  : scrollToUpload
              }
            />
            <StatCard
              label="Awaiting results"
              value={stats.awaiting}
              highlight={stats.awaiting > 0}
              icon={<Hourglass size={16} />}
              onClick={() =>
                document.getElementById('needs-attention')?.scrollIntoView({ behavior: 'smooth' })
              }
            />
            <StatCard
              label="Needs you"
              value={stats.needsYou}
              highlight={stats.needsYou > 0}
              danger={stats.needsYou > 0}
              icon={<AlertTriangle size={16} />}
              onClick={() =>
                document.getElementById('needs-attention')?.scrollIntoView({ behavior: 'smooth' })
              }
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={<CheckCircle2 size={16} />}
              onClick={() => router.push(CARE_EPISODES)}
            />
            <UploadEpisodeCard onClick={scrollToUpload} />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease }}
        style={{ ...cardStyle, padding: '20px 24px', marginBottom: 20, borderRadius: 12 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: '0 0 4px',
              }}
            >
              Care episode path
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: NAVY, margin: 0 }}>
              {activeEpisode ? 'Where this episode is' : 'How an episode moves'}
            </h2>
          </div>
          {activeEpisode && (
            <StatusPill color={stateColor(activeEpisode.state)}>{stateLabel(activeEpisode.state)}</StatusPill>
          )}
        </div>

        <div
          className="care-journey"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}
        >
          {JOURNEY.map((step, i) => {
            const Icon = step.icon
            const done = activeStep > i
            const current = activeStep === i
            const idle = activeStep < 0
            return (
              <motion.div
                key={step.key}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  position: 'relative',
                  padding: '14px 14px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${current ? BLUE : done ? TEAL : '#e8e8f2'}`,
                  background: current
                    ? 'rgba(26,26,232,0.05)'
                    : done
                      ? 'rgba(62,196,192,0.08)'
                      : '#fafaff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: current ? BLUE : done ? TEAL : '#e8e8f2',
                      color: current || done ? '#fff' : NAVY,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      color: MUTED,
                      textTransform: 'uppercase',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: '0 0 4px' }}>{step.label}</p>
                <p style={{ fontSize: 12, color: '#5a5a88', margin: 0, lineHeight: 1.4 }}>{step.detail}</p>
                {(current || (idle && i === 0)) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: current ? BLUE : TEAL,
                      boxShadow: `0 0 0 4px ${current ? 'rgba(26,26,232,0.18)' : 'rgba(62,196,192,0.18)'}`,
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <div
        className="care-dash-split"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease }}
        >
          <DashboardSection title="Upload episode" accent={TEAL} id="upload-episode">
            <div style={{ padding: '4px 0 0' }}>
              <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileUp size={14} color={TEAL} />
                <p style={{ margin: 0, fontSize: 13, color: '#4a4a78', lineHeight: 1.45 }}>
                  Drop a prescription photo or PDF to start a new care episode — intake reads it next.
                </p>
              </div>
              <PrescriptionUpload embedded onUpload={handleUpload} uploading={uploading} />
            </div>
          </DashboardSection>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease }}
        >
          <DashboardSection
            title="Active episode"
            accent={BLUE}
            cta={activeEpisode ? 'Open' : undefined}
            ctaHref={activeEpisode ? CARE_EPISODE(activeEpisode.episode_id) : undefined}
            id="active-episode"
          >
            {loading ? (
              <CareLoader variant="block" label="Loading…" minHeight={140} />
            ) : activeEpisode ? (
              <ActiveEpisodePanel episode={activeEpisode} stepIndex={activeStep} />
            ) : (
              <div style={{ padding: '28px 20px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#4a4a78', lineHeight: 1.55 }}>
                  No open episode. After you upload, this card tracks bookings, the wait for results, and
                  whether a consult is needed.
                </p>
                <button
                  type="button"
                  onClick={scrollToUpload}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: BLUE,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Upload to begin →
                </button>
              </div>
            )}
          </DashboardSection>
        </motion.div>
      </div>

      <div
        className="care-dash-split"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}
      >
        <DashboardSection title="Needs your attention" accent={BLUE} id="needs-attention">
          {loading ? (
            <CareLoader variant="block" label="Loading…" minHeight={140} />
          ) : needsAttention.length === 0 ? (
            <DashboardEmpty text="Nothing waiting on you — agents are handling the quiet parts." />
          ) : (
            needsAttention.map((ep, i) => <EpisodeRow key={ep.episode_id} episode={ep} index={i} />)
          )}
        </DashboardSection>

        <DashboardSection
          title="Recent episodes"
          accent={NAVY}
          id="recent-episodes"
          cta="All episodes"
          ctaHref={CARE_EPISODES}
        >
          {loading ? (
            <CareLoader variant="block" label="Loading…" minHeight={140} />
          ) : recentEpisodes.length === 0 ? (
            <DashboardEmpty
              text="No episodes yet."
              cta="Upload episode →"
              ctaHref="#upload-episode"
            />
          ) : (
            recentEpisodes.map((ep, i) => <EpisodeRow key={ep.episode_id} episode={ep} index={i} />)
          )}
        </DashboardSection>
      </div>

      <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.55, color: MUTED, maxWidth: 640 }}>
        NaniAi summarises and flags changes — it does not diagnose or prescribe. A clinician should review
        your results.
      </p>

      <style>{`
        @media (max-width: 960px) {
          .care-dash-hero,
          .care-dash-split,
          .care-journey {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function ActiveEpisodePanel({
  episode,
  stepIndex,
}: {
  episode: EpisodeSummary
  stepIndex: number
}) {
  const waitingDays = episode.state === 'AWAITING_REPORT' ? daysElapsed(episode.created_at) : null
  const safeStep = Math.max(stepIndex, 0)

  return (
    <div style={{ padding: '18px 20px 22px' }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: NAVY, margin: '0 0 8px', lineHeight: 1.4 }}>
        {episode.summary_line}
      </p>
      <p style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, margin: '0 0 14px' }}>
        {episode.upload_name ?? episode.episode_id} · {relativeDate(episode.created_at)}
        {waitingDays !== null ? ` · day ${waitingDays + 1} of wait` : ''}
      </p>
      <StatusPill color={stateColor(episode.state)}>{stateLabel(episode.state)}</StatusPill>

      <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
        {JOURNEY.map((step, i) => (
          <div
            key={step.key}
            title={step.label}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 99,
              background: i < safeStep ? TEAL : i === safeStep ? BLUE : '#e4e4f0',
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: MUTED,
          margin: '10px 0 18px',
        }}
      >
        Step {safeStep + 1} of {JOURNEY.length} · {JOURNEY[safeStep]?.label}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <PrimaryButton href={CARE_EPISODE(episode.episode_id)}>Open timeline →</PrimaryButton>
        {episode.state === 'AWAITING_REPORT' && (
          <GhostButton href={CARE_EPISODE(episode.episode_id)}>Add lab report</GhostButton>
        )}
      </div>
    </div>
  )
}

function EpisodeRow({ episode, index }: { episode: EpisodeSummary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={CARE_EPISODE(episode.episode_id)}
        style={{
          display: 'block',
          padding: '14px 16px',
          borderTop: '1px solid #f0f0f8',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = LIGHT_BLUE
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: '0 0 6px', lineHeight: 1.4 }}>
          {episode.summary_line}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
            {episode.upload_name ?? episode.episode_id} · {relativeDate(episode.created_at)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <StatusPill color={stateColor(episode.state)}>{stateLabel(episode.state)}</StatusPill>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: BLUE,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                fontWeight: 700,
              }}
            >
              Open →
            </span>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  danger,
  icon,
  onClick,
}: {
  label: string
  value: number
  highlight?: boolean
  danger?: boolean
  icon: ReactNode
  onClick?: () => void
}) {
  const color = danger ? '#c83030' : highlight ? '#cc8a00' : NAVY
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid #e4e4f0',
        background: 'rgba(255,255,255,0.92)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: sansFont,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
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
        <span style={{ color }}>{icon}</span>
      </div>
      <p style={{ fontFamily: monoFont, fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
    </motion.button>
  )
}

function UploadEpisodeCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        gridColumn: '1 / -1',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 10,
        border: `1.5px solid ${TEAL}`,
        background: `linear-gradient(135deg, ${TEAL}14, ${BLUE}08)`,
        cursor: 'pointer',
        fontFamily: sansFont,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: TEAL,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <FileUp size={18} strokeWidth={2.2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: NAVY,
            fontWeight: 700,
            display: 'block',
            marginBottom: 2,
          }}
        >
          Upload episode
        </span>
        <span style={{ fontSize: 12, color: '#4a4a78', lineHeight: 1.4 }}>
          Start a new care episode with a prescription photo or PDF
        </span>
      </span>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: TEAL,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        Open →
      </span>
    </motion.button>
  )
}

function PrimaryButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
}) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 18px',
    borderRadius: 8,
    border: 'none',
    background: BLUE,
    color: '#fff',
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    cursor: 'pointer',
  }
  if (href) {
    return (
      <Link href={href} style={style}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  )
}

function GhostButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '11px 16px',
        borderRadius: 8,
        border: `1.5px solid ${NAVY}33`,
        background: 'transparent',
        color: NAVY,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  )
}
