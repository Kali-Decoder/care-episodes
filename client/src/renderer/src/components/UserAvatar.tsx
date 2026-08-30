'use client'

import { MUTED, NAVY, monoFont, sansFont } from '../theme'
import { notionAvatarFor } from '../../../lib/notionAvatars'

export default function UserAvatar({
  name,
  src,
  size = 36,
}: {
  name: string
  src?: string
  size?: number
}) {
  const resolved = src || notionAvatarFor(name || 'guest')

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px #E8E2D6',
        flexShrink: 0,
        background: '#f4f4f8',
      }}
    />
  )
}

export function UserAvatarWithLabel({
  name,
  src,
  subtitle,
  size = 36,
}: {
  name: string
  src?: string
  subtitle?: string
  size?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <UserAvatar name={name} src={src} size={size} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: sansFont, fontSize: 13, fontWeight: 600, color: NAVY, margin: 0, lineHeight: 1.2 }}>
          {name}
        </p>
        {subtitle && (
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: '2px 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
