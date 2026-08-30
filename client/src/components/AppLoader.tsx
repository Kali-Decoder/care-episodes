'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, TEXT_SECONDARY, monoFont, sansFont } from '../renderer/src/theme'
import { NANI_LOGO_SRC, NANI_PRODUCT_NAME } from '../renderer/src/components/NaniLogo'
import {
  DEFAULT_NOTION_AVATAR,
  NOTION_AVATAR_COUNT,
  notionAvatarUrl,
} from '../lib/notionAvatars'

const ease = [0.22, 1, 0.36, 1] as const

type AppLoaderProps = {
  label?: string
  /** Shorter boot message under the brand */
  detail?: string
}

/**
 * Full-viewport boot / route loader — NaniAi mark, orbit rings, cycling Notion avatars.
 * Use while providers hydrate or the app shell gates on profile.
 */
export default function AppLoader({
  label = 'Starting NaniAi…',
  detail = 'Care that follows up, like family would',
}: AppLoaderProps) {
  const [avatarIndex, setAvatarIndex] = useState(DEFAULT_NOTION_AVATAR)

  useEffect(() => {
    const id = window.setInterval(() => {
      setAvatarIndex((n) => (n % NOTION_AVATAR_COUNT) + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        fontFamily: sansFont,
        background: LIGHT_BLUE,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={NANI_LOGO_SRC}
            alt=""
            width={40}
            height={45}
            style={{ display: 'block', objectFit: 'contain' }}
          />
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: NAVY,
            }}
          >
            {NANI_PRODUCT_NAME}
          </span>
        </div>

        {/* Orbit + avatar */}
        <div
          style={{
            position: 'relative',
            width: 112,
            height: 112,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.94, 1.06, 0.94] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${TEAL}36 0%, transparent 68%)`,
            }}
          />

          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px dashed ${BLUE}40`,
            }}
          />

          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: '2.5px solid transparent',
              borderTopColor: TEAL,
              borderRightColor: `${TEAL}50`,
            }}
          />

          <motion.div
            aria-hidden
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 16,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: BLUE,
              borderLeftColor: `${BLUE}38`,
            }}
          />

          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#fff',
              border: '2px solid #fff',
              boxShadow: `0 12px 28px ${NAVY}24`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={avatarIndex}
                src={notionAvatarUrl(avatarIndex)}
                alt=""
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3, ease }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </AnimatePresence>
          </div>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <p
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
          </p>
          {detail && (
            <p
              style={{
                fontSize: 14,
                color: TEXT_SECONDARY,
                margin: '10px 0 0',
                lineHeight: 1.5,
              }}
            >
              {detail}
            </p>
          )}

          {/* Progress bar */}
          <div
            style={{
              marginTop: 18,
              height: 3,
              borderRadius: 999,
              background: '#E8E2D6',
              overflow: 'hidden',
              maxWidth: 180,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '45%',
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${TEAL}, ${BLUE})`,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginTop: 14,
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
          </div>
        </div>
      </motion.div>

      <p
        style={{
          position: 'absolute',
          bottom: 28,
          fontFamily: monoFont,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: MUTED,
          margin: 0,
        }}
      >
        NaniAi · care episodes
      </p>
    </div>
  )
}
