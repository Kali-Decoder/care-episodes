'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'
import { MEDLIFESIM_DISCLAIMER } from '../../../shared/disclaimer'

const vitals = [
  { label: 'Setting', value: 'On-device' },
  { label: 'Model', value: 'QVAC MedPsy' },
  { label: 'Data', value: 'Never leaves device' },
  { label: 'Intent', value: 'Inform, not diagnose' },
]

const pathway = [
  {
    code: 'Sx',
    step: 'Subject',
    clinical: 'Cohort',
    detail: 'Trauma bay, pediatric asthma, adults 65+, antenatal clinic.',
  },
  {
    code: 'Ex',
    step: 'Exposure',
    clinical: 'Precipitant',
    detail: 'Incompatible transfusion, PM2.5, heat wave, nosocomial contact.',
  },
  {
    code: 'Ix',
    step: 'Intervention',
    clinical: 'Order set',
    detail: 'IV fluids, HEPA, hydration protocol, isolation, exchange transfusion.',
  },
]

const capabilities = [
  {
    code: 'Hx',
    title: 'Consult',
    body: 'Chart-style chat with a local medical model. Streaming replies stay on this machine — no cloud consult.',
    href: '/chat',
    cta: 'Open consult',
  },
  {
    code: 'Sim',
    title: 'Differential pathways',
    body: 'Enumerate Subject × Exposure × Intervention and score each path for risk, severe-case rate, and uncertainty.',
    href: '/start-simulation',
    cta: 'Open canvas',
  },
  {
    code: 'Rx',
    title: 'Attending report',
    body: 'Best / worst intervention, per-subject risk, key drivers, and recommendations. Export the note; translate locally.',
    href: '/recent-simulations',
    cta: 'View reports',
  },
  {
    code: 'Dx',
    title: 'Private fine-tune',
    body: 'SFT on your own simulation outcomes and clinic notes. Bind a LoRA adapter without sending PHI off-device.',
    href: '/training',
    cta: 'Open training',
  },
]

const encounters = [
  {
    id: 'ENC-04.12',
    setting: 'ED · Trauma',
    chief: 'Incompatible transfusion',
    note: 'Compare no-rescue vs IV fluid vs exchange vs organ support on trauma vs emergency cohorts.',
  },
  {
    id: 'ENC-07.18',
    setting: 'Pediatrics · School',
    chief: 'PM2.5-triggered asthma',
    note: 'Recess exposure, classroom HEPA, PE schedule changes — risk stratified for ages 7–12.',
  },
  {
    id: 'ENC-08.02',
    setting: 'Geriatrics · Community',
    chief: 'Heat-wave syncope risk',
    note: 'Outdoor heat plus limited cooling access; hydration outreach vs cooling-center protocol.',
  },
  {
    id: 'ENC-11.09',
    setting: 'Occupational · Ward',
    chief: 'Secondhand smoke COPD',
    note: 'Shared indoor air, N95 vs policy vs ventilation — pathway comparison for shift workers.',
  },
]

function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <p
      style={{
        fontFamily: monoFont,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.04em',
        color: NAVY,
        margin: 0,
      }}
    >
      <span style={{ color: BLUE }}>MedLife</span>Sim
    </p>
  )
}

function CtaLink({
  href,
  children,
  primary,
}: {
  href: string
  children: string
  primary?: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.span
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        style={{
          display: 'inline-block',
          padding: primary ? '11px 20px' : '10px 16px',
          background: primary ? BLUE : '#fff',
          color: primary ? '#fff' : NAVY,
          border: primary ? 'none' : '1px solid #e0e0f0',
          borderRadius: 6,
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </motion.span>
    </Link>
  )
}

function PulseTrace() {
  return (
    <svg
      viewBox="0 0 420 88"
      width="100%"
      height="88"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M0 44 H48 L58 44 L66 12 L78 76 L88 44 H140 L148 44 L156 28 L168 60 L176 44 H260 L270 44 L278 8 L292 80 L304 44 H420"
        fill="none"
        stroke={TEAL}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="square"
      />
      <path
        d="M0 44 H420"
        fill="none"
        stroke={BLUE}
        strokeOpacity="0.12"
        strokeWidth="1"
      />
    </svg>
  )
}

function CrossMark() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        width: 18,
        height: 18,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 7,
          top: 2,
          width: 4,
          height: 14,
          background: TEAL,
          borderRadius: 1,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 2,
          top: 7,
          width: 14,
          height: 4,
          background: TEAL,
          borderRadius: 1,
        }}
      />
    </span>
  )
}

export default function FrontPage() {
  return (
    <div
      style={{
        fontFamily: sansFont,
        background: '#fff',
        minHeight: '100vh',
        color: NAVY,
      }}
    >
      <div style={{ height: 3, background: TEAL }} />

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 48px',
          borderBottom: '1px solid #e0e0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CrossMark />
          <Wordmark />
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: MUTED,
              border: '1px solid #e0e0f0',
              borderRadius: 4,
              padding: '3px 7px',
            }}
          >
            Clinical sandbox
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {[
            { href: '/chat', label: 'Consult' },
            { href: '/start-simulation', label: 'Rounds' },
            { href: '/dashboard', label: 'Chart' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: MUTED,
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
          <CtaLink href="/dashboard" primary>
            Begin rounds →
          </CtaLink>
        </nav>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          minHeight: 520,
          borderBottom: '1px solid #e0e0f0',
        }}
      >
        <div style={{ padding: '64px 48px 56px', position: 'relative' }}>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.2em',
              color: MUTED,
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Local inference · No PHI egress
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              fontSize: 44,
              fontWeight: 300,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              margin: '0 0 18px',
              color: NAVY,
              maxWidth: 520,
            }}
          >
            Rehearse the
            <br />
            <strong style={{ fontWeight: 600 }}>clinical pathway</strong>
            <br />
            before the ward does.
          </motion.h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: '#4a4a78',
              margin: '0 0 28px',
              maxWidth: 460,
            }}
          >
            Stratify risk across cohorts, precipitants, and order sets with QVAC MedPsy —
            entirely on-device. Built for education and planning, never as a diagnosis.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CtaLink href="/start-simulation" primary>
              New encounter →
            </CtaLink>
            <CtaLink href="/chat">Open consult</CtaLink>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 3,
              height: 72,
              background: TEAL,
            }}
          />
        </div>

        <div
          style={{
            background: LIGHT_BLUE,
            borderLeft: '1px solid #e0e0f0',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 140,
              height: 90,
              background: BLUE,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 90,
              right: 0,
              width: 88,
              height: 72,
              background: TEAL,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: MUTED,
                margin: '0 0 6px',
              }}
            >
              Monitor
            </p>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                color: NAVY,
                margin: '0 0 8px',
              }}
            >
              Lead II · mock trace
            </p>
            <PulseTrace />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
              background: '#e0e0f0',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              overflow: 'hidden',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {vitals.map((v) => (
              <div key={v.label} style={{ background: '#fff', padding: '14px 16px' }}>
                <p
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    margin: '0 0 6px',
                  }}
                >
                  {v.label}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: NAVY,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {v.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '56px 48px', borderBottom: '1px solid #e0e0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 28 }}>
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.18em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              Protocol
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 300, margin: 0, letterSpacing: '-0.02em' }}>
              One order set. Every branch scored.
            </h2>
          </div>
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: MUTED,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Sx → Ex → Ix
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 12px 1fr 12px 1fr', alignItems: 'stretch' }}>
          {pathway.map((item, i) => (
            <div key={item.step} style={{ display: 'contents' }}>
              <div
                style={{
                  border: '1px solid #e0e0f0',
                  borderRadius: 8,
                  padding: '22px 22px 24px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: '#fff',
                      background: i === 1 ? TEAL : BLUE,
                      borderRadius: 4,
                      padding: '3px 8px',
                    }}
                  >
                    {item.code}
                  </span>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: MUTED,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.clinical}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>{item.step}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: '#4a4a78', margin: 0 }}>{item.detail}</p>
              </div>
              {i < pathway.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: monoFont,
                    fontSize: 14,
                    color: TEAL,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: LIGHT_BLUE, padding: '56px 48px', borderBottom: '1px solid #e0e0f0' }}>
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.18em',
            color: MUTED,
            textTransform: 'uppercase',
            margin: '0 0 8px',
          }}
        >
          Service lines
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 300, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
          From consult to attending note.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {capabilities.map((c) => (
            <Link key={c.code} href={c.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <motion.div
                whileHover={{ y: -2 }}
                style={{
                  background: '#fff',
                  border: '1px solid #e0e0f0',
                  borderRadius: 8,
                  padding: '22px 24px',
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <p
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: TEAL,
                    margin: '0 0 10px',
                  }}
                >
                  {c.code}
                </p>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>{c.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: '#4a4a78', margin: '0 0 16px' }}>
                  {c.body}
                </p>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: BLUE,
                  }}
                >
                  {c.cta} →
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: '56px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.18em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              Sample census
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 300, margin: 0, letterSpacing: '-0.02em' }}>
              Encounters you can run today.
            </h2>
          </div>
          <CtaLink href="/start-simulation">Open canvas</CtaLink>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {encounters.map((e) => (
            <article
              key={e.id}
              style={{
                border: '1px solid #e0e0f0',
                borderRadius: 8,
                padding: '20px 20px 22px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 200,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    color: MUTED,
                  }}
                >
                  {e.id}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: 6, background: TEAL, marginTop: 3 }} />
              </div>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: BLUE,
                  margin: '0 0 8px',
                }}
              >
                {e.setting}
              </p>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', lineHeight: 1.35 }}>
                {e.chief}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#4a4a78', margin: 0, flex: 1 }}>{e.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer
        style={{
          borderTop: '1px solid #e0e0f0',
          padding: '28px 48px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
          background: LIGHT_BLUE,
        }}
      >
        <div style={{ display: 'flex', gap: 12, maxWidth: 560 }}>
          <CrossMark />
          <div>
            <Wordmark size={15} />
            <p style={{ fontSize: 12, color: MUTED, margin: '8px 0 0', lineHeight: 1.55 }}>
              {MEDLIFESIM_DISCLAIMER.title}. {MEDLIFESIM_DISCLAIMER.body}
            </p>
          </div>
        </div>
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: 0,
            alignSelf: 'flex-end',
          }}
        >
          Not for clinical decision support
        </p>
      </footer>
    </div>
  )
}
