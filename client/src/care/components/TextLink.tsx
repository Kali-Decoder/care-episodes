'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { BLUE, monoFont } from '../ui'

/** Visible hyperlink styling — use whenever the UI points somewhere. */
export const linkStyle: CSSProperties = {
  color: BLUE,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
  fontWeight: 600,
  cursor: 'pointer',
}

export const monoLinkStyle: CSSProperties = {
  ...linkStyle,
  fontFamily: monoFont,
  fontSize: 11,
  letterSpacing: '0.06em',
}

/** External URL (opens in a new tab). */
export function ExternalLink({
  href,
  children,
  style,
  mono,
}: {
  href: string
  children: ReactNode
  style?: CSSProperties
  mono?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...(mono ? monoLinkStyle : linkStyle), ...style }}
    >
      {children}
    </a>
  )
}

/** In-app Next.js link that still looks like a link. */
export function TextLink({
  href,
  children,
  style,
  mono,
}: {
  href: string
  children: ReactNode
  style?: CSSProperties
  mono?: boolean
}) {
  return (
    <Link href={href} style={{ ...(mono ? monoLinkStyle : linkStyle), ...style }}>
      {children}
    </Link>
  )
}

const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi

/** Turn bare URLs inside a string into clickable links. */
export function LinkifiedText({
  text,
  style,
}: {
  text: string
  style?: CSSProperties
}) {
  const parts = text.split(URL_RE)
  if (parts.length === 1) {
    return <span style={style}>{text}</span>
  }
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (!part) return null
        const isUrl = /^https?:\/\//i.test(part) || /^www\./i.test(part)
        if (!isUrl) return <span key={i}>{part}</span>
        const href = part.startsWith('http') ? part : `https://${part}`
        return (
          <ExternalLink key={i} href={href}>
            {part}
          </ExternalLink>
        )
      })}
    </span>
  )
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
