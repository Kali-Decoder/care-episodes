/**
 * Pure aggregator for the simulation report. Takes a list of outcomes +
 * their parsed reports and returns deterministic best/worst-performer
 * stats and a list of pre-rendered executive-summary bullets.
 *
 * Used by the Phase 1 report to derive an "Executive Summary" without
 * an extra AI call. Phase 2 may replace this with a real aggregate
 * prompt; the public shape is stable.
 */

import type { SimulationOutcome } from '../preload/simulation'
import type { ParsedOutcomeReport } from './outcomeParser'

export interface InterventionStat {
  id: string
  title: string
  avgRisk: number
  sampleSize: number
}

export interface SubjectStat {
  id: string
  title: string
  avgRisk: number
  sampleSize: number
}

export interface ReportAggregate {
  totalPaths: number
  completed: number
  errored: number
  bestIntervention: InterventionStat | null
  worstIntervention: InterventionStat | null
  perSubject: SubjectStat[]
  /** Pre-rendered, ready-to-display summary lines. */
  bullets: string[]
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

/**
 * Build a placement-id → card lookup from the canvas so the aggregator
 * can resolve a subject's `placementId` to its `title` (the AI sees
 * titles, not ids).
 */

export function aggregateOutcomes(
  outcomes: SimulationOutcome[],
  reports: Map<string, ParsedOutcomeReport | null>
): ReportAggregate {
  const totalPaths = outcomes.length
  const completed = outcomes.filter((o) => o.status === 'done').length
  const errored = outcomes.filter((o) => o.status === 'error').length

  // Per-intervention average risk.
  const byIntervention = new Map<string, { title: string; risks: number[] }>()
  // Per-subject average risk, keyed by subject title (the AI labels
  // are unique within a single canvas in practice).
  const bySubject = new Map<string, { title: string; risks: number[] }>()

  for (const o of outcomes) {
    if (o.status !== 'done') continue
    const r = reports.get(o.id)
    if (!r || r.risk === null) continue
    const intvTitle = o.pathLabels.intervention
    const intvKey = o.interventionId || intvTitle
    if (!byIntervention.has(intvKey)) {
      byIntervention.set(intvKey, { title: intvTitle, risks: [] })
    }
    byIntervention.get(intvKey)!.risks.push(r.risk)

    const subjTitle = o.pathLabels.subject
    const subjKey = subjTitle
    if (!bySubject.has(subjKey)) {
      bySubject.set(subjKey, { title: subjTitle, risks: [] })
    }
    bySubject.get(subjKey)!.risks.push(r.risk)
  }

  const interventionStats: InterventionStat[] = Array.from(
    byIntervention.entries()
  ).map(([id, { title, risks }]) => ({
    id,
    title,
    avgRisk: round1(average(risks)),
    sampleSize: risks.length,
  }))

  const subjectStats: SubjectStat[] = Array.from(
    bySubject.entries()
  ).map(([id, { title, risks }]) => ({
    id,
    title,
    avgRisk: round1(average(risks)),
    sampleSize: risks.length,
  }))

  // Best = lowest avg risk, worst = highest.
  const sorted = [...interventionStats].sort((a, b) => a.avgRisk - b.avgRisk)
  const bestIntervention = sorted[0] ?? null
  const worstIntervention = sorted[sorted.length - 1] ?? null

  // Pre-render executive-summary bullets.
  const bullets: string[] = []
  bullets.push(
    `${completed} of ${totalPaths} path${totalPaths === 1 ? '' : 's'} complete${
      errored > 0 ? `, ${errored} errored` : ''
    }.`
  )
  if (bestIntervention && worstIntervention && bestIntervention.id !== worstIntervention.id) {
    bullets.push(
      `Lowest average risk: ${bestIntervention.title} (${bestIntervention.avgRisk}%, n=${bestIntervention.sampleSize}).`
    )
    bullets.push(
      `Highest average risk: ${worstIntervention.title} (${worstIntervention.avgRisk}%, n=${worstIntervention.sampleSize}).`
    )
  } else if (bestIntervention) {
    bullets.push(
      `Average risk across all completed outcomes: ${bestIntervention.avgRisk}% (n=${bestIntervention.sampleSize}).`
    )
  } else {
    bullets.push('No parsed risk data available yet — outcomes are still running.')
  }
  if (subjectStats.length > 0) {
    const subjSorted = [...subjectStats].sort((a, b) => a.avgRisk - b.avgRisk)
    const safest = subjSorted[0]
    const riskiest = subjSorted[subjSorted.length - 1]
    if (
      safest &&
      riskiest &&
      safest.id !== riskiest.id
    ) {
      bullets.push(
        `Lowest-risk subject: ${safest.title} (${safest.avgRisk}%). Highest-risk subject: ${riskiest.title} (${riskiest.avgRisk}%).`
      )
    }
  }

  return {
    totalPaths,
    completed,
    errored,
    bestIntervention,
    worstIntervention,
    perSubject: subjectStats.sort((a, b) => a.title.localeCompare(b.title)),
    bullets,
  }
}
