'use client'

import { useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PatientPicker from './PatientPicker'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'
import NaniLogo from '../../renderer/src/components/NaniLogo'

type PatientLaunchModalProps = {
  open: boolean
  onClose: () => void
  onLaunch: () => void
}

export default function PatientLaunchModal({ open, onClose, onLaunch }: PatientLaunchModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(10, 10, 92, 0.42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            fontFamily: sansFont,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #E8E2D6',
              boxShadow: '0 28px 80px rgba(10, 10, 92, 0.22)',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 3, background: TEAL }} />
            <div style={{ padding: '28px 28px 20px', background: LIGHT_BLUE }}>
              <NaniLogo size={44} textSize={16} href={false} />
              <h2
                id={titleId}
                style={{
                  fontSize: 24,
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                  color: NAVY,
                  margin: '18px 0 8px',
                }}
              >
                Pick a <strong style={{ fontWeight: 600 }}>demo profile</strong>
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: '#6B6560', margin: 0 }}>
                No login — choose a pre-seeded patient to explore different care-episode scenarios.
              </p>
            </div>

            <div style={{ padding: '20px 28px 28px' }}>
              <PatientPicker variant="cards" onSelect={() => onLaunch()} />

              <p style={{ fontSize: 12, color: MUTED, margin: '14px 0 0', lineHeight: 1.5 }}>
                Each profile has its own episode history. Switch anytime from the dashboard header.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  marginTop: 22,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 8,
                    border: '1px solid #E8E2D6',
                    background: '#fff',
                    color: NAVY,
                    fontFamily: monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onLaunch}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: BLUE,
                    color: '#fff',
                    fontFamily: monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Continue to dashboard →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
