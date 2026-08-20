import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/PageWrapper'
import TranslationPicker from '../components/TranslationPicker'
import { useProfile } from '../context/ProfileContext'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import StatusPill, { STATUS_COLOR, STATUS_LABEL } from '../components/ui/StatusPill'
import { riskColor } from '../utils/risk'
import type { ParsedOutcomeReport } from '../../../shared/outcomeParser'
import type { ReportAggregate } from '../../../shared/outcomeReport'
import type {
  SimulationOutcome,
  SimulationParent,
} from '../../../preload/simulation'
import type { SupportedTargetLang } from '../../../preload/index.d'
import { MEDLIFESIM_DISCLAIMER } from '../../../shared/disclaimer'

interface ReportResponse {
  sim: SimulationParent
  outcomes: SimulationOutcome[]
  reports: Record<string, ParsedOutcomeReport | null>
  aggregate: ReportAggregate
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function SimulationReport() {
  const { simId } = useParams<{ simId: string }>()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelName, setModelName] = useState<string | null>(null)
  const [loraName, setLoraName] = useState<string | null>(null)
  // In-place translation state. `translateTo` records the user's
  // current pick (or `null` for "show original"); `translatedData`
  // is the overlay applied on top of the original `data` so the
  // page re-renders in the chosen language. `translating` flips to
  // true while the IPC is in flight — it drives the spinner's
  // label and the "block re-pick" prop on the picker.
  const [translateTo, setTranslateTo] = useState<SupportedTargetLang | null>(null)
  const [translatedData, setTranslatedData] = useState<ReportResponse | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [supportedLangs, setSupportedLangs] = useState<Array<{ code: SupportedTargetLang; label: string }>>([])

  useEffect(() => {
    let cancelled = false
    // Fetch the supported-language list once on mount — used for the
    // "Translated to <label>" pill in the report header.
    window.api.translation.supportedLanguages().then((langs) => {
      if (!cancelled) setSupportedLangs(langs)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile || !simId) return
      setLoading(true)
      setError(null)
      try {
        const r = await window.api.simulations.getReport(profile.id, simId)
        if (!cancelled) setData(r)
        // Fetch the model name in parallel for the report footer. We use the
        // model active at report-load time (matches the user's intent — the
        // footer reflects "what model was running when the user opened this
        // report", not the model that produced the outcomes).
        try {
          const status = await window.api.models.status()
          if (!cancelled) {
            setModelName(status?.active?.name || null)
            setLoraName(status?.activeLora?.name ?? null)
          }
        } catch {
          if (!cancelled) {
            setModelName(null)
            setLoraName(null)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [profile, simId])

  /**
   * Translate handler — called when the user picks a non-`null`
   * language in the Translate popover. `null` (= "Show original")
   * is handled inline in the page (just clears the overlay).
   *
   * On success, sets `translateTo` to the new language and
   * `translatedData` to the Bergamot result. On failure, surfaces
   * the error and reverts `translateTo` so the page stays English.
   */
  const handleTranslate = async (lang: SupportedTargetLang) => {
    if (!profile || !simId) return
    setTranslateError(null)
    setTranslating(true)
    setTranslateTo(lang)
    try {
      const result = await window.api.simulations.translateReport(
        profile.id,
        simId,
        lang,
      )
      setTranslatedData(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setTranslateError(msg)
      // Revert: page stays in English.
      setTranslateTo(null)
      setTranslatedData(null)
    } finally {
      setTranslating(false)
    }
  }

  const handleShowOriginal = () => {
    setTranslateError(null)
    setTranslateTo(null)
    setTranslatedData(null)
  }

  // Group outcomes by subject for the per-subject accordion.
  const outcomesBySubject = useMemo(() => {
    if (!data) return new Map<string, SimulationOutcome[]>()
    const m = new Map<string, SimulationOutcome[]>()
    for (const o of data.outcomes) {
      // Skip errored outcomes from the per-subject section — they have
      // no parsed data and would just show empty accordions.
      if (o.status !== 'done') continue
      // Group by subject title — unique within a single canvas in practice.
      const key = o.pathLabels.subject
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(o)
    }
    return m
  }, [data])

  if (!profile) {
    return (
      <PageWrapper title="Report" category="Simulation">
        <div style={{ padding: 24, color: MUTED, fontFamily: sansFont }}>
          Select a profile to view this report.
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Simulation report"
      category="MedLifeSim"
      buttons={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TranslateButton
            value={translateTo}
            translating={translating}
            onTranslate={handleTranslate}
            onShowOriginal={handleShowOriginal}
          />
          <ExportButton
            profileId={profile.id}
            simId={simId ?? ''}
            displayData={data ? (translatedData ?? data) : null}
          />
          <button
            onClick={() => navigate('/recent-simulations')}
            style={{
              padding: '8px 14px',
              background: '#fff',
              color: MUTED,
              border: '1px solid #e0e0f0',
              borderRadius: 6,
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            ← Back to simulations
          </button>
        </div>
      }
    >
      {loading && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: MUTED,
            fontFamily: monoFont,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Generating report…
        </div>
      )}
      {error && (
        <div
          style={{
            padding: 16,
            background: 'rgba(200,48,48,0.08)',
            border: '1px solid #f0c0c0',
            borderRadius: 6,
            color: '#a02020',
            fontFamily: sansFont,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {!loading && !error && !data && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: MUTED,
            fontFamily: sansFont,
            fontSize: 13,
          }}
        >
          Simulation not found.
        </div>
      )}
      {/* Surface translation errors as a small inline banner at the
          top of the page. The picker button itself doesn't render
          errors; it stays focused on state. */}
      {translateError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            background: 'rgba(200,48,48,0.08)',
            border: '1px solid #f0c0c0',
            borderRadius: 6,
            color: '#a02020',
            fontFamily: sansFont,
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>Translation failed: {translateError}</span>
          <button
            type="button"
            onClick={() => setTranslateError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a02020',
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {data && (
        <ReportBody
          data={translatedData ?? data}
          outcomesBySubject={outcomesBySubject}
          modelName={modelName}
          loraName={loraName}
          translateTo={translateTo}
          translateToLabel={translateTo ? (supportedLangs.find((l) => l.code === translateTo)?.label ?? translateTo) : null}
          onShowOriginal={handleShowOriginal}
        />
      )}
    </PageWrapper>
  )
}

function ReportBody({
  data,
  outcomesBySubject,
  modelName,
  loraName,
  translateTo,
  translateToLabel,
  onShowOriginal,
}: {
  data: ReportResponse
  outcomesBySubject: Map<string, SimulationOutcome[]>
  modelName: string | null
  loraName: string | null
  translateTo: SupportedTargetLang | null
  translateToLabel: string | null
  /** Click handler for the "Translated to {label}" pill — clears the overlay. */
  onShowOriginal: () => void
}) {
  const { sim, outcomes, reports, aggregate } = data
  const statusColor = STATUS_COLOR[sim.status]
  const statusLabel = STATUS_LABEL[sim.status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 2px 8px rgba(10,10,92,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 6,
              }}
            >
              {formatDate(sim.createdAt)}
            </p>
            <h2
              style={{
                fontFamily: sansFont,
                fontSize: 22,
                fontWeight: 400,
                color: '#1a1a2e',
                margin: 0,
              }}
            >
              {sim.name}
            </h2>
            {translateTo && (
              <button
                type="button"
                onClick={onShowOriginal}
                title="Click to show the original (English) report"
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  padding: '2px 8px',
                  background: '#dffaf3',
                  color: TEAL,
                  border: '1px solid #a0e8d5',
                  borderRadius: 999,
                  fontFamily: monoFont,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#bff5e6'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#dffaf3'
                }}
              >
                Show original · Translated to {translateToLabel}
              </button>
            )}
            {sim.description && (
              <p
                style={{
                  fontFamily: sansFont,
                  fontSize: 13,
                  color: NAVY,
                  margin: '8px 0 0 0',
                  lineHeight: 1.55,
                  maxWidth: 720,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {sim.description}
              </p>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            <StatusPill color={statusColor}>{statusLabel}</StatusPill>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                color: MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {sim.completedCount} / {sim.outcomeCount} complete
              {sim.errorCount > 0 && (
                <span style={{ color: '#c83030', marginLeft: 6 }}>
                  ({sim.errorCount} err)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <Section
        eyebrow="01"
        title="Executive Summary"
        caption="auto-derived from per-outcome reports"
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 8,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {aggregate.bullets.map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: sansFont,
                fontSize: 14,
                color: NAVY,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {line}
            </p>
          ))}
          {aggregate.bestIntervention && aggregate.worstIntervention && (
            <table
              style={{
                width: '100%',
                marginTop: 8,
                borderCollapse: 'collapse',
                fontFamily: sansFont,
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={miniTh}>Intervention</th>
                  <th style={{ ...miniTh, textAlign: 'right' }}>Avg Risk</th>
                  <th style={{ ...miniTh, textAlign: 'right' }}>n</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={miniTd}>
                    <span style={{ color: TEAL, fontWeight: 600 }}>Best · </span>
                    {aggregate.bestIntervention.title}
                  </td>
                  <td style={{ ...miniTd, textAlign: 'right' }}>
                    {aggregate.bestIntervention.avgRisk}%
                  </td>
                  <td style={{ ...miniTd, textAlign: 'right' }}>
                    {aggregate.bestIntervention.sampleSize}
                  </td>
                </tr>
                <tr>
                  <td style={miniTd}>
                    <span style={{ color: '#c83030', fontWeight: 600 }}>Worst · </span>
                    {aggregate.worstIntervention.title}
                  </td>
                  <td style={{ ...miniTd, textAlign: 'right' }}>
                    {aggregate.worstIntervention.avgRisk}%
                  </td>
                  <td style={{ ...miniTd, textAlign: 'right' }}>
                    {aggregate.worstIntervention.sampleSize}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* Section 2: Comparison Dashboard */}
      <Section eyebrow="02" title="Comparison Dashboard">
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sansFont, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Exposure</th>
                <th style={thStyle}>Intervention</th>
                <th style={thStyle}>Risk %</th>
                <th style={thStyle}>Severe %</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o, i) => {
                const r = reports[o.id]
                const isDone = o.status === 'done'
                return (
                  <tr
                    key={o.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafaff' }}
                  >
                    <td style={tdStyle}>{o.pathLabels.subject}</td>
                    <td style={tdStyle}>{o.pathLabels.exposure}</td>
                    <td style={tdStyle}>{o.pathLabels.intervention}</td>
                    <td style={tdStyle}>
                      <RiskBar
                        value={isDone && r ? r.risk : null}
                        range={isDone && r ? r.riskRange : null}
                      />
                    </td>
                    <td style={tdStyle}>
                      <RiskBar
                        value={isDone && r ? r.severeCaseRate : null}
                        range={isDone && r ? r.severeCaseRateRange : null}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {isDone ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: TEAL + '22',
                            color: TEAL,
                            borderRadius: 999,
                            fontFamily: monoFont,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Done
                        </span>
                      ) : o.status === 'error' ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: '#c8303022',
                            color: '#c83030',
                            borderRadius: 999,
                            fontFamily: monoFont,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Error
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: MUTED + '22',
                            color: MUTED,
                            borderRadius: 999,
                            fontFamily: monoFont,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Awaiting AI
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Section 3: Risk Breakdown */}
      <Section eyebrow="03" title="Risk Breakdown">
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 8,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Average risk by intervention
            </p>
            {aggregate.perSubject.length === 0 && (
              <p style={{ fontFamily: sansFont, fontSize: 13, color: MUTED, margin: 0 }}>
                No parsed risk data yet.
              </p>
            )}
            {aggregate.bestIntervention && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from(
                  new Map(
                    outcomes
                      .filter((o) => o.status === 'done' && reports[o.id]?.risk !== null)
                      .map((o) => [
                        o.interventionId || o.pathLabels.intervention,
                        {
                          title: o.pathLabels.intervention,
                          risks: [] as number[],
                        },
                      ])
                  ).values()
                )
                  .map((group, idx) => {
                    // Recompute the bucket inline so we can show it.
                    const id = (outcomes.find(
                      (o) =>
                        o.status === 'done' &&
                        (o.interventionId || o.pathLabels.intervention) ===
                          // find the matching one (first hit)
                          (outcomes
                            .filter((x) => x.status === 'done' && reports[x.id]?.risk !== null)
                            .map((x) => x.interventionId || x.pathLabels.intervention)[idx] ?? '')
                    )?.interventionId) || group.title
                    const sameId = outcomes.filter(
                      (o) =>
                        o.status === 'done' &&
                        (o.interventionId || o.pathLabels.intervention) === id
                    )
                    const risks = sameId
                      .map((o) => reports[o.id]?.risk)
                      .filter((v): v is number => v !== null && v !== undefined)
                    if (risks.length === 0) return null
                    const avg = risks.reduce((a, b) => a + b, 0) / risks.length
                    return (
                      <div
                        key={id}
                        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <span
                          style={{
                            fontFamily: sansFont,
                            fontSize: 12,
                            color: NAVY,
                            minWidth: 160,
                          }}
                          title={group.title}
                        >
                          {group.title}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 12,
                            background: '#f0f0f8',
                            borderRadius: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, avg))}%` }}
                            transition={{ duration: 0.4 }}
                            style={{
                              height: '100%',
                              background: riskColor(avg),
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: monoFont,
                            fontSize: 11,
                            color: NAVY,
                            minWidth: 60,
                            textAlign: 'right',
                          }}
                        >
                        {avg.toFixed(1)}% (n={risks.length})
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.14em',
                color: MUTED,
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Average risk by subject
            </p>
            {aggregate.perSubject.length === 0 ? (
              <p style={{ fontFamily: sansFont, fontSize: 13, color: MUTED, margin: 0 }}>
                No parsed risk data yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aggregate.perSubject.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontFamily: sansFont,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ minWidth: 160, color: NAVY }}>{s.title}</span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: '#f0f0f8',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${s.avgRisk}%`,
                          height: '100%',
                          background: riskColor(s.avgRisk),
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 11,
                        color: MUTED,
                        minWidth: 60,
                        textAlign: 'right',
                      }}
                    >
                      {s.avgRisk}% (n={s.sampleSize})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Section 4: Individual Subject Response */}
      <Section eyebrow="04" title="Individual Subject Response">
        {outcomesBySubject.size === 0 ? (
          <div
            style={{
              padding: 24,
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              textAlign: 'center',
              color: MUTED,
              fontFamily: sansFont,
              fontSize: 13,
            }}
          >
            No completed outcomes yet — come back when the AI has finished.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from(outcomesBySubject.entries()).map(([subjKey, list]) => {
              const subjectTitle = list[0].pathLabels.subject
              return (
                <SubjectAccordion
                  key={subjKey}
                  subjectTitle={subjectTitle}
                  outcomes={list}
                  reports={reports}
                />
              )
            })}
          </div>
        )}
      </Section>

      {/* Footer: provenance + non-clinical-advice disclaimer. */}
      <footer
        style={{
          marginTop: 8,
          padding: '20px 22px',
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(10,10,92,0.04)',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontFamily: monoFont,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: NAVY,
          }}
        >
          {MEDLIFESIM_DISCLAIMER.title}
        </h4>
        <p
          style={{
            margin: '6px 0 0 0',
            fontFamily: sansFont,
            fontSize: 12,
            color: MUTED,
            lineHeight: 1.55,
          }}
        >
          {MEDLIFESIM_DISCLAIMER.body}
        </p>
        <p
          style={{
            margin: '14px 0 0 0',
            paddingTop: 12,
            borderTop: '1px solid #f0f0f8',
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          Model: {modelName ?? 'Unknown'}
          {loraName && (
            <span style={{ color: TEAL, marginLeft: 4 }}>
              {' + '}
              <strong>{loraName}</strong>
            </span>
          )}
        </p>
      </footer>
    </div>
  )
}

function RiskBar({
  value,
  range,
}: {
  value: number | null
  /** [min, max] tuple when the AI used a range. The bar visualizes 0..max and the label shows "min-max%". */
  range?: [number, number] | null
}) {
  if (value === null) {
    return (
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: MUTED,
        }}
      >
        —
      </span>
    )
  }
  // When a range is present, the bar fills to the upper bound (the worst
  // case) and the label renders the full range. This conveys both the
  // central estimate and the uncertainty width at a glance.
  // Defensive sort: the parser already returns [lo, hi] but a future
  // change (or a stale parsed value from before the parser hardening)
  // could still pass a reversed tuple, in which case the label would
  // read "45–30%" with the bar filling to 30% — confusing.
  const lo = range ? Math.min(range[0], range[1]) : null
  const hi = range ? Math.max(range[0], range[1]) : null
  const safeRange = lo !== null && hi !== null ? ([lo, hi] as [number, number]) : null
  const barMax = safeRange ? safeRange[1] : value
  const barColor = safeRange ? riskColor(safeRange[1]) : riskColor(value)
  const label = safeRange ? `${safeRange[0]}\u2013${safeRange[1]}%` : `${value}%`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 6,
          background: '#f0f0f8',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barMax}%`,
            height: '100%',
            background: barColor,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          color: NAVY,
          minWidth: 38,
          textAlign: 'right',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  caption,
  children,
}: {
  eyebrow: string
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            letterSpacing: '0.18em',
          }}
        >
          {eyebrow}
        </span>
        <h3
          style={{
            fontFamily: sansFont,
            fontSize: 17,
            fontWeight: 500,
            color: '#1a1a2e',
            margin: 0,
          }}
        >
          {title}
        </h3>
        {caption && (
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              color: MUTED,
              letterSpacing: '0.10em',
            }}
          >
            {caption}
          </span>
        )}
      </header>
      {children}
    </section>
  )
}

function SubjectAccordion({
  subjectTitle,
  outcomes,
  reports,
}: {
  subjectTitle: string
  outcomes: SimulationOutcome[]
  reports: Record<string, ParsedOutcomeReport | null>
}) {
  const [open, setOpen] = useState(true)
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e0e0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: '#fafaff',
          border: 'none',
          borderBottom: open ? '1px solid #e0e0f0' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: sansFont,
          fontSize: 14,
          color: NAVY,
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        <span>{subjectTitle}</span>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            letterSpacing: '0.10em',
          }}
        >
          {open ? '▾' : '▸'} {outcomes.length} path
          {outcomes.length === 1 ? '' : 's'}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {outcomes.map((o) => {
            const r = reports[o.id]
            return (
              <div
                key={o.id}
                style={{
                  padding: '14px 18px',
                  borderTop: '1px solid #f0f0f8',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: MUTED + '22',
                        color: NAVY,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: monoFont,
                      }}
                    >
                      {o.pathLabels.exposure}
                    </span>
                    <span style={{ color: MUTED, fontFamily: monoFont, fontSize: 10 }}>→</span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: TEAL + '22',
                        color: TEAL,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: monoFont,
                      }}
                    >
                      {o.pathLabels.intervention}
                    </span>
                  </div>
                  {r && r.risk !== null && (
                    (() => {
                      // Defensive sort for the SubjectAccordion label
                      // (same reason as `RiskBar`).
                      const rLo = r.riskRange ? Math.min(r.riskRange[0], r.riskRange[1]) : null
                      const rHi = r.riskRange ? Math.max(r.riskRange[0], r.riskRange[1]) : null
                      const accBarColor = r.riskRange && rHi !== null
                        ? riskColor(rHi)
                        : riskColor(r.risk)
                      return (
                        <span
                          style={{
                            fontFamily: monoFont,
                            fontSize: 11,
                            color: accBarColor,
                            fontWeight: 600,
                          }}
                        >
                          Risk{' '}
                          {r.riskRange && rLo !== null && rHi !== null
                            ? `${rLo}\u2013${rHi}%`
                            : `${r.risk}%`}
                        </span>
                      )
                    })()
                  )}
                </div>
                {r ? (
                  <>
                    {r.summary && (
                      <p
                        style={{
                          fontFamily: sansFont,
                          fontSize: 13,
                          color: NAVY,
                          lineHeight: 1.55,
                          margin: '0 0 8px 0',
                        }}
                      >
                        {r.summary}
                      </p>
                    )}
                    {r.keyDrivers.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p
                          style={{
                            fontFamily: monoFont,
                            fontSize: 9,
                            color: MUTED,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            margin: '0 0 4px 0',
                          }}
                        >
                          Key drivers
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 18,
                            fontFamily: sansFont,
                            fontSize: 12,
                            color: NAVY,
                            lineHeight: 1.5,
                          }}
                        >
                          {r.keyDrivers.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.recommendations.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p
                          style={{
                            fontFamily: monoFont,
                            fontSize: 9,
                            color: MUTED,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            margin: '0 0 4px 0',
                          }}
                        >
                          Recommendations
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 18,
                            fontFamily: sansFont,
                            fontSize: 12,
                            color: NAVY,
                            lineHeight: 1.5,
                          }}
                        >
                          {r.recommendations.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.uncertainty && (
                      <p
                        style={{
                          fontFamily: sansFont,
                          fontSize: 11,
                          color: MUTED,
                          fontStyle: 'italic',
                          margin: '8px 0 0 0',
                        }}
                      >
                        {r.uncertainty}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    style={{
                      fontFamily: sansFont,
                      fontSize: 12,
                      color: MUTED,
                      margin: 0,
                    }}
                  >
                    No parsed data.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontFamily: monoFont,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MUTED,
  background: '#f8f8fc',
  borderBottom: '1px solid #e0e0f0',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  color: NAVY,
  verticalAlign: 'middle',
  borderBottom: '1px solid #f0f0f8',
}

const miniTh: React.CSSProperties = {
  padding: '4px 8px',
  textAlign: 'left',
  fontFamily: monoFont,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: MUTED,
  borderBottom: '1px solid #e0e0f0',
}

const miniTd: React.CSSProperties = {
  padding: '4px 8px',
  color: NAVY,
  fontFamily: sansFont,
  fontSize: 12,
}

// ─────────────────────────────── Export button ───────────────────────────

type ExportFormat = 'pdf' | 'json' | 'md' | 'csv'

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'json', label: 'JSON' },
  { id: 'md', label: 'Markdown' },
  { id: 'csv', label: 'CSV' },
]

/**
 * Small "Export ▾" button that opens a popover menu of format
 * options. Each click calls `window.api.simulations.exportReport(...)`;
 * the main process opens a save dialog, writes the file, and
 * returns the path. We surface success / error / cancel via an
 * inline toast.
 *
 * The export popover is intentionally **just** a format picker —
 * translation is now an in-place action driven by the separate
 * Translate button next to this one. The `displayData` arg is the
 * page's current view (translated or English); the writer renders
 * it as-is, with no second translation pass.
 */
function ExportButton({
  profileId,
  simId,
  displayData,
}: {
  profileId: string
  simId: string
  displayData: ReportResponse | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<ExportFormat | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Auto-dismiss the toast after 3s.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const disabled = !simId || busy !== null || !displayData

  async function pickFormat(f: ExportFormat) {
    if (disabled || !displayData) return
    setOpen(false)
    setBusy(f)
    try {
      // Forward the page's current view (translated or English) as
      // the `data` arg. The main process writes it as-is — no
      // re-fetch, no second translate pass.
      const r = await window.api.simulations.exportReport(
        profileId,
        simId,
        f,
        displayData,
      )
      if (r.ok && r.path) {
        setToast({ kind: 'ok', text: `Saved to ${r.path}` })
      } else if (r.canceled) {
        // no-op
      } else {
        setToast({ kind: 'err', text: r.error ?? 'Export failed' })
      }
    } catch (err) {
      setToast({ kind: 'err', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        style={{
          padding: '8px 14px',
          background: open ? NAVY : '#fff',
          color: open ? '#fff' : NAVY,
          border: '1px solid ' + (open ? NAVY : '#e0e0f0'),
          borderRadius: 6,
          fontFamily: monoFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {busy ? `Exporting ${busy.toUpperCase()}…` : 'Export ▾'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(10,10,92,0.10)',
            minWidth: 180,
            zIndex: 50,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pickFormat(f.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                color: NAVY,
                fontFamily: sansFont,
                fontSize: 13,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = BLUE
                ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = NAVY
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            padding: '10px 14px',
            background: toast.kind === 'ok' ? TEAL : '#c83030',
            color: '#fff',
            borderRadius: 6,
            fontFamily: sansFont,
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            zIndex: 200,
            maxWidth: 480,
            wordBreak: 'break-all',
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}

// ───────────────────────────── Translate button ───────────────────────────

/**
 * Thin wrapper around `TranslationPicker` that lives in the report
 * header next to `ExportButton`. The picker is a pure controlled
 * component: when the user picks a non-`null` language, this
 * wrapper calls `onTranslate(lang)` (which kicks off the IPC);
 * when the user picks `null` (= "Show original"), this wrapper
 * calls `onShowOriginal()` to clear the overlay.
 *
 * The in-flight state is the parent's `translating` flag. While
 * true, the picker's label flips to "Translating to {label}…"
 * with a spinner, and re-picks are blocked.
 */
function TranslateButton({
  value,
  translating,
  onTranslate,
  onShowOriginal,
}: {
  value: SupportedTargetLang | null
  translating: boolean
  onTranslate: (lang: SupportedTargetLang) => Promise<void> | void
  onShowOriginal: () => void
}) {
  const handleChange = (next: SupportedTargetLang | null) => {
    if (next === null) {
      onShowOriginal()
    } else {
      void onTranslate(next)
    }
  }
  return (
    <TranslationPicker
      value={value}
      onChange={handleChange}
      disabled={translating}
      translating={translating}
    />
  )
}
