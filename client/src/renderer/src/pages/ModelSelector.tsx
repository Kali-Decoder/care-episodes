import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAI } from '../context/AIContext'
import { TealBar, Wordmark } from '../components/ModelSelectorChrome'
import { ModelCard } from '../components/ModelCard'
import { AddCustomModelForm } from '../components/AddCustomModelForm'
import { statusForEntry } from '../utils/modelDisplay'
import { BLUE, MUTED, TEAL, monoFont, sansFont } from '../theme'
import type { ModelEntry } from '../../../preload/index.d'

/**
 * ModelSelector — list of registered models with the same card layout as
 * ProfileSelector. The user picks one, which kicks off a download/load in
 * the main process. The parent (App) then transitions to the LoadingScreen
 * to show real progress, so the page itself is just list + add-form chrome.
 */
export default function ModelSelector({ onComplete }: { onComplete: (entry: ModelEntry) => void }) {
  const { status, progress, error, select, cancel } = useAI()
  const [showAddForm, setShowAddForm] = useState(false)
  const [localEntries, setLocalEntries] = useState<ModelEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    void refresh()
  }, [])

  const refresh = async () => {
    try {
      if (window.api?.models?.list) {
        const list = await window.api.models.list()
        setLocalEntries(list)
      }
    } catch (e) {
      console.error('[ModelSelector] Failed to list models:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (entry: {
    name: string
    source: string
    description?: string
  }) => {
    setAddError('')
    setSubmitting(true)
    try {
      const newEntry = await window.api.models.add(entry)
      setLocalEntries((prev) => [...prev, newEntry])
      setShowAddForm(false)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add model')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (entry: ModelEntry) => {
    if (entry.builtin) return
    if (!confirm(`Remove "${entry.name}"?`)) return
    try {
      const ok = await window.api.models.remove(entry.id)
      if (ok) {
        setLocalEntries((prev) => prev.filter((m) => m.id !== entry.id))
      }
    } catch (err) {
      console.error('[ModelSelector] Failed to remove:', err)
    }
  }

  /**
   * Fire-and-forget: kick off the load and immediately let the parent
   * transition to the LoadingScreen. The screen reads `progress` /
   * `isReady` from useAI() and will advance once the SDK reports the
   * model as loaded.
   */
  const handlePick = (entry: ModelEntry) => {
    setAddError('')
    void select(entry.id).catch((e) => {
      console.error('[ModelSelector] select failed:', e)
    })
    onComplete(entry)
  }

  const handleCancel = () => {
    void cancel(false).catch((e) => {
      console.error('[ModelSelector] cancel failed:', e)
    })
  }

  const activeId = status?.active?.id ?? null
  const lastSelectedId = status?.lastSelectedId ?? null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 56,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: sansFont,
      }}
    >
      {/* Top-right geometric blocks (mirrors ProfileSelector) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 180,
          width: 200,
          height: 160,
          background: TEAL,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 180,
          height: 80,
          background: BLUE,
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 0,
          width: 320,
          height: 240,
          background: BLUE,
          zIndex: 2,
        }}
      />
      {/* Teal left-edge accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 4,
          height: 100,
          background: TEAL,
          zIndex: 5,
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#fff',
          borderRadius: 0,
          border: '1px solid #e0e0f0',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        <TealBar />

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 32,
            }}
          >
            <Wordmark />
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
              }}
            >
              Private & On-Device AI
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 12,
                  color: MUTED,
                  letterSpacing: '0.1em',
                }}
              >
                LOADING MODELS…
              </span>
            </div>
          ) : showAddForm ? (
            <AddCustomModelForm
              onComplete={handleAdd}
              onCancel={() => {
                setShowAddForm(false)
                setAddError('')
              }}
            />
          ) : (
            <>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: MUTED,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Models
              </p>
              <h1
                style={{
                  fontFamily: sansFont,
                  fontSize: 24,
                  fontWeight: 300,
                  color: '#0a0a3c',
                  marginBottom: 24,
                  lineHeight: 1.2,
                }}
              >
                Choose a <strong style={{ fontWeight: 500 }}>model</strong>
                <br />
                to load
              </h1>

              {error && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#fff0f0',
                    border: '1px solid #ffcccc',
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      color: '#cc0000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: 0,
                    }}
                  >
                    {error.code}
                  </p>
                  <p
                    style={{
                      fontFamily: sansFont,
                      fontSize: 12,
                      color: '#660000',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {error.message}
                  </p>
                </div>
              )}

              {addError && (
                <p
                  style={{
                    fontFamily: sansFont,
                    fontSize: 12,
                    color: '#cc0000',
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  {addError}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {localEntries.length === 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      color: MUTED,
                      marginBottom: 8,
                      fontFamily: sansFont,
                    }}
                  >
                    No models in your registry yet — add one to get started.
                  </p>
                )}

                {localEntries.map((entry) => {
                  const st = statusForEntry(entry, {
                    activeId,
                    lastSelectedId,
                    progress: progress
                      ? { phase: progress.phase, percentage: progress.percentage }
                      : null,
                    error: error ?? null,
                  })
                  return (
                    <ModelCard
                      key={entry.id}
                      entry={entry}
                      isLastSelected={entry.id === lastSelectedId}
                      status={st}
                      submitting={submitting}
                      onSelect={() => handlePick(entry)}
                      onCancel={handleCancel}
                      onRemove={entry.builtin ? undefined : () => void handleRemove(entry)}
                    />
                  )
                })}

                {/* Add custom model pseudo-card */}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddForm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: '#fff',
                    border: `2px dashed ${TEAL}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      background: TEAL,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: monoFont,
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </div>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      color: '#085041',
                      textTransform: 'uppercase',
                    }}
                  >
                    Add custom model
                  </span>
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>

    </div>
  )
}
