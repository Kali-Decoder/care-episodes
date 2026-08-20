import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** When true, the confirm button uses the destructive red palette. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Centered confirm dialog. Reuses the same `AnimatePresence` + backdrop +
 * inner-panel `e.stopPropagation()` pattern as `OutcomesModal`. Esc and
 * backdrop click both call `onCancel`. Use `destructive` to render the
 * confirm button in the warning-red palette.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Esc cancels while open.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const confirmBg = destructive ? '#c83030' : BLUE
  const confirmShadow = destructive
    ? '0 6px 18px rgba(200,48,48,0.22)'
    : '0 6px 18px rgba(26,26,232,0.22)'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,10,92,0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <motion.div
            key="confirm-panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 24px 60px rgba(10,10,92,0.28)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ padding: '24px 24px 20px' }}>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: MUTED,
                  textTransform: 'uppercase',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                Confirm
              </p>
              <h2
                style={{
                  fontFamily: sansFont,
                  fontSize: 20,
                  fontWeight: 500,
                  color: NAVY,
                  margin: 0,
                  marginBottom: 10,
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  fontFamily: sansFont,
                  fontSize: 13,
                  color: '#555577',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {message}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                padding: '12px 16px 16px',
                background: '#fafaff',
                borderTop: '1px solid #e8e8f0',
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                style={{
                  height: 36,
                  padding: '0 16px',
                  background: '#fff',
                  color: NAVY,
                  border: '1px solid #d0d0e8',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {cancelLabel}
              </button>
              <motion.button
                type="button"
                onClick={onConfirm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 36,
                  padding: '0 18px',
                  background: confirmBg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: monoFont,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: confirmShadow,
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
