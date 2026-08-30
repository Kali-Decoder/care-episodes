'use client'

import { useCallback, useEffect, useState } from 'react'
import { listEpisodes } from '../api'
import type { EpisodeSummary } from '../types'
import UploadHistorySection from '../components/UploadHistorySection'
import { usePatient } from '../context/PatientContext'
import { LIGHT_BLUE, MUTED, NAVY, TEXT_SECONDARY, serifFont, monoFont, sansFont } from '../ui'

export default function CareEpisodesPage() {
  const { patientId, selectedPatient } = usePatient()
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const eps = await listEpisodes(patientId)
      setEpisodes([...eps].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const id = setInterval(() => void refresh(), 8000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div
      style={{
        fontFamily: sansFont,
        minHeight: '100%',
        background: LIGHT_BLUE,
        padding: '32px 40px 64px',
        boxSizing: 'border-box',
      }}
    >
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
        Care episodes · {selectedPatient?.name ?? 'Profile'}
      </p>
      <h1
        style={{
          fontFamily: serifFont,
          fontSize: 32,
          fontWeight: 600,
          color: NAVY,
          margin: '0 0 10px',
          letterSpacing: '-0.025em',
        }}
      >
        Episodes
      </h1>
      <p style={{ fontSize: 14, color: TEXT_SECONDARY, margin: '0 0 28px', maxWidth: 520, lineHeight: 1.55 }}>
        Every prescription upload and its care episode — open one to see labs, waiting, and results.
      </p>

      <UploadHistorySection
        episodes={episodes}
        loading={loading}
        onRefresh={() => void refresh()}
        title="All episodes"
        id="episodes-list"
      />
    </div>
  )
}
