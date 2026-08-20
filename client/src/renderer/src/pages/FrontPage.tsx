'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'
import { CARE_HOME } from '../../../care/routes'
import NaniLogo, { NANI_LOGO_SRC } from '../components/NaniLogo'
import LaunchAppModal from '../components/LaunchAppModal'
import { useProfile } from '../context/ProfileContext'

const pathway = [
  {
    code: 'Rx',
    step: 'Prescription',
    detail: 'Upload a photo or PDF. NaniAi reads the tests, medicines, and urgency — then stays with you.',
  },
  {
    code: 'Lab',
    step: 'Labs & waiting',
    detail: 'Nearby labs shortlisted, booking handled, and the quiet days in between — watched without nagging.',
  },
  {
    code: 'Dx',
    step: 'What changed',
    detail: 'Results compared with your history. Speaks up when something is different from last time.',
  },
]

const capabilities = [
  {
    title: 'Stays across days',
    body: 'Not a chatbot you keep prompting — something that follows the arc of a single care episode with you.',
  },
  {
    title: 'Labs without the scramble',
    body: 'Finding a lab, booking it, and tracking status — so the logistics don’t fall entirely on you.',
  },
  {
    title: 'Notices what changed',
    body: 'Remembers prior reports and flags the difference between “you’re fine” and “this is different from last time.”',
  },
]

const footerCols = [
  {
    title: 'Product',
    links: [
      { label: 'Launch app', href: '#launch' },
      { label: 'About NaniAi', href: '/welcome' },
    ],
  },
  {
    title: 'Care flow',
    links: [
      { label: 'Prescription', href: '#flow' },
      { label: 'Labs & waiting', href: '#flow' },
      { label: 'What changed', href: '#flow' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Not medical advice', href: '#disclaimer' },
      { label: 'Why Nani', href: '#why' },
    ],
  },
]

const padX = 'clamp(20px, 5vw, 64px)'

const easeOut = [0.22, 1, 0.36, 1] as const

function LaunchButton({
  children,
  primary,
  onClick,
}: {
  children: string
  primary?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      style={{
        display: 'inline-block',
        padding: primary ? '14px 24px' : '13px 20px',
        background: primary ? BLUE : 'transparent',
        color: primary ? '#fff' : NAVY,
        border: primary ? 'none' : `1.5px solid ${NAVY}33`,
        borderRadius: 8,
        fontFamily: monoFont,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {children}
    </motion.button>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: easeOut }}
      style={{
        fontFamily: monoFont,
        fontSize: 11,
        letterSpacing: '0.18em',
        color: MUTED,
        textTransform: 'uppercase',
        margin: '0 0 12px',
      }}
    >
      {children}
    </motion.p>
  )
}

export default function FrontPage() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const { profile, launchWithName } = useProfile()
  const [launchOpen, setLaunchOpen] = useState(false)

  const openLaunch = () => setLaunchOpen(true)

  const handleLaunch = (name: string) => {
    launchWithName(name)
    setLaunchOpen(false)
    router.push(CARE_HOME)
  }

  const heroParent: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: reduceMotion ? 0 : 0.05 },
    },
  }

  const heroItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: easeOut },
    },
  }

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: easeOut },
    },
  }

  return (
    <div
      style={{
        fontFamily: sansFont,
        background: '#fff',
        minHeight: '100vh',
        color: NAVY,
        overflowX: 'hidden',
      }}
    >
      <LaunchAppModal
        open={launchOpen}
        initialName={profile?.name ?? ''}
        onClose={() => setLaunchOpen(false)}
        onLaunch={handleLaunch}
      />

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease: easeOut }}
        style={{ height: 3, background: TEAL, transformOrigin: 'left' }}
      />

      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: `16px ${padX}`,
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e8e8f2',
        }}
      >
        <NaniLogo size={36} textSize={17} href="/welcome" />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <a
            href="#why"
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              textDecoration: 'none',
            }}
          >
            Why Nani
          </a>
          <a
            href="#flow"
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              textDecoration: 'none',
            }}
          >
            How it works
          </a>
          <LaunchButton primary onClick={openLaunch}>
            Launch app →
          </LaunchButton>
        </nav>
      </motion.header>

      {/* Hero */}
      <section
        className="nani-hero"
        style={{
          position: 'relative',
          minHeight: 'min(88vh, 760px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, 0.95fr)',
          alignItems: 'stretch',
          background: `linear-gradient(135deg, ${LIGHT_BLUE} 0%, #fff 48%, #eef3ff 100%)`,
          borderBottom: '1px solid #e8e8f2',
        }}
      >
        <div
          style={{
            padding: `clamp(48px, 8vh, 88px) ${padX}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div variants={heroParent} initial="hidden" animate="show">
            <motion.p
              variants={heroItem}
              style={{
                fontFamily: monoFont,
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: NAVY,
                margin: '0 0 20px',
              }}
            >
              <span style={{ color: BLUE }}>Nani</span>Ai
            </motion.p>
            <motion.h1
              variants={heroItem}
              style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 300,
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                margin: '0 0 18px',
                color: NAVY,
                maxWidth: 560,
              }}
            >
              Care that follows up,
              <br />
              <strong style={{ fontWeight: 600, color: BLUE }}>like family would.</strong>
            </motion.h1>
            <motion.p
              variants={heroItem}
              style={{
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                lineHeight: 1.65,
                color: '#4a4a78',
                margin: '0 0 32px',
                maxWidth: 460,
              }}
            >
              Upload a prescription. NaniAi handles the rest — labs, waiting, and knowing when
              something’s changed.
            </motion.p>
            <motion.div
              variants={heroItem}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <LaunchButton primary onClick={openLaunch}>
                Launch app →
              </LaunchButton>
              <a
                href="#why"
                style={{
                  display: 'inline-block',
                  padding: '13px 20px',
                  color: NAVY,
                  border: `1.5px solid ${NAVY}33`,
                  borderRadius: 8,
                  fontFamily: monoFont,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Why we built this
              </a>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: easeOut }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 4,
              height: 96,
              background: TEAL,
              transformOrigin: 'bottom',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `40px ${padX} 40px 24px`,
            overflow: 'hidden',
          }}
        >
          <motion.div
            aria-hidden
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: easeOut }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '55%',
              height: '38%',
              background: BLUE,
            }}
          />
          <motion.div
            aria-hidden
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
            style={{
              position: 'absolute',
              top: '38%',
              right: 0,
              width: '34%',
              height: '28%',
              background: TEAL,
            }}
          />
          <motion.img
            src={NANI_LOGO_SRC}
            alt="NaniAi — a caring companion for your care episode"
            width={380}
            height={426}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : {
                    opacity: 1,
                    y: [0, -10, 0],
                    scale: 1,
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.5, ease: easeOut }
                : {
                    opacity: { duration: 0.6, ease: easeOut },
                    scale: { duration: 0.6, ease: easeOut },
                    y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                  }
            }
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(380px, 72%)',
              height: 'auto',
              objectFit: 'contain',
              background: 'transparent',
              filter: 'drop-shadow(0 22px 40px rgba(10, 10, 92, 0.18))',
            }}
          />
        </div>
      </section>

      {/* Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6 }}
        style={{ borderBottom: '1px solid #e8e8f2', background: LIGHT_BLUE, overflow: 'hidden' }}
      >
        <motion.img
          src="/brand/naniai-banner.png"
          alt="NaniAi banner — care that follows up, like family would"
          width={1600}
          height={640}
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: easeOut }}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxHeight: 360,
            objectFit: 'cover',
            objectPosition: 'center left',
          }}
        />
      </motion.section>

      {/* Why Nani */}
      <section id="why" style={{ padding: `72px ${padX}`, borderBottom: '1px solid #e8e8f2' }}>
        <SectionLabel>Why Nani</SectionLabel>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          style={{
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 300,
            margin: '0 0 28px',
            letterSpacing: '-0.02em',
            maxWidth: 640,
            lineHeight: 1.25,
          }}
        >
          Grandmother. The person who remembers without being asked.
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            maxWidth: 980,
          }}
        >
          <motion.p variants={fadeUp} style={{ fontSize: 16, lineHeight: 1.75, color: '#4a4a78', margin: 0 }}>
            Healthcare doesn’t end when you walk out of the doctor’s office — it just goes quiet.
            You’re handed a prescription with a list of tests, and from that moment on, everything is
            on you: finding a lab, booking it, waiting days for results, remembering what your last
            report said, and noticing if something’s actually changed.
          </motion.p>
          <motion.p variants={fadeUp} style={{ fontSize: 16, lineHeight: 1.75, color: '#4a4a78', margin: 0 }}>
            Most people don’t do any of that well — not because they don’t care, but because nobody is
            watching the whole arc. We kept coming back to one word:{' '}
            <strong style={{ color: NAVY }}>Nani</strong>. We wanted an agent that behaves like that —
            stays with you across days, and only speaks up when it actually matters.
          </motion.p>
        </motion.div>
      </section>

      {/* Flow */}
      <section
        id="flow"
        style={{ padding: `72px ${padX}`, borderBottom: '1px solid #e8e8f2', background: LIGHT_BLUE }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 36,
          }}
        >
          <div>
            <SectionLabel>How it works</SectionLabel>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(26px, 3.5vw, 34px)',
                fontWeight: 300,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              One upload. NaniAi handles the rest.
            </motion.h2>
          </div>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              color: MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Rx → Lab → Dx
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {pathway.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: easeOut }}
              whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
              style={{
                background: '#fff',
                border: '1px solid #e0e0f0',
                borderRadius: 10,
                padding: '28px 26px',
              }}
            >
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 320, damping: 18 }}
                style={{
                  display: 'inline-block',
                  fontFamily: monoFont,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  color: '#fff',
                  background: i === 1 ? TEAL : BLUE,
                  borderRadius: 4,
                  padding: '4px 10px',
                }}
              >
                {item.code}
              </motion.span>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '18px 0 10px' }}>{item.step}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4a4a78', margin: 0 }}>{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What NaniAi does */}
      <section style={{ padding: `72px ${padX}`, borderBottom: '1px solid #e8e8f2' }}>
        <SectionLabel>What NaniAi does</SectionLabel>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            fontSize: 'clamp(26px, 3.5vw, 34px)',
            fontWeight: 300,
            margin: '0 0 36px',
            letterSpacing: '-0.02em',
            maxWidth: 560,
          }}
        >
          From prescription to knowing what changed.
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 40,
            maxWidth: 1000,
          }}
        >
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              variants={fadeUp}
              style={{ borderTop: `3px solid ${i === 1 ? TEAL : BLUE}`, paddingTop: 20 }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 10px' }}>{c.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#4a4a78', margin: 0 }}>{c.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Closing CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55 }}
        style={{
          padding: `64px ${padX}`,
          background: `linear-gradient(120deg, ${NAVY} 0%, #1a1a8a 55%, ${BLUE} 100%)`,
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!reduceMotion && (
          <motion.div
            aria-hidden
            animate={{ x: ['-20%', '120%'] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            margin: '0 0 14px',
            position: 'relative',
          }}
        >
          Ready when you are
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
          style={{
            fontSize: 'clamp(26px, 3.8vw, 40px)',
            fontWeight: 300,
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            position: 'relative',
          }}
        >
          Start with one prescription.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.75)',
            margin: '0 auto 28px',
            maxWidth: 420,
            position: 'relative',
          }}
        >
          NaniAi watches the rest of the arc — and only speaks up when something actually matters.
        </motion.p>
        <motion.button
          type="button"
          onClick={openLaunch}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 0 0 0 rgba(62,196,192,0.45)',
                    '0 0 0 14px rgba(62,196,192,0)',
                  ],
                }
          }
          transition={
            reduceMotion
              ? { type: 'spring', stiffness: 400, damping: 22 }
              : {
                  boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeOut' },
                  default: { type: 'spring', stiffness: 400, damping: 22 },
                }
          }
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: TEAL,
            color: NAVY,
            borderRadius: 8,
            border: 'none',
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Launch app →
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer
        id="disclaimer"
        style={{
          background: LIGHT_BLUE,
          borderTop: '1px solid #e0e0f0',
          padding: `56px ${padX} 28px`,
        }}
      >
        <motion.div
          className="nani-footer-grid"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(3, minmax(120px, 1fr))',
            gap: 40,
            marginBottom: 48,
          }}
        >
          <div>
            <NaniLogo size={52} textSize={18} href="/welcome" />
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: '#4a4a78',
                margin: '16px 0 0',
                maxWidth: 320,
              }}
            >
              Care that follows up, like family would. NaniAi stays with you across a care episode —
              labs, waiting, and knowing when something’s changed.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  margin: '0 0 16px',
                }}
              >
                {col.title}
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href === '#launch' ? (
                      <button
                        type="button"
                        onClick={openLaunch}
                        style={{
                          fontSize: 14,
                          color: NAVY,
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          opacity: 0.85,
                          fontFamily: sansFont,
                        }}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        style={{
                          fontSize: 14,
                          color: NAVY,
                          textDecoration: 'none',
                          opacity: 0.85,
                        }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div
          style={{
            borderTop: '1px solid #e0e0f0',
            paddingTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <p style={{ fontSize: 12, lineHeight: 1.6, color: MUTED, margin: 0, maxWidth: 640 }}>
            This is not medical advice and not for clinical decision support. A doctor should review
            your results. NaniAi explains trends and flags changes; it does not diagnose or prescribe.
          </p>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} NaniAi
          </p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .nani-hero {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .nani-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .nani-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
