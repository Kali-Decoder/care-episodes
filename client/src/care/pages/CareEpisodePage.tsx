'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TextLink } from '../components/TextLink'
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  Check,
  ClipboardList,
  FileUp,
  FlaskConical,
  Hourglass,
  Stethoscope,
  History,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react'
import { getEpisode, retryEpisode, uploadReport } from '../api'
import { CARE_EPISODES } from '../routes'
import { isTerminal, stateColor } from '../stateLabels'
import type { Episode, EpisodeState } from '../types'
import BookingsCard from '../components/BookingsCard'
import ConsultationCard from '../components/ConsultationCard'
import EpisodeTimeline from '../components/EpisodeTimeline'
import ErrorPanel from '../components/ErrorPanel'
import FindingsPanel from '../components/FindingsPanel'
import LabsCard from '../components/LabsCard'
import MockCycler from '../components/MockCycler'
import PrescriptionCard from '../components/PrescriptionCard'
import ReportUploadModal from '../components/ReportUploadModal'
import ResultsTable from '../components/ResultsTable'
import CareLoader from '../components/CareLoader'
import EpisodeStatusBanner from '../components/EpisodeStatusBanner'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import { LIGHT_BLUE, MUTED, NAVY, TEAL, monoFont, pageBackground, sansFont } from '../ui'

type PanelId =
  | 'overview'
  | 'timeline'
  | 'prescription'
  | 'labs'
  | 'bookings'
  | 'results'
  | 'findings'
  | 'consult'

const PANEL_META: Record<PanelId, { label: string; icon: typeof LayoutGrid }> = {
  overview: { label: 'Overview', icon: LayoutGrid },
  timeline: { label: 'Timeline', icon: History },
  prescription: { label: 'Prescription', icon: ClipboardList },
  labs: { label: 'Labs', icon: FlaskConical },
  bookings: { label: 'Bookings', icon: CalendarCheck },
  results: { label: 'Results', icon: Activity },
  findings: { label: 'Findings', icon: Stethoscope },
  consult: { label: 'Consult', icon: Stethoscope },
}

const JOURNEY = [
  { label: 'Rx', icon: ClipboardList, panel: 'prescription' as PanelId },
  { label: 'Labs', icon: FlaskConical, panel: 'labs' as PanelId },
  { label: 'Wait', icon: Hourglass, panel: 'bookings' as PanelId },
  { label: 'Results', icon: Activity, panel: 'results' as PanelId },
  { label: 'Done', icon: Check, panel: 'overview' as PanelId },
] as const

const ease = [0.22, 1, 0.36, 1] as const

function defaultPanel(state: EpisodeState, available: PanelId[]): PanelId {
  const prefer: PanelId[] = (() => {
    switch (state) {
      case 'PRESCRIPTION_RECEIVED':
      case 'TESTS_IDENTIFIED':
        return ['prescription', 'timeline']
      case 'LABS_SHORTLISTED':
        return ['labs', 'prescription']
      case 'BOOKING_REQUESTED':
        return ['bookings', 'labs']
      case 'AWAITING_REPORT':
        return ['overview', 'bookings', 'labs']
      case 'REPORT_RECEIVED':
      case 'TRENDS_ANALYZED':
        return ['results', 'findings']
      case 'ANOMALY_FOUND':
      case 'NORMAL':
        return ['findings', 'results']
      case 'CONSULT_REQUESTED':
        return ['consult', 'findings']
      case 'NEEDS_HUMAN':
        return ['overview', 'timeline']
      case 'CLOSED':
        return ['overview', 'findings', 'results']
      default:
        return ['overview']
    }
  })()
  return prefer.find((id) => available.includes(id)) ?? 'overview'
}

function journeyStep(state: EpisodeState): number {
  if (['PRESCRIPTION_RECEIVED', 'TESTS_IDENTIFIED'].includes(state)) return 0
  if (['LABS_SHORTLISTED', 'BOOKING_REQUESTED'].includes(state)) return 1
  if (state === 'AWAITING_REPORT') return 2
  if (
    ['REPORT_RECEIVED', 'TRENDS_ANALYZED', 'ANOMALY_FOUND', 'NORMAL', 'CONSULT_REQUESTED'].includes(
      state,
    )
  ) {
    return 3
  }
  if (state === 'CLOSED') return 4
  return 0
}

function accentFor(state: EpisodeState): string {
  return stateColor(state)
}

export default function CareEpisodePage({
  episodeId,
  embedded = false,
}: {
  episodeId: string
  embedded?: boolean
}) {
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [panel, setPanel] = useState<PanelId>('overview')
  const [userPickedPanel, setUserPickedPanel] = useState(false)

  const load = useCallback(async () => {
    try {
      const ep = await getEpisode(episodeId)
      setEpisode(ep)
    } catch {
      setEpisode(null)
    } finally {
      setLoading(false)
    }
  }, [episodeId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!episode || isTerminal(episode.state)) return
    const id = setInterval(() => void load(), 3000)
    return () => clearInterval(id)
  }, [episode?.state, load, episode])

  const availablePanels = useMemo((): PanelId[] => {
    if (!episode) return ['overview']
    const ids: PanelId[] = ['overview', 'timeline']
    if (episode.prescription) ids.push('prescription')
    if (
      episode.labs.length > 0 ||
      ['LABS_SHORTLISTED', 'BOOKING_REQUESTED', 'AWAITING_REPORT'].includes(episode.state)
    ) {
      ids.push('labs')
    }
    if (episode.bookings.length > 0) ids.push('bookings')
    if (episode.report?.values && episode.report.values.length > 0) ids.push('results')
    if (episode.analysis) ids.push('findings')
    if (episode.consultation) ids.push('consult')
    return ids
  }, [episode])

  useEffect(() => {
    if (!episode || userPickedPanel) return
    setPanel(defaultPanel(episode.state, availablePanels))
  }, [episode, availablePanels, userPickedPanel])

  const handleReport = async (file: File) => {
    setUploading(true)
    try {
      const ep = await uploadReport(episodeId, file)
      setEpisode(ep)
      setReportOpen(false)
      setUserPickedPanel(false)
    } finally {
      setUploading(false)
    }
  }

  const handleRetry = async () => {
    setRetrying(true)
    try {
      setEpisode(await retryEpisode(episodeId))
      setUserPickedPanel(false)
    } finally {
      setRetrying(false)
    }
  }

  const selectPanel = (id: PanelId) => {
    setUserPickedPanel(true)
    setPanel(id)
  }

  if (loading) {
    return <CareLoader embedded={embedded} label="Opening episode…" />
  }

  if (!episode) {
    return (
      <div style={{ padding: 48, fontFamily: sansFont }}>
        <p>Episode not found.</p>
        <TextLink href={CARE_EPISODES}>← All episodes</TextLink>
      </div>
    )
  }

  const showReportUpload = episode.state === 'AWAITING_REPORT'
  const reading =
    episode.state === 'PRESCRIPTION_RECEIVED' || episode.state === 'REPORT_RECEIVED'
  const anomaly = episode.state === 'ANOMALY_FOUND'
  const live = !isTerminal(episode.state)
  const accent = accentFor(episode.state)
  const step = journeyStep(episode.state)
  const activePanel = availablePanels.includes(panel) ? panel : 'overview'
  const padX = embedded ? 28 : 32

  return (
    <div
      style={{
        height: embedded ? 'calc(100vh - 56px)' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sansFont,
        overflow: 'hidden',
        background: pageBackground,
      }}
    >
      {!embedded && <div style={{ height: 3, background: TEAL, flexShrink: 0 }} />}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: `10px ${padX}px`,
          flexShrink: 0,
        }}
      >
        <TextLink
          href={CARE_EPISODES}
          mono
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Episodes
        </TextLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED }}>
            {episode.episode_id}
          </span>
        </div>
      </header>

      <div style={{ flexShrink: 0, padding: `0 ${padX}px 12px` }}>
        <EpisodeStatusBanner
          state={episode.state}
          summaryLine={episode.summary_line}
          createdAt={episode.created_at}
          accent={accent}
          live={live}
          reading={reading}
          action={
            showReportUpload ? (
              <MonoButton onClick={() => setReportOpen(true)} variant="primary">
                Upload lab report
              </MonoButton>
            ) : undefined
          }
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease }}
        style={{
          flexShrink: 0,
          margin: `0 ${padX}px 12px`,
          padding: '14px 18px 12px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(232,232,242,0.9)',
        }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '0 0 12px',
            fontWeight: 600,
          }}
        >
          Episode progress
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${JOURNEY.length}, 1fr)`,
            gap: 0,
            position: 'relative',
          }}
        >
          {JOURNEY.map((item, i) => {
            const done = i < step
            const current = i === step
            const Icon = item.icon
            const reachable =
              availablePanels.includes(item.panel) ||
              item.panel === 'overview' ||
              (i === 2 &&
                (availablePanels.includes('bookings') || availablePanels.includes('overview')))

            return (
              <button
                key={item.label}
                type="button"
                disabled={!reachable && !done && !current}
                onClick={() => {
                  if (availablePanels.includes(item.panel)) selectPanel(item.panel)
                  else if (i === 2)
                    selectPanel(availablePanels.includes('bookings') ? 'bookings' : 'overview')
                  else if (i === 3 && availablePanels.includes('findings')) selectPanel('findings')
                  else if (i === 3 && availablePanels.includes('results')) selectPanel('results')
                  else selectPanel('overview')
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 4px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: reachable || done || current ? 'pointer' : 'default',
                  opacity: done || current ? 1 : 0.45,
                }}
              >
                {i < JOURNEY.length - 1 && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 15,
                      left: 'calc(50% + 16px)',
                      right: 'calc(-50% + 16px)',
                      height: 2,
                      background: done ? TEAL : '#e4e4f0',
                      borderRadius: 2,
                      zIndex: 0,
                    }}
                  />
                )}
                <motion.span
                  animate={
                    current
                      ? {
                          scale: [1, 1.06, 1],
                          boxShadow: [
                            `0 0 0 0 ${accent}00`,
                            `0 0 0 6px ${accent}18`,
                            `0 0 0 0 ${accent}00`,
                          ],
                        }
                      : { scale: 1 }
                  }
                  transition={
                    current
                      ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.2 }
                  }
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: current ? accent : done ? TEAL : '#f0f0f8',
                    color: current || done ? '#fff' : MUTED,
                    border: current ? `2px solid ${accent}` : '2px solid transparent',
                  }}
                >
                  {done && !current ? (
                    <Check size={15} strokeWidth={2.5} />
                  ) : (
                    <Icon size={15} strokeWidth={2} />
                  )}
                </motion.span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: current ? NAVY : MUTED,
                    fontWeight: current ? 700 : 500,
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.section>

      <div style={{ flexShrink: 0, padding: `0 ${padX}px 10px` }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid #e0e0f0',
            overflowX: 'auto',
            maxWidth: 1040,
            margin: '0 auto',
            scrollbarWidth: 'none',
          }}
        >
          {availablePanels.map((id) => {
            const active = activePanel === id
            const Meta = PANEL_META[id]
            const Icon = Meta.icon
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => selectPanel(id)}
                whileHover={{ y: active ? 0 : -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  flex: '0 0 auto',
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: active ? NAVY : 'transparent',
                  color: active ? '#fff' : MUTED,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 6px 16px rgba(10,10,92,0.18)' : 'none',
                }}
              >
                <Icon size={13} strokeWidth={2.2} />
                {Meta.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: `4px ${padX}px 28px`,
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease }}
            >
              {activePanel === 'overview' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 14,
                  }}
                >
                  {episode.state === 'NEEDS_HUMAN' && episode.error && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <ErrorPanel error={episode.error} onRetry={handleRetry} retrying={retrying} />
                    </div>
                  )}
                  {anomaly && (
                    <motion.button
                      type="button"
                      onClick={() => selectPanel('findings')}
                      whileHover={{ y: -2 }}
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'left',
                        padding: '16px 18px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #fff5f5, #fdeaea)',
                        border: '1px solid #f0c0c0',
                        fontSize: 14,
                        color: '#8a2020',
                        lineHeight: 1.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontFamily: sansFont,
                      }}
                    >
                      <AlertTriangle size={20} strokeWidth={2} />
                      <span style={{ flex: 1 }}>
                        A meaningful change was detected — review findings.
                      </span>
                      <span
                        style={{
                          fontFamily: monoFont,
                          fontSize: 10,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Open →
                      </span>
                    </motion.button>
                  )}

                  <ActionTile
                    icon={LayoutGrid}
                    title="Where you are"
                    body={episode.summary_line}
                    cta={PANEL_META[defaultPanel(episode.state, availablePanels)].label}
                    onClick={() => selectPanel(defaultPanel(episode.state, availablePanels))}
                    accent={accent}
                  />
                  <ActionTile
                    icon={History}
                    title="Agent timeline"
                    body={`${episode.timeline.length} event${episode.timeline.length === 1 ? '' : 's'} so far.`}
                    cta="Open timeline"
                    onClick={() => selectPanel('timeline')}
                  />
                  {showReportUpload && (
                    <ActionTile
                      icon={FileUp}
                      title="Waiting on your report"
                      body="Upload when it arrives — the agent resumes automatically."
                      cta="Upload report"
                      onClick={() => setReportOpen(true)}
                      primary
                    />
                  )}
                  {episode.analysis && (
                    <ActionTile
                      icon={Stethoscope}
                      title="Analysis ready"
                      body={
                        episode.analysis.patient_summary ||
                        'Comparison with your history is available.'
                      }
                      cta="View findings"
                      onClick={() => selectPanel('findings')}
                    />
                  )}
                  {episode.consultation && (
                    <ActionTile
                      icon={CalendarCheck}
                      title="Consultation"
                      body="A follow-up consult was requested."
                      cta="View consult"
                      onClick={() => selectPanel('consult')}
                    />
                  )}
                </div>
              )}

              {activePanel === 'timeline' && <EpisodeTimeline entries={episode.timeline} />}
              {activePanel === 'prescription' && episode.prescription && (
                <PrescriptionCard prescription={episode.prescription} />
              )}
              {activePanel === 'labs' && <LabsCard labs={episode.labs} />}
              {activePanel === 'bookings' && episode.bookings.length > 0 && (
                <BookingsCard bookings={episode.bookings} />
              )}
              {activePanel === 'results' &&
                episode.report?.values &&
                episode.report.values.length > 0 && (
                  <ResultsTable
                    values={episode.report.values}
                    sourceFileUrl={episode.report.source_file_url}
                  />
                )}
              {activePanel === 'findings' && episode.analysis && (
                <FindingsPanel analysis={episode.analysis} />
              )}
              {activePanel === 'consult' && episode.consultation && (
                <ConsultationCard consultation={episode.consultation} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        @keyframes carePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.85); }
        }
      `}</style>

      <ReportUploadModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
        uploading={uploading}
      />
      <MockCycler episodeId={episodeId} onUpdate={load} />
    </div>
  )
}

function ActionTile({
  icon: Icon,
  title,
  body,
  cta,
  onClick,
  primary,
  accent,
}: {
  icon: typeof LayoutGrid
  title: string
  body: string
  cta: string
  onClick: () => void
  primary?: boolean
  accent?: string
}) {
  const color = accent ?? TEAL
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease }}
      style={
        {
          textAlign: 'left',
          background: primary
            ? `linear-gradient(145deg, ${TEAL}, #2aa8a4)`
            : 'rgba(255,255,255,0.95)',
          border: primary ? 'none' : '1px solid #e0e0f0',
          borderRadius: 14,
          padding: '20px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 156,
          cursor: 'pointer',
          boxShadow: primary
            ? '0 12px 28px rgba(62,196,192,0.28)'
            : '0 8px 22px rgba(10,10,92,0.04)',
          fontFamily: sansFont,
        } as CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: primary ? 'rgba(255,255,255,0.2)' : `${color}14`,
            color: primary ? '#fff' : color,
          }}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: primary ? 'rgba(255,255,255,0.75)' : MUTED,
            margin: 0,
          }}
        >
          {title}
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          color: primary ? 'rgba(255,255,255,0.92)' : '#4a4a78',
          margin: 0,
          lineHeight: 1.5,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {body}
      </p>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: primary ? '#fff' : color,
        }}
      >
        {cta} →
      </span>
    </motion.button>
  )
}
