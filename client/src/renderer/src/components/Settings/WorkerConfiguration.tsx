import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'
import SectionLabel from '../ui/SectionLabel'

export default function WorkerConfiguration() {
  const [workerEnabled, setWorkerEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial state from main process on mount.
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.settings.get()
        setWorkerEnabled(settings.workerEnabled)
      } catch (err) {
        console.error('Failed to load worker setting:', err)
        setError('Failed to load current setting.')
      } finally {
        setLoaded(true)
      }
    }
    void loadSettings()
  }, [])

  const handleToggle = async (next: boolean) => {
    const previous = workerEnabled
    // Optimistic update — the IPC call is fast (a local settings.json
    // write plus a setInterval/setTimeout pair) but we still flip the
    // UI first so the toggle feels instant.
    setWorkerEnabled(next)
    setBusy(true)
    setError(null)
    try {
      await window.api.settings.setWorkerEnabled(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update worker setting.'
      console.error('Failed to set worker enabled:', err)
      setError(message)
      // Revert on failure.
      setWorkerEnabled(previous)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SectionLabel>Background</SectionLabel>
      <h2
        style={{
          fontFamily: sansFont,
          fontSize: 22,
          fontWeight: 300,
          color: NAVY,
          margin: '0 0 24px 0',
          lineHeight: 1.2,
        }}
      >
        <strong style={{ fontWeight: 500 }}>Worker</strong> Configuration
      </h2>

      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Simulation Worker</SectionLabel>
        <p style={{ fontFamily: sansFont, fontSize: 14, color: MUTED, marginBottom: 16 }}>
          The background worker runs queued simulation outcomes one at a time on the local model. Disable it if you only want chat, or want to control when outcomes are generated.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {(
            [
              { value: true, label: 'Enabled' },
              { value: false, label: 'Disabled' },
            ] as const
          ).map((opt) => (
            <motion.button
              key={opt.label}
              type="button"
              onClick={() => {
                if (!busy && workerEnabled !== opt.value) {
                  void handleToggle(opt.value)
                }
              }}
              disabled={busy || !loaded}
              whileHover={busy || !loaded ? undefined : { scale: 1.02 }}
              whileTap={busy || !loaded ? undefined : { scale: 0.98 }}
              style={{
                padding: '10px 22px',
                background: workerEnabled === opt.value ? BLUE : '#fff',
                color: workerEnabled === opt.value ? '#fff' : NAVY,
                border: workerEnabled === opt.value ? 'none' : '1px solid #e0e0f0',
                borderRadius: 6,
                fontFamily: monoFont,
                fontSize: 13,
                fontWeight: 500,
                cursor: busy || !loaded ? 'not-allowed' : 'pointer',
                opacity: busy || !loaded ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>

        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.10em',
            color: MUTED,
            marginTop: 12,
            textTransform: 'uppercase',
          }}
        >
          Status: {workerEnabled ? 'Worker is running' : 'Worker is paused'}
        </p>

        {error && (
          <p
            style={{
              marginTop: 12,
              fontFamily: sansFont,
              fontSize: 12,
              color: '#c83030',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
