import { useEffect } from 'react'
import { BLUE, TEAL, NAVY, MUTED, monoFont, sansFont } from '../theme'
import { useAI } from '../context/AIContext'

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const { isReady, progress, error, activeModel, reload, resetCache, setError } = useAI()

  // When the model finishes loading, advance after a short delay.
  useEffect(() => {
    if (!isReady) return
    const t = setTimeout(() => onComplete(), 400)
    return () => clearTimeout(t)
  }, [isReady, onComplete])

  const percent = Math.max(0, Math.min(100, Math.round(progress?.percentage ?? 0)))
  const modelLabel = activeModel?.name ?? 'Model'
  const statusText = error
    ? 'Error loading model'
    : progress?.phase === 'downloading'
      ? `Downloading ${modelLabel}… ${percent}%`
      : progress?.phase === 'loading'
        ? `Loading ${modelLabel}… ${percent}%`
        : isReady
          ? 'Ready'
          : 'Preparing model…'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '56px',
      }}
    >
      {/* Teal block — top-right, behind blue */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '180px',
          width: '240px',
          height: '200px',
          background: TEAL,
          zIndex: 1,
        }}
      />

      {/* Small blue cap — top-right corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '180px',
          height: '100px',
          background: BLUE,
          zIndex: 3,
        }}
      />

      {/* Large blue block — steps forward and down */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          right: 0,
          width: '360px',
          height: '280px',
          background: BLUE,
          zIndex: 2,
        }}
      />

      {/* Teal left-edge accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '4px',
          height: '80px',
          background: TEAL,
          zIndex: 5,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Wordmark */}
        <p
          style={{
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: '24px',
            letterSpacing: '0.04em',
            color: BLUE,
            marginBottom: '48px',
          }}
        >
          <span style={{ color: NAVY }}>MedLife</span>Sim
        </p>

        {/* App label */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: MUTED,
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Private & On-Device AI
        </p>

        {/* App title */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 300,
            color: NAVY,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '40px',
          }}
        >
          Sandbox for
          <br />
          <strong style={{ fontWeight: 500 }}>
            Health Scenarios
          </strong>
        </h1>

        {/* Progress bar or Error state */}
        <div style={{ width: '260px' }}>
          {error ? (
            <div>
              <div
                style={{
                  padding: '16px',
                  background: '#fff0f0',
                  border: '1px solid #ffcccc',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontFamily: monoFont,
                    fontSize: 11,
                    color: '#cc0000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 8,
                  }}
                >
                  Error
                </p>
                <p
                  style={{
                    fontFamily: sansFont,
                    fontSize: 13,
                    color: '#660000',
                    margin: 0,
                  }}
                >
                  {error.message || 'Failed to load AI model'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    void reload()
                  }}
                  style={{
                    padding: '12px 24px',
                    background: BLUE,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: monoFont,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Reload Model
                </button>
                <button
                  onClick={async () => {
                    if (!activeModel) return
                    const r = await resetCache(activeModel.id)
                    if (r.success) {
                      alert('Cache deleted. Please close and reopen the app to complete the process.')
                      void reload()
                    } else {
                      setError({
                        code: 'RESET_CACHE_FAILED',
                        message: r.error ?? 'Failed to clear cache',
                        retryable: true,
                      })
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#fff',
                    color: BLUE,
                    border: `1px solid ${BLUE}`,
                    borderRadius: 8,
                    fontFamily: monoFont,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Delete Cache
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: '100%',
                  height: '2px',
                  background: '#e8e8f0',
                  position: 'relative',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${percent}%`,
                    background: BLUE,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    color: MUTED,
                    letterSpacing: '0.06em',
                  }}
                >
                  {statusText}
                </span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: '13px',
                    fontWeight: 700,
                    color: BLUE,
                  }}
                >
                  {percent}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
