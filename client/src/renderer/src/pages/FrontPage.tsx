'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'
import { CARE_HOME } from '../../../care/routes'
import NaniLogo from '../components/NaniLogo'
import CareEpisodeFlowAnimation from '../components/CareEpisodeFlowAnimation'
import PatientLaunchModal from '../../../care/components/PatientLaunchModal'

const NANI = {
  welcome: '/brand/nani-welcome.png',
  remember: '/brand/nani-remember.png',
  followup: '/brand/nani-followup.png',
  notice: '/brand/nani-notice.png',
}

const capabilities = [
  {
    title: 'Stays across days',
    body: 'Not a chatbot you keep prompting — something that follows the arc of a single care episode with you.',
    image: NANI.remember,
  },
  {
    title: 'Labs without the scramble',
    body: 'Finding a lab, booking it, and tracking status — so the logistics don’t fall entirely on you.',
    image: NANI.followup,
  },
  {
    title: 'Notices what changed',
    body: 'Remembers prior reports and flags the difference between “you’re fine” and “this is different from last time.”',
    image: NANI.notice,
  },
]

const footerCols = [
  {
    title: 'Product',
    links: [
      { label: 'Launch app', href: '#launch' },
      { label: 'About NaniAi', href: '/' },
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

function AnimatedWords({
  text,
  style,
  delay = 0,
  as: Tag = 'span',
  reduceMotion = false,
}: {
  text: string
  style?: CSSProperties
  delay?: number
  as?: 'span' | 'strong'
  reduceMotion?: boolean
}) {
  const words = text.split(' ')
  return (
    <Tag style={{ ...style, display: 'inline' }}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: reduceMotion ? 0 : 0.42,
            delay: reduceMotion ? 0 : delay + i * 0.055,
            ease: easeOut,
          }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  )
}

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

function NaniFigure({
  src,
  alt,
  maxWidth = 360,
  float = false,
  delay = 0,
}: {
  src: string
  alt: string
  maxWidth?: number
  float?: boolean
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.img
      src={src}
      alt={alt}
      decoding="async"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      whileInView={{
        opacity: 1,
        y: float && !reduceMotion ? [0, -8, 0] : 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: 0.35 }}
      transition={
        float && !reduceMotion
          ? {
              opacity: { duration: 0.55, delay, ease: easeOut },
              scale: { duration: 0.55, delay, ease: easeOut },
              y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 },
            }
          : { duration: 0.55, delay, ease: easeOut }
      }
      style={{
        display: 'block',
        width: '100%',
        maxWidth,
        height: 'auto',
        margin: '0 auto',
        objectFit: 'contain',
        background: 'transparent',
        filter: 'drop-shadow(0 18px 32px rgba(10, 10, 92, 0.1))',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    />
  )
}

export default function FrontPage() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const [launchOpen, setLaunchOpen] = useState(false)

  const openLaunch = () => setLaunchOpen(true)
  const handleLaunch = () => {
    setLaunchOpen(false)
    router.push(CARE_HOME)
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
      <PatientLaunchModal
        open={launchOpen}
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
        className="nani-nav-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
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
        <NaniLogo size={36} textSize={17} href="/" />

        <nav
          className="nani-nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            justifySelf: 'center',
          }}
        >
          <a href="#why" style={navLinkStyle}>
            Why Nani
          </a>
          <a href="#flow" style={navLinkStyle}>
            How it works
          </a>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'flex-end', justifySelf: 'end' }}>
          <LaunchButton primary onClick={openLaunch}>
            Launch app →
          </LaunchButton>
        </div>
      </motion.header>

      {/* Hero */}
      <section
        className="nani-hero"
        style={{
          position: 'relative',
          minHeight: 'min(90vh, 780px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, 0.95fr)',
          alignItems: 'center',
          background: `
            radial-gradient(ellipse 70% 60% at 85% 40%, rgba(62,196,192,0.16), transparent 55%),
            radial-gradient(ellipse 50% 50% at 10% 80%, rgba(26,26,232,0.08), transparent 50%),
            linear-gradient(160deg, ${LIGHT_BLUE} 0%, #fff 45%, #f3f6ff 100%)
          `,
          borderBottom: '1px solid #e8e8f2',
        }}
      >
        <div
          style={{
            padding: `clamp(48px, 8vh, 88px) ${padX}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.p
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            style={{
              fontFamily: monoFont,
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: NAVY,
              margin: '0 0 18px',
            }}
          >
            <span style={{ color: BLUE }}>Nani</span>Ai
          </motion.p>
          <h1
            style={{
              fontSize: 'clamp(34px, 5.2vw, 54px)',
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 0 18px',
              color: NAVY,
              maxWidth: 560,
            }}
          >
            <AnimatedWords text="Care that follows up," delay={0.15} reduceMotion={!!reduceMotion} />
            <br />
            <AnimatedWords
              text="like family would."
              delay={0.42}
              as="strong"
              reduceMotion={!!reduceMotion}
              style={{ fontWeight: 600, color: BLUE }}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: easeOut }}
            style={{
              fontSize: 'clamp(15px, 1.6vw, 18px)',
              lineHeight: 1.65,
              color: '#4a4a78',
              margin: '0 0 30px',
              maxWidth: 440,
            }}
          >
            Upload a prescription. NaniAi handles the rest — labs, waiting, and knowing when
            something’s changed.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 1, ease: easeOut }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          >
            <LaunchButton primary onClick={openLaunch}>
              Launch app →
            </LaunchButton>
            <a href="#why" style={secondaryLinkStyle}>
              Why we built this
            </a>
          </motion.div>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.65, delay: 0.4, ease: easeOut }}
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
            padding: `32px ${padX} 48px 12px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: easeOut }}
            style={{
              position: 'absolute',
              width: '72%',
              aspectRatio: '1',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(26,26,232,0.12) 0%, transparent 68%)`,
              top: '12%',
              right: '8%',
            }}
          />
          <motion.div
            aria-hidden
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: easeOut }}
            style={{
              position: 'absolute',
              top: '8%',
              right: '6%',
              width: 120,
              height: 120,
              background: BLUE,
              borderRadius: 20,
              opacity: 0.9,
            }}
          />
          <motion.div
            aria-hidden
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.08, ease: easeOut }}
            style={{
              position: 'absolute',
              bottom: '14%',
              right: '18%',
              width: 88,
              height: 88,
              background: TEAL,
              borderRadius: 16,
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
            <NaniFigure src={NANI.welcome} alt="NaniAi waving hello" maxWidth={440} float />
          </div>
        </div>
      </section>

      {/* Why Nani — split with remember scene */}
      <section
        id="why"
        className="nani-split"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(0, 1.1fr)',
          alignItems: 'center',
          gap: 0,
          borderBottom: '1px solid #e8e8f2',
          background: '#fff',
        }}
      >
        <div
          style={{
            background: `linear-gradient(200deg, #eef6ff 0%, ${LIGHT_BLUE} 100%)`,
            padding: `56px ${padX}`,
            minHeight: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NaniFigure src={NANI.remember} alt="NaniAi remembering your care history" maxWidth={320} />
        </div>
        <div style={{ padding: `64px ${padX}` }}>
          <SectionLabel>Why Nani</SectionLabel>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{
              fontSize: 'clamp(26px, 3.4vw, 36px)',
              fontWeight: 300,
              margin: '0 0 22px',
              letterSpacing: '-0.02em',
              maxWidth: 520,
              lineHeight: 1.25,
            }}
          >
            Grandmother. The person who remembers without being asked.
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 540 }}
          >
            <motion.p variants={fadeUp} style={bodyCopy}>
              Healthcare doesn’t end when you walk out of the doctor’s office — it just goes quiet.
              You’re handed a prescription, and from that moment on everything is on you: labs,
              waiting, remembering last month’s numbers.
            </motion.p>
            <motion.p variants={fadeUp} style={bodyCopy}>
              We kept coming back to one word: <strong style={{ color: NAVY }}>Nani</strong>. Someone
              who checks in without making it a big deal — and knows when something is different from
              last time.
            </motion.p>
          </motion.div>
        </div>
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
                fontSize: 'clamp(26px, 3.4vw, 34px)',
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

        <CareEpisodeFlowAnimation />
      </section>

      {/* Capabilities with portraits */}
      <section style={{ padding: `72px ${padX}`, borderBottom: '1px solid #e8e8f2' }}>
        <SectionLabel>What NaniAi does</SectionLabel>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            fontSize: 'clamp(26px, 3.4vw, 34px)',
            fontWeight: 300,
            margin: '0 0 40px',
            letterSpacing: '-0.02em',
            maxWidth: 560,
          }}
        >
          From prescription to knowing what changed.
        </motion.h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
            maxWidth: 1080,
          }}
        >
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: easeOut }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  height: 160,
                  borderRadius: 12,
                  background: LIGHT_BLUE,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderBottom: `3px solid ${i === 1 ? TEAL : BLUE}`,
                }}
              >
                <img
                  src={c.image}
                  alt=""
                  style={{ height: 148, width: 'auto', maxWidth: '90%', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{c.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#4a4a78', margin: 0 }}>{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Closing CTA band with follow-up Nani */}
      <section
        className="nani-cta"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 0.75fr) minmax(0, 1.25fr)',
          alignItems: 'center',
          background: `linear-gradient(125deg, ${NAVY} 0%, #16168f 50%, ${BLUE} 100%)`,
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: `40px ${padX}`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <motion.img
            src={NANI.followup}
            alt=""
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: easeOut }}
            style={{
              width: '100%',
              maxWidth: 280,
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.25))',
            }}
          />
        </div>
        <div style={{ padding: `56px ${padX} 56px 12px`, position: 'relative' }}>
          {!reduceMotion && (
            <motion.div
              aria-hidden
              animate={{ x: ['-30%', '130%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                pointerEvents: 'none',
              }}
            />
          )}
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 12px',
              position: 'relative',
            }}
          >
            Ready when you are
          </p>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.6vw, 40px)',
              fontWeight: 300,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
              position: 'relative',
            }}
          >
            Start with one prescription.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.75)',
              margin: '0 0 26px',
              maxWidth: 420,
              position: 'relative',
            }}
          >
            NaniAi watches the rest of the arc — and only speaks up when something actually matters.
          </p>
          <motion.button
            type="button"
            onClick={openLaunch}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
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
        </div>
      </section>

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
            <NaniLogo size={48} textSize={18} href="/" />
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
                      <button type="button" onClick={openLaunch} style={footerBtn}>
                        {link.label}
                      </button>
                    ) : (
                      <Link href={link.href} style={footerLink}>
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
        @media (max-width: 900px) {
          .nani-hero,
          .nani-split,
          .nani-cta {
            grid-template-columns: 1fr !important;
          }
          .nani-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 720px) {
          .nani-nav-header {
            grid-template-columns: 1fr auto !important;
          }
          .nani-nav-links {
            display: none !important;
          }
        }
        @media (max-width: 520px) {
          .nani-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

const navLinkStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: MUTED,
  textDecoration: 'none',
}

const secondaryLinkStyle: CSSProperties = {
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
}

const bodyCopy: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
  color: '#4a4a78',
  margin: 0,
}

const footerLink: CSSProperties = {
  fontSize: 14,
  color: NAVY,
  textDecoration: 'none',
  opacity: 0.85,
}

const footerBtn: CSSProperties = {
  fontSize: 14,
  color: NAVY,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  opacity: 0.85,
  fontFamily: sansFont,
}
