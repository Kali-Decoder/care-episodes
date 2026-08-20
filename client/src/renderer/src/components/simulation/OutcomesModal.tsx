import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'
import type { SimPathPreview } from '../../types/simulation'

interface OutcomesModalProps {
  paths: SimPathPreview[] | null
  onClose: () => void
  /** Called when the user clicks Proceed. Receives the user-supplied name and description. */
  onProceed?: (name: string, description: string) => void | Promise<void>
  /** Disables the Proceed button while a submission is in flight. */
  submitting?: boolean
  /** Error from a failed submission (rendered as a red banner). */
  submitError?: string | null
  /** Initial value for the name input. */
  initialName?: string
  /** Initial value for the description textarea (pre-filled from the template). */
  initialDescription?: string
  /** Fires on every keystroke so the parent can persist the value across re-opens. */
  onDescriptionChange?: (value: string) => void
}

function defaultName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `Scenario · ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Centered modal dialog that lists every path enumerated from the canvas
 * as a queue table. No risk or summary numbers — outcomes are produced by
 * the AI after the user clicks Proceed.
 *
 * Columns: INT → Exposure → Subject → Status
 * Status column renders a "Pending AI" pill for every row.
 * Footer: Cancel + Proceed (primary BLUE).
 */
export default function OutcomesModal({
  paths,
  onClose,
  onProceed,
  submitting,
  submitError,
  initialName,
  initialDescription,
  onDescriptionChange,
}: OutcomesModalProps) {
  const open = paths !== null
  const [name, setName] = useState<string>(initialName ?? defaultName())
  const [description, setDescription] = useState<string>(initialDescription ?? '')

  // Esc closes — global listener while open.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // When the modal opens, refresh the default name unless the parent
  // supplied one. Re-sync description from the parent (template-derived).
  useEffect(() => {
    if (open && !initialName) setName(defaultName())
    if (open) setDescription(initialDescription ?? '')
  }, [open, initialName, initialDescription])

  const canProceed = !!(paths && paths.length > 0 && !submitting && onProceed)

  return (
    <AnimatePresence>
      {open && paths && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,10,92,0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            zIndex: 200,
          }}
        >
          <motion.section
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 4, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 1200,
              maxHeight: '80vh',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(10,10,92,0.30)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #e0e0f0',
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  color: MUTED,
                  textTransform: 'uppercase',
                }}
              >
                Queued Outcomes · {paths.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                aria-label="Close outcomes"
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  background: 'transparent',
                  color: MUTED,
                  border: '1px solid #e0e0f0',
                  borderRadius: 4,
                  fontFamily: monoFont,
                  fontSize: 16,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </header>

            <div
              style={{
                padding: '14px 20px 8px',
                borderBottom: '1px solid #e0e0f0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  whiteSpace: 'nowrap',
                }}
              >
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Scenario name"
                style={{
                  flex: 1,
                  height: 32,
                  padding: '0 10px',
                  fontFamily: sansFont,
                  fontSize: 13,
                  color: NAVY,
                  background: '#f7f7fc',
                  border: '1px solid #e0e0f0',
                  borderRadius: 4,
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                padding: '8px 20px 14px',
                borderBottom: '1px solid #e0e0f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                }}
              >
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  onDescriptionChange?.(e.target.value)
                }}
                placeholder="What is this scenario modelling? (optional — inherited from the template if you loaded one)"
                maxLength={1000}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontFamily: sansFont,
                  fontSize: 13,
                  color: NAVY,
                  background: '#f7f7fc',
                  border: '1px solid #e0e0f0',
                  borderRadius: 4,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 56,
                  maxHeight: 160,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 0,
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: sansFont,
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>INTERVENTION</th>
                    <th style={thStyle}>Exposure</th>
                    <th style={thStyle}>Subject</th> 
                  </tr>
                </thead>
                <tbody>
                  {paths.map((p, i) => (
                    <PathRow key={p.id} path={p} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {submitError && (
              <div
                style={{
                  padding: '10px 20px',
                  background: 'rgba(200,48,48,0.08)',
                  borderTop: '1px solid #f0c0c0',
                  color: '#a02020',
                  fontFamily: sansFont,
                  fontSize: 12,
                }}
              >
                {submitError}
              </div>
            )}

            <footer
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
                padding: '14px 20px',
                borderTop: '1px solid #e0e0f0',
                background: '#fafaff',
              }}
            >
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 36,
                  padding: '0 16px',
                  background: 'transparent',
                  color: MUTED,
                  border: '1px solid #e0e0f0',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                disabled={!canProceed}
                onClick={() =>
                  onProceed && onProceed(name.trim() || defaultName(), description.trim())
                }
                whileHover={canProceed ? { scale: 1.02 } : undefined}
                whileTap={canProceed ? { scale: 0.98 } : undefined}
                style={{
                  height: 36,
                  padding: '0 18px',
                  background: canProceed ? BLUE : MUTED,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                  opacity: canProceed ? 1 : 0.55,
                  boxShadow: canProceed ? '0 4px 12px rgba(26,26,232,0.22)' : 'none',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: monoFont,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MUTED,
  background: '#f8f8fc',
  borderBottom: '1px solid #e0e0f0',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}

function PathRow({ path, index }: { path: SimPathPreview; index: number }) {
  return (
    <tr
      style={{
        borderBottom: '1px solid #f0f0f8',
        background: index % 2 === 0 ? '#fff' : '#fafafa',
      }}
    >
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: MUTED + '22',
            color: NAVY,
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: monoFont,
          }}
        >
          {path.pathLabels.intervention}
        </span>
      </td>
      <td style={tdStyle}>{path.pathLabels.exposure}</td>
      <td style={tdStyle}>{path.pathLabels.subject}</td> 
    </tr>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: NAVY,
  verticalAlign: 'middle',
}
