'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getEpisode, retryEpisode, uploadReport } from '../api'
import { CARE_HOME } from '../routes'
import { isTerminal } from '../stateLabels'
import type { Episode } from '../types'
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
import StatusHeader from '../components/StatusHeader'
import MonoButton from '../../renderer/src/components/ui/MonoButton'
import Spinner from '../../renderer/src/components/ui/Spinner'
import { LIGHT_BLUE, MUTED, TEAL, monoFont, sansFont, sectionGap } from '../ui'

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

  const handleReport = async (file: File) => {
    setUploading(true)
    try {
      const ep = await uploadReport(episodeId, file)
      setEpisode(ep)
      setReportOpen(false)
    } finally {
      setUploading(false)
    }
  }

  const handleRetry = async () => {
    setRetrying(true)
    try {
      setEpisode(await retryEpisode(episodeId))
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: embedded ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: LIGHT_BLUE }}>
        <Spinner />
      </div>
    )
  }

  if (!episode) {
    return (
      <div style={{ padding: 48, fontFamily: sansFont }}>
        <p>Episode not found.</p>
        <Link href={CARE_HOME}>← All episodes</Link>
      </div>
    )
  }

  const showReportUpload = episode.state === 'AWAITING_REPORT'
  const showLabs = episode.labs.length > 0 || ['LABS_SHORTLISTED', 'BOOKING_REQUESTED', 'AWAITING_REPORT'].includes(episode.state)

  return (
    <div style={{ minHeight: embedded ? '100%' : '100vh', background: LIGHT_BLUE, fontFamily: sansFont }}>
      {!embedded && <div style={{ height: 3, background: TEAL }} />}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: embedded ? '16px 40px' : '14px 48px',
          background: '#fff',
          borderBottom: '1px solid #e0e0f0',
        }}
      >
        <Link href={CARE_HOME} style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textDecoration: 'none', textTransform: 'uppercase' }}>
          ← All episodes
        </Link>
        {showReportUpload && (
          <MonoButton onClick={() => setReportOpen(true)} variant="primary">
            Upload lab report
          </MonoButton>
        )}
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: sectionGap }}>
        <StatusHeader episode={episode} />

        {episode.state === 'NEEDS_HUMAN' && episode.error && (
          <ErrorPanel error={episode.error} onRetry={handleRetry} retrying={retrying} />
        )}

        <EpisodeTimeline entries={episode.timeline} />

        {episode.prescription && <PrescriptionCard prescription={episode.prescription} />}
        {showLabs && <LabsCard labs={episode.labs} />}
        {episode.bookings.length > 0 && <BookingsCard bookings={episode.bookings} />}
        {episode.report?.values && episode.report.values.length > 0 && (
          <ResultsTable values={episode.report.values} />
        )}
        {episode.analysis && <FindingsPanel analysis={episode.analysis} />}
        {episode.consultation && <ConsultationCard consultation={episode.consultation} />}
      </main>

      <ReportUploadModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReport} uploading={uploading} />
      <MockCycler episodeId={episodeId} onUpdate={load} />
    </div>
  )
}
