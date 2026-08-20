'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BLUE, TEAL, NAVY, MUTED, LIGHT_BLUE, monoFont, sansFont } from '../theme'
import { CARE_HOME } from '../../../care/routes'

const vitals = [
  { label: 'Patient', value: 'demo-patient-01' },
  { label: 'Agents', value: 'Intake · Logistics · Diagnostics' },
  { label: 'Polling', value: 'Every 3 seconds' },
  { label: 'Intent', value: 'Inform, not diagnose' },
]

const pathway = [
  {
    code: 'Rx',
    step: 'Prescription',
    clinical: 'Intake',
    detail: 'Upload a photo or PDF. The intake agent reads tests, medicines, and urgency.',
  },
  {
    code: 'Lab',
    step: 'Logistics',
    clinical: 'Booking',
    detail: 'Nearby labs shortlisted, one selected, booking emails sent — you see every step.',
  },
  {
    code: 'Dx',
    step: 'Diagnostics',
    clinical: 'Trends',
    detail: 'Report uploaded, values compared with history. Anomalies flagged in plain language.',
  },
]

const capabilities = [
  {
    code: '01',
    title: 'Upload prescription',
    body: 'Start an episode with a single upload. Watch agents extract CBC, ferritin, TSH, and more with urgency badges.',
    href: CARE_HOME,
    cta: 'Go to dashboard',
  },
  {
    code: '02',
    title: 'Live timeline',
    body: 'The timeline is the hero — every agent action and your uploads in one chronological feed.',
    href: CARE_HOME,
    cta: 'View dashboard',
  },
  {
    code: '03',
    title: 'Labs & booking',
    body: 'See shortlisted centres, selection reasons, and per-test booking status — requested, confirmed, or needs you.',
    href: CARE_HOME,
    cta: 'See labs flow',
  },
  {
    code: '04',
    title: 'Results & findings',
    body: 'Trends against prior reports, severity labels, and a patient summary — with a clear medical disclaimer.',
    href: CARE_HOME,
    cta: 'Explore findings',
  },
]

const episodeStates = [
  {
    id: '01',
    state: 'PRESCRIPTION_RECEIVED',
    label: 'Reading prescription',
    note: 'Spinner while intake agent parses your upload.',
  },
  {
    id: '02',
    state: 'LABS_SHORTLISTED',
    label: 'Labs found',
    note: 'Four nearby centres — one selected with a plain-language reason.',
  },
  {
    id: '03',
    state: 'AWAITING_REPORT',
    label: 'Waiting for results',
    note: 'Booking confirmed. Days elapsed shown while you wait.',
  },
  {
    id: '04',
    state: 'ANOMALY_FOUND',
    label: 'Meaningful change',
    note: 'Haemoglobin falling across three reports — consult suggested.',
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
      <span style={{ color: BLUE }}>Care</span> Episode Agent
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
            Patient view
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Link
            href={CARE_HOME}
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: MUTED,
              textDecoration: 'none',
            }}
          >
            Dashboard
          </Link>
          <CtaLink href={CARE_HOME} primary>
            Start an episode →
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
            Prescription → labs → results → findings
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
            Your care episode,
            <br />
            <strong style={{ fontWeight: 600 }}>step by step</strong>
            <br />
            in plain language.
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
            Upload a prescription and follow AI agents as they identify tests, book labs,
            wait for results, compare trends, and explain what changed — with a timeline you can trust.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CtaLink href={CARE_HOME} primary>
              Go to dashboard →
            </CtaLink>
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
              Episode monitor
            </p>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                color: NAVY,
                margin: '0 0 8px',
              }}
            >
              Haemoglobin trend · 3 prior reports
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
              Episode flow
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 300, margin: 0, letterSpacing: '-0.02em' }}>
              One upload. Agents handle the rest.
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
            Rx → Lab → Dx
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
          What you see
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 300, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
          From upload to attending summary.
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
              Episode states
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 300, margin: 0, letterSpacing: '-0.02em' }}>
              Twelve states. Every one handled.
            </h2>
          </div>
          <CtaLink href={CARE_HOME}>Open dashboard</CtaLink>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {episodeStates.map((e) => (
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
                {e.state.replace(/_/g, ' ')}
              </p>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px', lineHeight: 1.35 }}>
                {e.label}
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
              This is not medical advice. A doctor should review your results. Built for demonstration —
              agents explain trends and flag changes; they do not diagnose or prescribe.
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
