'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import SectionLabel from '../../../renderer/src/components/ui/SectionLabel'
import { BLUE, MUTED, monoFont } from '../../ui'

export default function DashboardSection({
  title,
  accent,
  cta,
  ctaHref,
  onCta,
  children,
  id,
}: {
  title: string
  accent: string
  cta?: string
  ctaHref?: string
  onCta?: () => void
  children: ReactNode
  id?: string
}) {
  return (
    <section
      id={id}
      style={{
        background: '#fff',
        border: '1px solid #e8e8f2',
        borderRadius: 14,
        overflow: 'hidden',
        height: '100%',
        boxShadow: '0 4px 20px rgba(10, 10, 92, 0.04)',
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f8',
        }}
      >
        <SectionLabel>{title}</SectionLabel>
        {onCta && cta ? (
          <button
            type="button"
            onClick={onCta}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: monoFont,
              fontSize: 10,
              color: BLUE,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {cta} →
          </button>
        ) : ctaHref && cta ? (
          <Link
            href={ctaHref}
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: BLUE,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {cta} →
          </Link>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  )
}

export function DashboardEmpty({
  text,
  cta,
  ctaHref,
  icon,
}: {
  text: string
  cta?: string
  ctaHref?: string
  icon?: ReactNode
}) {
  return (
    <div
      className="care-dash-empty"
      style={{
        padding: '24px 20px',
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: MUTED,
        fontSize: 13,
        lineHeight: 1.55,
        gap: 8,
      }}
    >
      {icon ? <span style={{ opacity: 0.55, display: 'flex' }}>{icon}</span> : null}
      <p style={{ margin: 0, maxWidth: 280 }}>{text}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: BLUE,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginTop: 4,
          }}
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

/** Reserved panel — wire real content here later without changing dashboard layout. */
export function DashboardFutureSlot({
  title,
  description,
  accent = MUTED,
}: {
  title: string
  description: string
  accent?: string
}) {
  return (
    <DashboardSection title={title} accent={accent}>
      <div style={{ padding: '24px 16px 28px' }}>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: MUTED, margin: 0 }}>{description}</p>
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '14px 0 0',
            opacity: 0.75,
          }}
        >
          Slot reserved · add component when ready
        </p>
      </div>
    </DashboardSection>
  )
}
