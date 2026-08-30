'use client'

import Link from 'next/link'
import { CARE_PROFILE } from '../../../care/routes'
import PatientPicker from '../../../care/components/PatientPicker'
import { BORDER, CARD_SHADOW, sansFont } from '../theme'
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
        padding: '14px 32px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: sansFont,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <NaniLogo size={32} textSize={14} href={false} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PatientPicker />
        <Link
          href={CARE_PROFILE}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: 'inherit',
            padding: '4px 10px 4px 4px',
            borderRadius: 12,
            border: `1px solid transparent`,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = BORDER
            e.currentTarget.style.boxShadow = CARD_SHADOW
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <UserAvatarWithLabel name={name} src={avatarSrc} subtitle="Patient" size={40} />
        </Link>
      </div>
    </header>
  )
}
