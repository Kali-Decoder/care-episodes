import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'

/**
 * Modal that lets the user paste in custom training data (JSONL or
 * free-form text). Replaces the disabled-by-default `window.prompt`
 * calls that Electron's renderer process silently swallows.
 *
 * The label is required. The content is required. On submit, the
 * parent receives `{ label, text }` via `onSubmit`; on cancel, `null`
 * is forwarded and the parent discards the open state.
 */
export default function PasteDataModal({
  open,
  kind,
  presetLabel,
  presetText,
  onCancel,
  onSubmit,
}: {
  open: boolean
  /** 'jsonl-text' or 'text' — drives the title and the helper text. */
  kind: 'jsonl-text' | 'text'
  presetLabel?: string
  presetText?: string
  onCancel: () => void
  onSubmit: (data: { label: string; text: string }) => void
}) {
  const isJsonl = kind === 'jsonl-text'
  const [label, setLabel] = useState(presetLabel ?? '')
  const [text, setText] = useState(presetText ?? '')
  const labelRef = useRef<HTMLInputElement>(null)

  // Reset state when the modal opens with new preset values.
  useEffect(() => {
    if (open) {
      setLabel(presetLabel ?? '')
      setText(presetText ?? '')
      // Autofocus the label so the user can type immediately.
      setTimeout(() => labelRef.current?.focus(), 60)
    }
  }, [open, presetLabel, presetText])

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const canSubmit = label.trim().length > 0 && text.trim().length > 0
  const lineCount = text === '' ? 0 : text.split('\n').filter((l) => l.trim().length > 0).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => {
            // Backdrop click closes; inner clicks don't bubble to here.
            if (e.target === e.currentTarget) onCancel()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            fontFamily: sansFont,
          }}
        >
          <motion.div
            initial={{ scale: 0.97, y: 4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 10,
              boxShadow: '0 16px 48px rgba(0,0,0,0.20)',
              width: 'min(640px, calc(100vw - 48px))',
              maxHeight: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f8',
              }}
            >
              <h2
                style={{
                  fontFamily: sansFont,
                  fontSize: 16,
                  fontWeight: 500,
                  color: NAVY,
                  margin: 0,
                }}
              >
                {isJsonl ? 'Paste JSONL data' : 'Paste text data'}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close"
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
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: MUTED,
                  letterSpacing: '0.04em',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {isJsonl
                  ? 'One JSON object per line, each shaped like {"messages":[{"role":"...","content":"..."}]}.'
                  : 'Plain text for Causal fine-tuning (domain adaptation). Saved as-is, no JSON wrapper.'}
              </p>

              <Field label="Label" required>
                <input
                  ref={labelRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={isJsonl ? 'past-clinic-2024' : 'notes-from-dr-lee'}
                  style={inputStyle}
                />
              </Field>

              <Field
                label={isJsonl ? 'JSONL content' : 'Text content'}
                required
                meta={isJsonl && lineCount > 0 ? `${lineCount} line${lineCount === 1 ? '' : 's'}` : undefined}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    isJsonl
                      ? '{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}\n{"messages":[...]}'
                      : 'Paste your text here…'
                  }
                  style={{
                    ...inputStyle,
                    minHeight: 220,
                    fontFamily: monoFont,
                    fontSize: 12,
                    lineHeight: 1.5,
                    resize: 'vertical',
                  }}
                />
              </Field>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f8',
                background: '#fafafc',
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: NAVY,
                  border: '1px solid #e0e0f0',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canSubmit) return
                  onSubmit({ label: label.trim(), text })
                }}
                disabled={!canSubmit}
                style={{
                  padding: '8px 16px',
                  background: canSubmit ? TEAL : MUTED,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  opacity: canSubmit ? 1 : 0.6,
                }}
              >
                Add
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  required,
  meta,
  children,
}: {
  label: string
  required?: boolean
  meta?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <label
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
          {required && (
            <span style={{ color: BLUE, marginLeft: 4 }} aria-hidden>
              *
            </span>
          )}
        </label>
        {meta && (
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: MUTED,
              letterSpacing: '0.04em',
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e0e0f0',
  borderRadius: 6,
  fontFamily: sansFont,
  fontSize: 13,
  color: NAVY,
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}
