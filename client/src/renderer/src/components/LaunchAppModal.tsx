'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import NaniLogo from './NaniLogo'

type LaunchAppModalProps = {
  open: boolean
  initialName?: string
  onClose: () => void
  onLaunch: (name: string) => void
}

export default function LaunchAppModal({
  open,
  initialName = '',
  onClose,
  onLaunch,
}: LaunchAppModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError('')
      const t = window.setTimeout(() => inputRef.current?.focus(), 80)
      return () => window.clearTimeout(t)
    }
  }, [open, initialName])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Please enter your name to continue.')
      inputRef.current?.focus()
      return
    }
    onLaunch(trimmed)
  }

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
              maxWidth: 420,
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #E8E2D6',
              boxShadow: '0 28px 80px rgba(10, 10, 92, 0.22)',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 3, background: TEAL }} />
            <div style={{ padding: '28px 28px 24px', background: LIGHT_BLUE }}>
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
                Launch <strong style={{ fontWeight: 600 }}>NaniAi</strong>
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: '#6B6560', margin: 0 }}>
                Enter your name to open your care dashboard. NaniAi will use it to greet you and
                keep your episode personal.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              style={{ padding: '24px 28px 28px' }}
            >
              <label
                htmlFor="naniai-launch-name"
                style={{
                  display: 'block',
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: 8,
                }}
              >
                Your name
              </label>
              <input
                id="naniai-launch-name"
                ref={inputRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. Priya Sharma"
                autoComplete="name"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '13px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${error ? '#C45C5C' : '#E8E2D6'}`,
                  fontFamily: sansFont,
                  fontSize: 15,
                  color: NAVY,
                  outline: 'none',
                  background: '#fff',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = error ? '#C45C5C' : BLUE
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? '#C45C5C' : '#E8E2D6'
                }}
              />
              {error ? (
                <p style={{ fontSize: 13, color: '#C45C5C', margin: '8px 0 0' }}>{error}</p>
              ) : (
                <p style={{ fontSize: 12, color: MUTED, margin: '8px 0 0' }}>
                  Saved on this device only.
                </p>
              )}

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
                  type="submit"
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
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
