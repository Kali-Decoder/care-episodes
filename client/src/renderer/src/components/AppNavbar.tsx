'use client'

import Link from 'next/link'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import { UserAvatarWithLabel } from './UserAvatar'

interface Profile {
  id: string
  name: string
  type: 'self' | 'family' | 'doctor' | 'community'
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
  avatarUrl?: string
}

export default function AppNavbar({ profile }: { profile?: Profile }) {
  const name = profile?.name ?? 'Guest'
  const avatarSrc = profile?.avatarUrl ?? '/avatars/demo-patient.svg'

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 40px',
        background: '#fff',
        borderBottom: '1px solid #e0e0f0',
        fontFamily: sansFont,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ height: 3, background: TEAL, position: 'absolute', top: 0, left: 0, right: 0 }} />

      <p style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>
        <span style={{ color: BLUE, fontWeight: 700 }}>Care</span> Episode Agent
      </p>

      <Link
        href="/settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
          color: 'inherit',
          padding: '4px 8px 4px 4px',
          borderRadius: 8,
          border: '1px solid transparent',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#e0e0f0'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent'
        }}
      >
        <UserAvatarWithLabel
          name={name}
          src={avatarSrc}
          subtitle="demo-patient-01"
          size={40}
        />
      </Link>
    </header>
  )
}
