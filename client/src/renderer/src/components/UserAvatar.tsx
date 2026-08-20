'use client'

import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function UserAvatar({
  name,
  src,
  size = 36,
}: {
  name: string
  src?: string
  size?: number
}) {
  const fontSize = Math.max(11, Math.round(size * 0.36))

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px #e0e0f0',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 100%)`,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: monoFont,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px #e0e0f0',
      }}
    >
      {initials(name)}
    </span>
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
          <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, margin: '2px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
