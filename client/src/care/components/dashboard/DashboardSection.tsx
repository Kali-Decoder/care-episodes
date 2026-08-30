'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import SectionLabel from '../../../renderer/src/components/ui/SectionLabel'
import { BLUE, MUTED, BORDER, BORDER_LIGHT, CARD_RADIUS, CARD_SHADOW, monoFont } from '../../ui'

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
        border: `1px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        height: '100%',
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: `1px solid ${BORDER_LIGHT}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 3,
              height: 16,
              borderRadius: 99,
              background: accent,
              flexShrink: 0,
            }}
          />
          <SectionLabel>{title}</SectionLabel>
        </div>
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
              fontWeight: 600,
              letterSpacing: '0.08em',
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
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
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
    <div style={{ padding: '32px 18px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
      <p style={{ margin: 0, lineHeight: 1.55 }}>{text}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: BLUE,
            textDecoration: 'none',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginTop: 10,
          }}
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

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
      <div style={{ padding: '24px 18px 28px' }}>
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
