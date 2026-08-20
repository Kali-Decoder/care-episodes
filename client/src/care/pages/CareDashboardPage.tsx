'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createEpisode, listEpisodes } from '../api'
import type { EpisodeSummary } from '../types'
import { CARE_EPISODE } from '../routes'
import { isTerminal, stateLabel } from '../stateLabels'
import PrescriptionUpload from '../components/PrescriptionUpload'
import UploadHistorySection from '../components/UploadHistorySection'
import DashboardSection, { DashboardEmpty, DashboardFutureSlot } from '../components/dashboard/DashboardSection'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { MOCK_PROFILE } from '../../renderer/src/mock/api'
import { relativeDate } from '../../renderer/src/utils/format'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'
import type { Session } from '../../preload/index.d'

export default function CareDashboardPage() {
  const router = useRouter()
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const eps = await listEpisodes()
      setEpisodes([...eps].sort((a, b) => b.created_at.localeCompare(a.created_at)))
      if (typeof window !== 'undefined' && window.api?.sessions) {
        const sess = await window.api.sessions.list(MOCK_PROFILE.id).catch(() => [] as Session[])
        setSessions([...sess].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      }
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
    const completed = episodes.filter((e) => e.state === 'CLOSED' || e.state === 'NORMAL').length
    return { active, awaiting, completed, total: episodes.length }
  }, [episodes])

  const activeEpisode = episodes.find((e) => !isTerminal(e.state))

  const needsAttention = useMemo(
    () =>
      episodes.filter(
        (e) => e.state === 'NEEDS_HUMAN' || e.state === 'AWAITING_REPORT' || e.state === 'ANOMALY_FOUND',
      ),
    [episodes],
  )

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const ep = await createEpisode(file)
      router.push(CARE_EPISODE(ep.episode_id))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ fontFamily: sansFont, minHeight: '100%', background: LIGHT_BLUE, padding: '32px 40px 64px', boxSizing: 'border-box' }}>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 8,
          minHeight: 280,
          marginBottom: 24,
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 1, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 140, background: BLUE }} />
          <div style={{ position: 'absolute', top: 140, right: 0, width: 140, height: 100, background: TEAL }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, padding: '36px 40px 32px 48px' }}>
          <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.16em', color: MUTED, textTransform: 'uppercase', margin: '0 0 8px' }}>
            Your dashboard · {MOCK_PROFILE.name}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 30, fontWeight: 300, color: NAVY, margin: '0 0 20px', letterSpacing: '-0.02em' }}
          >
            Welcome back, <strong style={{ fontWeight: 600 }}>{MOCK_PROFILE.name.split(' ')[0]}</strong>
          </motion.h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
            <Stat label="Active episodes" value={String(stats.active)} />
            <Stat label="Awaiting results" value={String(stats.awaiting)} highlight={stats.awaiting > 0} />
            <Stat label="Completed" value={String(stats.completed)} />
            <Stat label="Total uploads" value={String(stats.total)} />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 100, background: TEAL }} />
      </div>

      {/* Upload — dashboard only */}
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DashboardSection title="Upload prescription" accent={TEAL} id="upload-prescription">
          <PrescriptionUpload embedded onUpload={handleUpload} uploading={uploading} />
        </DashboardSection>
        <UploadHistorySection episodes={episodes} loading={loading} onRefresh={() => void refresh()} />
      </div>

      {/* Continue active episode */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <SectionLabel>Continue where you left off</SectionLabel>
            {activeEpisode ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: NAVY, margin: '0 0 8px', lineHeight: 1.4 }}>
                  {activeEpisode.summary_line}
                </p>
                <p style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, margin: '0 0 12px' }}>
                  {activeEpisode.upload_name ?? activeEpisode.episode_id} · {relativeDate(activeEpisode.created_at)}
                </p>
                <StatusPill color={activeEpisode.state === 'NEEDS_HUMAN' ? '#c83030' : TEAL}>
                  {stateLabel(activeEpisode.state)}
                </StatusPill>
              </>
            ) : (
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                No active episodes. Upload a prescription to start a new care flow.
              </p>
            )}
          </div>
          {activeEpisode && (
            <Link
              href={CARE_EPISODE(activeEpisode.episode_id)}
              style={{
                display: 'inline-block',
                marginTop: 20,
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BLUE,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Open episode →
            </Link>
          )}
        </div>
      </div>

      {/* Activity grid — extensible 2×2; add real components into empty slots later */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DashboardSection title="Needs attention" accent={BLUE} id="needs-attention">
          {loading ? (
            <DashboardEmpty text="Loading…" />
          ) : needsAttention.length === 0 ? (
            <DashboardEmpty text="Nothing needs you right now — agents are on it." />
          ) : (
            needsAttention.map((ep) => (
              <Link
                key={ep.episode_id}
                href={CARE_EPISODE(ep.episode_id)}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  borderTop: '1px solid #f0f0f8',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: '0 0 6px', lineHeight: 1.4 }}>
                  {ep.summary_line}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
                    {ep.upload_name ?? ep.episode_id}
                  </span>
                  <StatusPill
                    color={
                      ep.state === 'NEEDS_HUMAN' ? '#c83030' : ep.state === 'AWAITING_REPORT' ? '#cc8a00' : TEAL
                    }
                  >
                    {stateLabel(ep.state)}
                  </StatusPill>
                </div>
              </Link>
            ))
          )}
        </DashboardSection>

        <DashboardSection title="Recent conversations" accent={BLUE} cta="All sessions" ctaHref="/sessions" id="conversations">
          {loading ? (
            <DashboardEmpty text="Loading…" />
          ) : sessions.length === 0 ? (
            <DashboardEmpty text="No conversations yet." cta="Open chat →" ctaHref="/chat" />
          ) : (
            sessions.slice(0, 6).map((s) => (
              <Link
                key={s.slug}
                href={`/chat?session=${encodeURIComponent(s.slug)}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderTop: '1px solid #f0f0f8',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
                <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>{s.messageCount} msg</span>
                <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, textTransform: 'uppercase' }}>
                  {relativeDate(s.createdAt)}
                </span>
              </Link>
            ))
          )}
        </DashboardSection>

        <DashboardFutureSlot
          title="Documents"
          description="Prescriptions, lab reports, and visit summaries in one place — hook up when document storage is ready."
          accent={TEAL}
        />

        <DashboardFutureSlot
          title="Consultations"
          description="Upcoming and past follow-ups with your doctor — wire to the consultation API when live."
          accent={NAVY}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: monoFont, fontSize: 22, fontWeight: 700, color: highlight ? '#cc8a00' : NAVY, margin: 0 }}>
        {value}
      </p>
    </div>
  )
}
