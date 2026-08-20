import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Upload, X } from 'lucide-react'
import { useAI } from '../context/AIContext'
import { useTraining } from '../context/TrainingContext'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import type { LoraEntry } from '../../../preload/index.d'

/**
 * LoRA picker — lives on the left side of the chat input row. Conceptually
 * a LoRA is a chat-time artifact (a small .gguf you bind to the loaded
 * base model and use per-chat), so binding lives here, not on a separate
 * page. Picking a LoRA re-loads the active base model with the adapter
 * applied via `models:selectLora`; "Load fine-tune .gguf…" opens the
 * existing import dialog and auto-binds the freshly imported adapter.
 *
 * The popover auto-closes on outside click / Esc / on a successful pick.
 * While the model is re-loading the chat input is disabled by the
 * existing `!isReady` branch, so the popover re-enables itself on its own
 * once the reload completes — no need to track the in-flight swap here.
 */
export default function LoRAPicker({
  disabled,
  disabledReason,
}: {
  disabled?: boolean
  disabledReason?: string
}) {
  const { selectLora, activeLora, activeModel, isReady, trainingActive } = useAI()
  const { loras, refreshLoras } = useTraining()

  const [open, setOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click + on Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Clear any stale error when the popover re-opens.
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const isDisabled = disabled || !isReady || trainingActive
  const reason = !isReady
    ? 'Load a model first'
    : trainingActive
    ? 'A training run is in progress'
    : disabledReason

  const label = activeLora?.name ? activeLora.name : 'No fine-tune'
  const labelColor = activeLora?.name ? TEAL : MUTED

  const handlePickNone = async () => {
    setOpen(false)
    try {
      await selectLora(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unbind LoRA')
    }
  }

  const handlePickLora = async (lora: LoraEntry) => {
    setOpen(false)
    try {
      await selectLora(lora.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to switch LoRA')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    try {
      const lora = await window.api.loras.import()
      if (!lora) {
        // user canceled the file dialog
        return
      }
      await refreshLoras()
      setOpen(false)
      // Auto-bind the freshly imported adapter.
      await selectLora(lora.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import LoRA')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <motion.button
        type="button"
        onClick={() => !isDisabled && setOpen((v) => !v)}
        disabled={isDisabled}
        title={reason}
        whileHover={!isDisabled ? { x: 2 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          color: labelColor,
          fontFamily: monoFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <ChevronDown
          size={12}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 0,
              minWidth: 280,
              maxWidth: 360,
              maxHeight: 360,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              zIndex: 50,
              fontFamily: sansFont,
            }}
          >
            <PopoverHeader label="Fine-tuned model" onClose={() => setOpen(false)} />

            {/* None option */}
            <PopoverRow
              isActive={!activeLora?.id}
              onClick={handlePickNone}
              title="None (use base model only)"
              subtitle="Chat with the base model as-is"
              active={!activeLora?.id}
            />

            {loras.length > 0 && <Divider />}

            {loras.length === 0 ? (
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: MUTED,
                  padding: '12px 14px',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                No fine-tuned models yet. Train one on the Training page, or import a .gguf below.
              </p>
            ) : (
              loras.map((l) => {
                const wrongBase =
                  activeModel != null && activeModel.id !== l.baseModelId
                const base = activeModel?.id === l.baseModelId ? activeModel : null
                return (
                  <PopoverRow
                    key={l.id}
                    isActive={activeLora?.id === l.id}
                    onClick={() => handlePickLora(l)}
                    title={l.name}
                    subtitle={
                      wrongBase
                        ? `Built for a different model — switching will rebind`
                        : `${l.source === 'training' ? 'Trained' : 'Imported'} · ${base?.name ?? l.baseModelId}`
                    }
                    subtitleColor={wrongBase ? '#aa8800' : MUTED}
                    active={activeLora?.id === l.id}
                  />
                )
              })
            )}

            <Divider />

            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: importing ? '#f0f0f5' : 'transparent',
                border: 'none',
                color: importing ? MUTED : BLUE,
                fontFamily: monoFont,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: importing ? 'wait' : 'pointer',
                textAlign: 'left',
              }}
            >
              <Upload size={14} />
              {importing ? 'Importing…' : 'Load a fine-tune file…'}
            </button>

            {error && (
              <div
                style={{
                  padding: '8px 14px',
                  background: '#fff0f0',
                  borderTop: '1px solid #ffcccc',
                  color: '#cc0000',
                  fontFamily: sansFont,
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PopoverHeader({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid #f0f0f8',
      }}
    >
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close fine-tune picker"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: MUTED,
          cursor: 'pointer',
          padding: 2,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

function PopoverRow({
  isActive,
  onClick,
  title,
  subtitle,
  subtitleColor,
  active,
}: {
  isActive?: boolean
  onClick: () => void
  title: string
  subtitle?: string
  subtitleColor?: string
  active: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        background: active ? '#f0fafa' : 'transparent',
        border: 'none',
        borderTop: isActive ? 'none' : '1px solid #f7f7fc',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: sansFont,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && <Check size={14} color={TEAL} />}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: NAVY,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: subtitleColor ?? MUTED,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f0f8' }} />
}
