'use client'

import Link from 'next/link'
import { CARE_PROFILE } from '../../../care/routes'
import { TEAL, sansFont } from '../theme'
import { UserAvatarWithLabel } from './UserAvatar'
import NaniLogo from './NaniLogo'
import { notionAvatarUrl, DEFAULT_NOTION_AVATAR } from '../../../lib/notionAvatars'

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
  const avatarSrc = profile?.avatarUrl ?? notionAvatarUrl(DEFAULT_NOTION_AVATAR)

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

      <Link
        href={CARE_PROFILE}
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
    </header>
  )
}
