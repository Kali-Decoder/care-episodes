'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import NaniLogo from './NaniLogo'
import { useAuth } from '../../../lib/AuthContext'
import { useProfile } from '../context/ProfileContext'

type LaunchAppModalProps = {
  open: boolean
  onClose: () => void
  /** Called after Google sign-in + username are done; profile is already set. */
  onLaunch: () => void
}

export default function LaunchAppModal({ open, onClose, onLaunch }: LaunchAppModalProps) {
  const { googleIdentity, phase, configured, signInWithGoogle, completeRegistration, user } =
    useAuth()
  const { launchWithName, setProfile } = useProfile()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const launchedRef = useRef(false)

  const step: 'google' | 'username' =
    phase === 'needs_username' || (open && !!googleIdentity && !user) ? 'username' : 'google'

  useEffect(() => {
    if (!open) {
      launchedRef.current = false
      return
    }
    setError('')
    if (step === 'username') {
      setUsername(googleIdentity?.googleName || '')
      const t = window.setTimeout(() => inputRef.current?.focus(), 80)
      return () => window.clearTimeout(t)
    }
  }, [open, step, googleIdentity?.googleName])

  useEffect(() => {
    if (!open || launchedRef.current) return
    if (phase === 'ready' && user) {
      // Returning user already registered — sync profile and continue.
      const profile = launchWithName(user.username)
      setProfile({
        ...profile,
        id: user.googleId,
        avatarUrl: user.picture || profile.avatarUrl,
      })
      launchedRef.current = true
      onLaunch()
    }
  }, [open, phase, user, onLaunch, launchWithName, setProfile])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, busy])

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      if (!configured) {
        setError('Google auth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local.')
        return
      }
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  const submitUsername = () => {
    setError('')
    try {
      const authUser = completeRegistration(username)
      const profile = launchWithName(authUser.username)
      setProfile({
        ...profile,
        id: authUser.googleId,
        avatarUrl: authUser.picture || profile.avatarUrl,
      })
      launchedRef.current = true
      onLaunch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save username')
      inputRef.current?.focus()
    }
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
          onClick={() => {
            if (!busy) onClose()
          }}
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
              border: '1px solid #e0e0f0',
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
                {step === 'google' ? (
                  <>
                    Launch <strong style={{ fontWeight: 600 }}>NaniAi</strong>
                  </>
                ) : (
                  <>
                    Choose a <strong style={{ fontWeight: 600 }}>username</strong>
                  </>
                )}
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: '#4a4a78', margin: 0 }}>
                {step === 'google'
                  ? 'Sign in with Google to register, then pick a username for your care dashboard.'
                  : `Signed in as ${googleIdentity?.email || 'Google account'}. Pick the name NaniAi should use.`}
              </p>
            </div>

            <div style={{ padding: '24px 28px 28px' }}>
              {step === 'google' ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleGoogle()}
                    disabled={busy}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      padding: '13px 16px',
                      borderRadius: 8,
                      border: '1.5px solid #e0e0f0',
                      background: '#fff',
                      color: NAVY,
                      fontFamily: sansFont,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: busy ? 'wait' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <GoogleMark />
                    {busy ? 'Connecting…' : 'Continue with Google'}
                  </button>
                  {error ? (
                    <p style={{ fontSize: 13, color: '#c83030', margin: '12px 0 0' }}>{error}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: MUTED, margin: '12px 0 0' }}>
                      Uses the Google OAuth client from your Care Episode backend env.
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={busy}
                      style={{
                        padding: '11px 16px',
                        borderRadius: 8,
                        border: '1px solid #e0e0f0',
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
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitUsername()
                  }}
                >
                  {googleIdentity ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      {googleIdentity.picture ? (
                        <img
                          src={googleIdentity.picture}
                          alt=""
                          width={40}
                          height={40}
                          style={{ borderRadius: '50%', border: '1px solid #e0e0f0' }}
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>
                          {googleIdentity.googleName}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{googleIdentity.email}</p>
                      </div>
                    </div>
                  ) : null}

                  <label
                    htmlFor="naniai-username"
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
                    Username
                  </label>
                  <input
                    id="naniai-username"
                    ref={inputRef}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="e.g. priya"
                    autoComplete="username"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '13px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${error ? '#c83030' : '#e0e0f0'}`,
                      fontFamily: sansFont,
                      fontSize: 15,
                      color: NAVY,
                      outline: 'none',
                      background: '#fff',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = error ? '#c83030' : BLUE
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = error ? '#c83030' : '#e0e0f0'
                    }}
                  />
                  {error ? (
                    <p style={{ fontSize: 13, color: '#c83030', margin: '8px 0 0' }}>{error}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: MUTED, margin: '8px 0 0' }}>
                      This is how you appear on your dashboard.
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
                        border: '1px solid #e0e0f0',
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
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
