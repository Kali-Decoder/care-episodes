'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useProfile, type Profile } from '../../renderer/src/context/ProfileContext'
import {
  NOTION_AVATAR_URLS,
  resolveAvatarUrl,
} from '../../lib/notionAvatars'
import UserAvatar from '../../renderer/src/components/UserAvatar'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CareProfilePage() {
  const { profile, setProfile, hydrated } = useProfile()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setAge(profile.age != null ? String(profile.age) : '')
    setGender(profile.gender ?? '')
    setAvatarUrl(profile.avatarUrl ?? resolveAvatarUrl(profile.name, profile.avatarUrl))
  }, [profile])

  if (!hydrated) {
    return null
  }

  if (!profile) {
    return (
      <div style={{ padding: '48px 36px', fontFamily: sansFont, color: MUTED }}>
        No profile yet. Launch the app from the welcome page to set up your profile.
      </div>
    )
  }

  const save = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }

    const parsedAge = age.trim() ? parseInt(age, 10) : undefined
    const next: Profile = {
      ...profile,
      name: trimmed,
      age: parsedAge && parsedAge > 0 ? parsedAge : undefined,
      gender: gender || undefined,
      avatarUrl,
    }
    setProfile(next)
    setError('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div
      style={{
        fontFamily: sansFont,
        minHeight: '100%',
        background: `
          radial-gradient(ellipse 55% 45% at 100% 0%, rgba(62,196,192,0.08), transparent 50%),
          radial-gradient(ellipse 50% 40% at 0% 30%, rgba(26,26,232,0.06), transparent 50%),
          ${LIGHT_BLUE}
        `,
        padding: '28px 36px 72px',
        boxSizing: 'border-box',
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '0 0 8px',
          }}
        >
          Account · Profile
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: NAVY,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Your <strong style={{ fontWeight: 600 }}>profile</strong>
        </h1>
      </motion.header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
        className="care-profile-split"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, borderRadius: 12, padding: '24px 22px', textAlign: 'center' }}
        >
          <UserAvatar name={name || profile.name} src={avatarUrl} size={96} />
          <p style={{ fontSize: 18, fontWeight: 600, color: NAVY, margin: '16px 0 4px' }}>
            {name.trim() || profile.name}
          </p>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: '0 0 16px',
            }}
          >
            Patient
          </p>
          <p style={{ fontSize: 13, color: '#4a4a78', margin: 0, lineHeight: 1.5 }}>
            Member since {formatMemberSince(profile.createdAt)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ ...cardStyle, borderRadius: 12, padding: '24px 28px' }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: NAVY, margin: '0 0 20px' }}>
            Personal details
          </h2>

          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder="Your name"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Age (optional)">
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
                style={inputStyle}
              />
            </Field>

            <Field label="Gender (optional)">
              <div style={{ display: 'flex', gap: 8 }}>
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? '' : g)}
                    style={{
                      flex: 1,
                      padding: '11px 0',
                      borderRadius: 8,
                      border: `1.5px solid ${gender === g ? BLUE : '#e0e0f0'}`,
                      background: gender === g ? '#f0f0fd' : '#fff',
                      color: gender === g ? NAVY : MUTED,
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Avatar">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
                gap: 8,
              }}
            >
              {NOTION_AVATAR_URLS.map((url, i) => {
                const selected = avatarUrl === url
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    title={`Avatar ${i + 1}`}
                    style={{
                      padding: 4,
                      borderRadius: 10,
                      border: `2px solid ${selected ? BLUE : '#e0e0f0'}`,
                      background: selected ? '#f0f0fd' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      width={44}
                      height={44}
                      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                setAvatarUrl(resolveAvatarUrl(name.trim() || profile.name, undefined))
              }
              style={{
                marginTop: 10,
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: TEAL,
                cursor: 'pointer',
              }}
            >
              Reset to default for name
            </button>
          </Field>

          {error ? (
            <p style={{ fontSize: 13, color: '#c83030', margin: '0 0 12px' }}>{error}</p>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={save}
              style={{
                padding: '12px 20px',
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
              Save profile
            </button>
            {saved && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: TEAL,
                  fontWeight: 600,
                }}
              >
                <Check size={16} />
                Saved
              </span>
            )}
          </div>

          <p style={{ fontSize: 12, color: MUTED, margin: '16px 0 0', lineHeight: 1.5 }}>
            Stored on this device only. NaniAi uses your name to greet you across episodes.
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .care-profile-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: 'block',
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: MUTED,
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1.5px solid #e0e0f0',
  fontFamily: sansFont,
  fontSize: 15,
  color: NAVY,
  outline: 'none',
  background: '#fff',
}
