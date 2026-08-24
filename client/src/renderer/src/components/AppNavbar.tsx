'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TEAL, MUTED, monoFont, sansFont } from '../theme'
import { UserAvatarWithLabel } from './UserAvatar'
import NaniLogo from './NaniLogo'
import { useAuth } from '../../../lib/AuthContext'
import { useProfile } from '../context/ProfileContext'

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
  const router = useRouter()
  const { signOut } = useAuth()
  const { setProfile } = useProfile()
  const name = profile?.name ?? 'Guest'
  const avatarSrc = profile?.avatarUrl ?? '/avatars/demo-patient.svg'

  const handleSignOut = async () => {
    await signOut()
    setProfile(null)
    router.replace('/welcome')
  }

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

      <NaniLogo size={32} textSize={14} href={false} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e0e0f0',
            background: '#fff',
            color: MUTED,
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
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
          <UserAvatarWithLabel name={name} src={avatarSrc} subtitle="Patient" size={40} />
        </Link>
      </div>
    </header>
  )
}
