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
      style={{ background: '#fff', border: '1px solid #e0e0f0', borderRadius: 8, overflow: 'hidden', height: '100%' }}
    >
      <div style={{ height: 3, background: accent }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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

export function DashboardEmpty({ text, cta, ctaHref }: { text: string; cta?: string; ctaHref?: string }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
      <p style={{ margin: 0 }}>{text}</p>
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
            marginTop: 8,
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
