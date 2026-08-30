'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import {
  Activity,
  CalendarCheck,
  Check,
  FileUp,
  FlaskConical,
  Hourglass,
  Stethoscope,
  Upload,
} from 'lucide-react'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'

const NANI = {
  followup: '/brand/nani-followup.png',
  remember: '/brand/nani-remember.png',
  notice: '/brand/nani-notice.png',
  welcome: '/brand/nani-welcome.png',
}

const FLOW_STEPS = [
  {
    key: 'upload',
    label: 'Upload',
    title: 'Prescription uploaded',
    detail: 'You drop a photo or PDF — the care episode begins.',
    image: NANI.followup,
    accent: BLUE,
    icon: Upload,
  },
  {
    key: 'intake',
    label: 'Read',
    title: 'Tests identified',
    detail: 'NaniAi reads your prescription and picks out the tests that matter.',
    image: NANI.welcome,
    accent: BLUE,
    icon: Stethoscope,
  },
  {
    key: 'labs',
    label: 'Labs',
    title: 'Labs shortlisted & booked',
    detail: 'Nearby labs are found and a booking request goes out by email.',
    image: NANI.remember,
    accent: TEAL,
    icon: FlaskConical,
  },
  {
    key: 'wait',
    label: 'Wait',
    title: 'Waiting for results',
    detail: 'Days pass quietly — NaniAi holds the episode until your report arrives.',
    image: NANI.remember,
    accent: '#cc8a00',
    icon: Hourglass,
  },
  {
    key: 'report',
    label: 'Report',
    title: 'Lab report received',
    detail: 'You upload the report — or NaniAi reads it when it lands.',
    image: NANI.followup,
    accent: BLUE,
    icon: FileUp,
  },
  {
    key: 'results',
    label: 'Results',
    title: 'Trends compared',
    detail: 'Values are checked against your history — and flagged if something changed.',
    image: NANI.notice,
    accent: TEAL,
    icon: Activity,
  },
] as const

const ease = [0.22, 1, 0.36, 1] as const
const STEP_MS = 3200

function StepScene({ stepKey, accent }: { stepKey: (typeof FLOW_STEPS)[number]['key']; accent: string }) {
  switch (stepKey) {
    case 'upload':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
          <motion.div
            initial={{ x: -50, opacity: 0, scale: 0.85 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease }}
            style={{
              width: 96,
              height: 118,
              borderRadius: 12,
              background: '#fff',
              border: `2px dashed ${accent}`,
              boxShadow: `0 14px 36px ${accent}22`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Upload size={36} color={accent} strokeWidth={2} />
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 1, 0], x: [-8, 0, 8] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '12%',
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
            }}
          >
            Drop file →
          </motion.div>
        </div>
      )

    case 'intake':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            style={{
              width: 110,
              height: 130,
              borderRadius: 10,
              background: '#fff',
              border: `1.5px solid ${accent}33`,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: `0 10px 28px ${accent}15`,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ width: 0, x: -10 }}
                animate={{ width: `${55 + i * 8}%`, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15, ease }}
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: `${accent}${20 + i * 10}`,
                  margin: '12px 10px 0',
                }}
              />
            ))}
            <motion.div
              animate={{ left: ['-20%', '120%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '30%',
                background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
              }}
            />
          </motion.div>
        </div>
      )

    case 'labs':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'relative', width: 160, height: 110 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ x: 30, scale: 0, opacity: 0 }}
                animate={{ x: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.18, type: 'spring', stiffness: 380, damping: 22 }}
                style={{
                  position: 'absolute',
                  left: `${10 + i * 32}%`,
                  top: `${15 + (i % 2) * 30}%`,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: i === 1 ? TEAL : accent,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 14px ${i === 1 ? TEAL : accent}44`,
                }}
              >
                <FlaskConical size={15} strokeWidth={2.5} />
              </motion.div>
            ))}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: TEAL,
                fontWeight: 700,
              }}
            >
              <CalendarCheck size={12} /> Booking sent →
            </motion.div>
          </div>
        </div>
      )

    case 'wait':
      return (
        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: `${accent}14`,
              border: `2px solid ${accent}44`,
              display: 'grid',
              placeItems: 'center',
              color: accent,
            }}
          >
            <Hourglass size={32} strokeWidth={2} />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], x: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              marginTop: 16,
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
            }}
          >
            Day 1 → Day 2 → Day 3…
          </motion.div>
        </div>
      )

    case 'report':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease }}
            style={{
              width: 104,
              height: 120,
              borderRadius: 10,
              background: '#fff',
              border: `1.5px solid ${accent}`,
              boxShadow: `0 12px 32px ${accent}22`,
              padding: '14px 12px',
            }}
          >
            {['HbA1c', 'CBC', 'Lipid'].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: monoFont,
                  fontSize: 9,
                  color: NAVY,
                  marginBottom: 10,
                }}
              >
                <span>{label}</span>
                <span style={{ color: accent }}>●</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )

    case 'results':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
            {[40, 65, 52, 88].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, x: 10 }}
                animate={{ height: h, x: 0 }}
                transition={{ duration: 0.45, delay: i * 0.12, ease }}
                style={{
                  width: 24,
                  borderRadius: '6px 6px 2px 2px',
                  background: i === 3 ? TEAL : `${BLUE}${40 + i * 15}`,
                  border: i === 3 ? `2px solid ${TEAL}` : 'none',
                }}
              />
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.35 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              background: `${TEAL}18`,
              color: TEAL,
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            <Check size={12} strokeWidth={3} />
            Compared with history
          </motion.div>
        </div>
      )

    default:
      return null
  }
}

export default function CareEpisodeFlowAnimation() {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const advance = useCallback(() => {
    setActive((i) => (i + 1) % FLOW_STEPS.length)
  }, [])

  useEffect(() => {
    if (reduceMotion || !inView || paused) return
    const id = setInterval(advance, STEP_MS)
    return () => clearInterval(id)
  }, [reduceMotion, inView, paused, advance])

  const step = FLOW_STEPS[active]

  return (
    <div
      ref={ref}
      className="care-flow-split"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, 0.95fr)',
        background: '#fff',
        border: '1px solid #e4e4f0',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(10,10,92,0.06)',
        fontFamily: sansFont,
        marginBottom: 28,
        minHeight: 380,
      }}
    >
      {/* Left — sideways animation panel */}
      <div
        style={{
          position: 'relative',
          background: `linear-gradient(145deg, ${LIGHT_BLUE} 0%, #fff 55%, ${step.accent}10 100%)`,
          borderRight: '1px solid #e8e8f2',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, position: 'relative', minHeight: 280, overflow: 'hidden' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.key}
              initial={reduceMotion ? false : { opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -100 }}
              transition={{ duration: 0.45, ease }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '28px 24px 28px 32px',
              }}
            >
              <div style={{ height: 200, position: 'relative' }}>
                <StepScene stepKey={step.key} accent={step.accent} />
              </div>
              <motion.img
                src={step.image}
                alt=""
                initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease }}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'contain',
                  objectPosition: 'bottom center',
                  filter: 'drop-shadow(0 10px 24px rgba(10,10,92,0.12))',
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Horizontal progress bar */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {FLOW_STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Step ${i + 1}: ${s.label}`}
                onClick={() => setActive(i)}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  border: 'none',
                  padding: 0,
                  background: '#e0e0f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <motion.div
                  key={active === i ? `bar-${active}` : `bar-done-${i}`}
                  initial={{ scaleX: i < active ? 1 : 0 }}
                  animate={{ scaleX: i < active ? 1 : active === i ? 1 : 0 }}
                  transition={
                    active === i && !reduceMotion
                      ? { duration: STEP_MS / 1000, ease: 'linear' }
                      : { duration: 0.3 }
                  }
                  style={{
                    height: '100%',
                    background: i <= active ? (i === active ? s.accent : TEAL) : 'transparent',
                    transformOrigin: 'left',
                  }}
                />
              </button>
            ))}
          </div>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {paused ? 'Paused · hover away to resume' : 'Auto-playing'}
          </p>
        </div>
      </div>

      {/* Right — step text list */}
      <div
        style={{
          padding: '24px 28px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '0 0 8px',
            fontWeight: 600,
          }}
        >
          Episode steps
        </p>

        {FLOW_STEPS.map((s, i) => {
          const isActive = i === active
          const isDone = i < active
          const Icon = s.icon

          return (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              layout
              style={{
                width: '100%',
                textAlign: 'left',
                padding: isActive ? '14px 16px' : '10px 16px',
                borderRadius: 12,
                border: isActive ? `1.5px solid ${s.accent}` : '1.5px solid transparent',
                background: isActive ? `${s.accent}08` : isDone ? `${TEAL}06` : 'transparent',
                cursor: 'pointer',
                fontFamily: sansFont,
                transition: 'background 0.2s, border-color 0.2s, padding 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: isActive ? s.accent : isDone ? TEAL : LIGHT_BLUE,
                    display: 'grid',
                    placeItems: 'center',
                    color: isActive || isDone ? '#fff' : MUTED,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {isDone && !isActive ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <>
                      <img
                        src={s.image}
                        alt=""
                        style={{
                          position: 'absolute',
                          width: 28,
                          height: 28,
                          objectFit: 'contain',
                          objectPosition: 'bottom center',
                          opacity: isActive ? 0.3 : 0,
                        }}
                      />
                      <Icon size={15} strokeWidth={2.2} style={{ position: 'relative', zIndex: 1 }} />
                    </>
                  )}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isActive ? 4 : 0 }}>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: isActive ? s.accent : MUTED,
                        fontWeight: 700,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')} · {s.label}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key="text"
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: NAVY,
                            margin: '0 0 6px',
                            lineHeight: 1.3,
                          }}
                        >
                          {s.title}
                        </p>
                        <p style={{ fontSize: 13, color: '#4a4a78', margin: 0, lineHeight: 1.55 }}>
                          {s.detail}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isActive && (
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: isDone ? NAVY : MUTED,
                        margin: 0,
                        lineHeight: 1.3,
                        opacity: isDone ? 0.85 : 0.65,
                      }}
                    >
                      {s.title}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .care-flow-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
