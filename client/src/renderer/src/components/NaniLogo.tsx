'use client'

import Link from 'next/link'
import { BLUE, NAVY, monoFont } from '../theme'
import { CARE_HOME } from '../../../care/routes'

export const NANI_LOGO_SRC = '/brand/naniai-logo.png'
export const NANI_PRODUCT_NAME = 'NaniAi'
/** Intrinsic artboard ratio after transparent crop (width / height). */
export const NANI_LOGO_RATIO = 155 / 174

type NaniLogoProps = {
  /** Icon height in px. */
  size?: number
  /** Wordmark font size in px. */
  textSize?: number
  /** When false, do not wrap in a link. Default links to dashboard. */
  href?: string | false
  /** Show the NaniAi text beside the mark. */
  showText?: boolean
  /** Show the illustration mark. */
  showMark?: boolean
  /** Stack mark above text (sidebar). */
  stacked?: boolean
}

export default function NaniLogo({
  size = 36,
  textSize = 16,
  href = CARE_HOME,
  showText = true,
  showMark = true,
  stacked = false,
}: NaniLogoProps) {
  const width = Math.round(size * NANI_LOGO_RATIO)

  const mark = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: stacked ? 'flex-start' : 'center',
        flexDirection: stacked ? 'column' : 'row',
        gap: stacked ? 8 : 10,
        textDecoration: 'none',
        color: NAVY,
      }}
    >
      {showMark && (
        <img
          src={NANI_LOGO_SRC}
          alt=""
          width={width}
          height={size}
          style={{
            display: 'block',
            width,
            height: size,
            objectFit: 'contain',
            flexShrink: 0,
            background: 'transparent',
          }}
          draggable={false}
        />
      )}
      {showText && (
        <span
          style={{
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: textSize,
            letterSpacing: '0.04em',
            lineHeight: 1.2,
            color: NAVY,
          }}
        >
          <span style={{ color: BLUE }}>Nani</span>Ai
        </span>
      )}
    </span>
  )

  if (href === false) return mark

  return (
    <Link
      href={href}
      aria-label={NANI_PRODUCT_NAME}
      style={{ textDecoration: 'none', display: 'inline-flex' }}
    >
      {mark}
    </Link>
  )
}
