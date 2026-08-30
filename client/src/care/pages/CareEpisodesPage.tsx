'use client'

import { useCallback, useEffect, useState } from 'react'
import { listEpisodes } from '../api'
import type { EpisodeSummary } from '../types'
import UploadHistorySection from '../components/UploadHistorySection'
import { usePatient } from '../context/PatientContext'
import { LIGHT_BLUE, MUTED, NAVY, monoFont, pageBackground, sansFont } from '../ui'

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
        background: pageBackground,
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
          fontSize: 28,
          fontWeight: 300,
          color: NAVY,
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}
      >
        Episodes
      </h1>
      <p style={{ fontSize: 14, color: '#4a4a78', margin: '0 0 24px', maxWidth: 520, lineHeight: 1.6 }}>
        Every prescription you uploaded — open one to see labs, bookings, results, and what changed.
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
