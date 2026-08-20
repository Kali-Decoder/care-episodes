'use client'

import { useEffect, useRef, useState } from 'react'
import { MOCK_STATE_CYCLE } from '../mockEpisodes'
import { setMockEpisodeState } from '../api'
import { BLUE, MUTED, NAVY, TEAL, monoFont } from '../ui'

export default function MockCycler({
  episodeId,
  onUpdate,
}: {
  episodeId: string
  onUpdate: () => void
}) {
  const [enabled, setEnabled] = useState(false)
  const [index, setIndex] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (timer.current) clearInterval(timer.current)
      return
    }
    timer.current = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % MOCK_STATE_CYCLE.length
        setMockEpisodeState(episodeId, MOCK_STATE_CYCLE[next])
        onUpdate()
        return next
      })
    }, 3500)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [enabled, episodeId, onUpdate])

  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'false') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 300,
        background: NAVY,
        color: '#fff',
        borderRadius: 8,
        padding: '12px 14px',
        fontFamily: monoFont,
        fontSize: 10,
        boxShadow: '0 8px 32px rgba(10,10,92,0.25)',
        maxWidth: 220,
      }}
    >
      <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px', color: TEAL }}>
        Mock cycler
      </p>
      <p style={{ margin: '0 0 10px', lineHeight: 1.4, opacity: 0.85 }}>
        {MOCK_STATE_CYCLE[index]}
      </p>
      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        style={{
          background: enabled ? TEAL : BLUE,
          border: 'none',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: monoFont,
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          width: '100%',
        }}
      >
        {enabled ? 'Stop cycle' : 'Auto-cycle states'}
      </button>
      <button
        type="button"
        onClick={() => {
          const next = (index + 1) % MOCK_STATE_CYCLE.length
          setIndex(next)
          setMockEpisodeState(episodeId, MOCK_STATE_CYCLE[next])
          onUpdate()
        }}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: monoFont,
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          width: '100%',
          marginTop: 6,
        }}
      >
        Step once →
      </button>
    </div>
  )
}
