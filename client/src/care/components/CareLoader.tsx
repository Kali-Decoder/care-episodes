'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'
import {
  DEFAULT_NOTION_AVATAR,
  NOTION_AVATAR_COUNT,
  notionAvatarUrl,
} from '../../lib/notionAvatars'

const ease = [0.22, 1, 0.36, 1] as const

type CareLoaderProps = {
  /** full = page takeover · block = card/section · inline = compact spinner */
  variant?: 'full' | 'block' | 'inline'
  label?: string
  /** Override height for full/block (e.g. calc(100vh - 56px)) */
  minHeight?: string | number
  embedded?: boolean
}

export default function CareLoader({
  variant = 'full',
  label = 'Loading care episode…',
  minHeight,
  embedded,
}: CareLoaderProps) {
  if (variant === 'inline') {
    return <InlinePulse label={label} />
  }

  const height =
    minHeight ??
    (variant === 'full' ? (embedded ? 'calc(100vh - 56px)' : '100vh') : 180)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        minHeight: height,
        height: variant === 'full' ? height : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: variant === 'block' ? '36px 20px' : 24,
        background:
          variant === 'full'
            ? `
              radial-gradient(700px 360px at 20% 0%, ${TEAL}22, transparent 55%),
              radial-gradient(560px 300px at 90% 10%, ${BLUE}14, transparent 50%),
              ${LIGHT_BLUE}
            `
            : 'transparent',
        fontFamily: sansFont,
      }}
    >
      <LoaderMark size={variant === 'block' ? 72 : 96} />
      <div style={{ textAlign: 'center' }}>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35, ease }}
          style={{
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: NAVY,
            margin: 0,
            fontWeight: 700,
          }}
        >
          {label}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12,
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: i === 1 ? TEAL : BLUE,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function LoaderMark({ size }: { size: number }) {
  const [index, setIndex] = useState(DEFAULT_NOTION_AVATAR)
  const core = Math.round(size * 0.62)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((n) => (n % NOTION_AVATAR_COUNT) + 1)
    }, 900)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${TEAL}33 0%, transparent 70%)`,
        }}
      />

      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1.5px dashed ${BLUE}44`,
        }}
      />

      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: '50%',
          border: '2.5px solid transparent',
          borderTopColor: TEAL,
          borderRightColor: `${TEAL}55`,
        }}
      />

      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 12,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: BLUE,
          borderLeftColor: `${BLUE}40`,
        }}
      />

      <div
        style={{
          width: core,
          height: core,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#f4f4f8',
          border: '2px solid #fff',
          boxShadow: `0 10px 24px ${NAVY}22`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={notionAvatarUrl(index)}
            alt=""
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.28, ease }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}

function InlinePulse({ label }: { label: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        verticalAlign: 'middle',
      }}
    >
      <span style={{ position: 'relative', width: 16, height: 16 }}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${TEAL}`,
            borderTopColor: 'transparent',
          }}
        />
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            background: BLUE,
          }}
        />
      </span>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        {label}
      </span>
    </span>
  )
}
