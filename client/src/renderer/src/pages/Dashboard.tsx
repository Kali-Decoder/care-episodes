import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAI } from '../context/AIContext'
import { useProfile } from '../context/ProfileContext'
import SectionLabel from '../components/ui/SectionLabel'
import StatusPill, { STATUS_COLOR, STATUS_LABEL } from '../components/ui/StatusPill'
import { relativeDate, uptimeLabel } from '../utils/format'
import { riskColor } from '../utils/risk'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import type { Session } from '../../../preload/index.d'
import type {
  SimulationParent,
  SimulationProgressEvent,
} from '../../../preload/simulation'

/**
 * Home dashboard. Top-to-bottom:
 *   1. Hero — full-width block with the geometric staircase, the "Welcome,
 *      {profile.name}" headline, the 3 live stats (Model / Status / Uptime),
 *      and the start-chatting CTA. Wide so it can carry more rows if the
 *      surface grows.
 *   2. Recent activity — two side-by-side tables: latest simulations and
 *      latest chat sessions, with quick links to drill in.
 */

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { isReady, activeModel, status, progress, error } = useAI()

  const [sims, setSims] = useState<SimulationParent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  // Live uptime tick
  const [uptime, setUptime] = useState(0)
  useEffect(() => {
    if (!status?.active.loadedAt) {
      setUptime(0)
      return
    }
    const tick = () =>
      setUptime(Math.floor((Date.now() - (status.active.loadedAt ?? Date.now())) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status?.active.loadedAt])

  // Initial fetch
  const refresh = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }
    try {
      const [simList, sessList] = await Promise.all([
        window.api.simulations.list(profile.id).catch(() => [] as SimulationParent[]),
        window.api.sessions.list(profile.id).catch(() => [] as Session[]),
      ])
      setSims(simList)
      setSessions(sessList)
    } catch (err) {
      console.error('Dashboard load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Live sim progress
  useEffect(() => {
    if (!profile) return
    const off = window.api.simulations.onProgress((event: SimulationProgressEvent) => {
      setSims((prev) =>
        prev.map((s) =>
          s.id === event.simId
            ? {
                ...s,
                completedCount: event.completedCount,
                outcomeCount: event.outcomeCount,
                status: deriveStatus(event),
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      )
    })
    return off
  }, [profile])

  const recentSims = useMemo(
    () => [...sims].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [sims],
  )
  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [sessions],
  )

  const modelName = activeModel?.name ?? '—'
  const statusLabel = error ? 'Error' : isReady ? 'Ready' : progress ? 'Loading' : 'Idle'
  const statusColor = error ? '#c83030' : isReady ? TEAL : progress ? BLUE : MUTED
  const modelSubtext = progress
    ? `${progress.phase === 'downloading' ? 'Downloading' : 'Loading'} ${Math.round(progress.percentage)}%`
    : error
    ? 'Error loading'
    : undefined

  return (
    <div
      style={{
        fontFamily: sansFont,
        minHeight: '100vh',
        position: 'relative',
        padding: '32px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 8,
          minHeight: 320,
          marginBottom: 40,
        }}
      >
        {/* Geometric staircase blocks - top right */}
        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 1, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 200, background: BLUE }} />
          <div style={{ position: 'absolute', top: 200, right: 0, width: 200, height: 160, background: TEAL }} />
          <div style={{ position: 'absolute', top: 360, right: 100, width: 100, height: 80, background: BLUE, opacity: 0.5 }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 48px 40px 56px', maxWidth: 720 }}>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              letterSpacing: '0.14em',
              color: MUTED,
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
            }}
          >
            Dashboard
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: sansFont,
              fontSize: 32,
              fontWeight: 300,
              color: NAVY,
              margin: '0 0 24px 0',
              lineHeight: 1.2,
            }}
          >
            Welcome,{' '}
            <strong style={{ fontWeight: 600 }}>{profile?.name ?? 'there'}</strong>
          </motion.h1>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <StatBlock label="Model" value={modelName} subtext={modelSubtext} />
            <StatBlock label="Status" value={<StatusPill color={statusColor}>{statusLabel}</StatusPill>} />
            <StatBlock
              label="Uptime"
              value={<span style={{ fontFamily: monoFont, fontSize: 18, fontWeight: 700, color: NAVY }}>{isReady ? uptimeLabel(uptime) : '—'}</span>}
            />
          </div>

          {/* CTA */}
          <motion.button
            whileHover={isReady ? { scale: 1.02 } : undefined}
            whileTap={isReady ? { scale: 0.98 } : undefined}
            onClick={() => navigate('/chat')}
            disabled={!isReady}
            style={{
              marginTop: 28,
              padding: '12px 22px',
              background: isReady ? BLUE : MUTED,
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontFamily: monoFont,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.12em',
              cursor: isReady ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
            }}
          >
            Start chatting →
          </motion.button>
        </div>

        {/* Teal left accent */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 120, background: TEAL }} />
      </div>

      {/* ── RECENT ACTIVITY ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <ActivityCard
          title="Recent simulations"
          cta="View all →"
          onCta={() => navigate('/simulations')}
          accent={TEAL}
        >
          {loading ? (
            <EmptyLine text="Loading…" />
          ) : recentSims.length === 0 ? (
            <EmptyLine
              text="No simulations yet."
              cta="Start one →"
              onCta={() => navigate('/simulations/new')}
            />
          ) : (
            recentSims.map((sim) => {
              const color = STATUS_COLOR[sim.status]
              const label = STATUS_LABEL[sim.status]
              const completion =
                sim.outcomeCount > 0
                  ? Math.round((sim.completedCount / sim.outcomeCount) * 100)
                  : 0
              return (
                <button
                  key={sim.id}
                  onClick={() => {
                    if (sim.status === 'completed' || sim.status === 'partial') {
                      navigate(`/simulations/${sim.id}/report`)
                    } else {
                      navigate('/simulations')
                    }
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 130px 110px',
                    alignItems: 'center',
                    padding: '10px 16px',
                    background: '#fff',
                    border: 'none',
                    borderTop: '1px solid #f0f0f8',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: sansFont,
                    fontSize: 12,
                    color: NAVY,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 8,
                    }}
                  >
                    {sim.name}
                  </span>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 11,
                      color: MUTED,
                    }}
                  >
                    {sim.completedCount} / {sim.outcomeCount}
                    <span
                      style={{
                        marginLeft: 6,
                        color: riskColor(completion),
                        fontWeight: 700,
                      }}
                    >
                      {completion}%
                    </span>
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <StatusPill color={color}>{label}</StatusPill>
                  </div>
                </button>
              )
            })
          )}
        </ActivityCard>

        <ActivityCard
          title="Recent conversations"
          cta="View all →"
          onCta={() => navigate('/sessions')}
          accent={BLUE}
        >
          {loading ? (
            <EmptyLine text="Loading…" />
          ) : recentSessions.length === 0 ? (
            <EmptyLine
              text="No conversations yet."
              cta="Open chat →"
              onCta={() => navigate('/chat')}
            />
          ) : (
            recentSessions.map((s) => (
              <button
                key={s.slug}
                onClick={() => navigate(`/chat?session=${s.slug}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 100px',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: '#fff',
                  border: 'none',
                  borderTop: '1px solid #f0f0f8',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: sansFont,
                  fontSize: 12,
                  color: NAVY,
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 11,
                    color: MUTED,
                    textAlign: 'right',
                  }}
                >
                  {s.messageCount} msg
                </span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    color: MUTED,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textAlign: 'right',
                  }}
                >
                  {relativeDate(s.createdAt)}
                </span>
              </button>
            ))
          )}
        </ActivityCard>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function deriveStatus(e: SimulationProgressEvent): SimulationParent['status'] {
  if (e.status === 'error') {
    return e.completedCount + e.outcomeCount > 0 && e.completedCount >= e.outcomeCount
      ? 'partial'
      : 'processing'
  }
  if (e.completedCount >= e.outcomeCount && e.outcomeCount > 0) return 'completed'
  if (e.completedCount > 0) return 'processing'
  return 'queued'
}

function StatBlock({
  label,
  value,
  subtext,
}: {
  label: string
  value: React.ReactNode
  subtext?: string
}) {
  return (
    <div style={{ marginRight: 32 }}>
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          margin: '0 0 4px 0',
        }}
      >
        {label}
      </p>
      <div style={{ fontFamily: monoFont, fontSize: 18, fontWeight: 700, color: NAVY }}>{value}</div>
      {subtext && (
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            color: MUTED,
            margin: '2px 0 0 0',
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  )
}

interface ActivityCardProps {
  title: string
  cta: string
  onCta: () => void
  accent: string
  children: React.ReactNode
}

function ActivityCard({ title, cta, onCta, accent, children }: ActivityCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f8',
        }}
      >
        <SectionLabel>{title}</SectionLabel>
        <button
          onClick={onCta}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: monoFont,
            fontSize: 10,
            color: BLUE,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {cta}
        </button>
      </div>
      <div>{children}</div>
    </div>
  )
}

function EmptyLine({ text, cta, onCta }: { text: string; cta?: string; onCta?: () => void }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        textAlign: 'center',
        fontFamily: sansFont,
        fontSize: 12,
        color: MUTED,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span>{text}</span>
      {cta && onCta && (
        <button
          onClick={onCta}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: monoFont,
            fontSize: 10,
            color: BLUE,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}
