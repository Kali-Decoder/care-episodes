/**
 * Pure markdown parser for the AI's per-outcome response.
 *
 * The worker prompts the model to return six `## HEADING` sections:
 *   SUMMARY, RISK, SEVERE_CASE_RATE, KEY_DRIVERS, RECOMMENDATIONS, UNCERTAINTY
 *
 * This module splits the body on those headings and returns a structured
 * object. Missing or malformed fields degrade gracefully to `null` /
 * empty arrays / empty strings so the report UI can render
 * "Awaiting AI" placeholders.
 *
 * Pure — no DOM, no IPC, no side effects. Safe to import from both the
 * main process (for the upcoming getReport handler) and the renderer.
 */

export type OutcomeSectionKey =
  | 'SUMMARY'
  | 'RISK'
  | 'SEVERE_CASE_RATE'
  | 'KEY_DRIVERS'
  | 'RECOMMENDATIONS'
  | 'UNCERTAINTY'

export interface ParsedOutcomeReport {
  summary: string
  /** Central estimate: mean of the range when one was detected, single integer otherwise. */
  risk: number | null
  severeCaseRate: number | null
  /** [min, max] tuple when the AI used a range like "30-45%"; null for single integers or no data. */
  riskRange: [number, number] | null
  severeCaseRateRange: [number, number] | null
  keyDrivers: string[]
  recommendations: string[]
  uncertainty: string
  /** Body with the six section headings stripped (for fallback rendering). */
  fullText: string
}

const HEADING_KEYS: OutcomeSectionKey[] = [
  'SUMMARY',
  'RISK',
  'SEVERE_CASE_RATE',
  'KEY_DRIVERS',
  'RECOMMENDATIONS',
  'UNCERTAINTY',
]

/** Clamp an integer to the 0..100 range. */
function clampPercent(n: number): number {
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

/**
 * Extract a percentage field as `{ value, range }` from a string.
 * - When a numeric range like "30-45%" is found, returns the **mean** as
 *   `value` and the clamped `[min, max]` tuple as `range`.
 * - When only a single integer is found, returns that integer as `value`
 *   and `null` for `range`.
 * - Returns `null` if no number is found.
 *
 * Supports `-` (hyphen), `–` (en-dash), and `—` (em-dash) as range
 * separators, with optional surrounding whitespace and a trailing `%`.
 * Both bounds are clamped to 0..100.
 */
function extractPercentField(
  text: string
): { value: number; range: [number, number] | null } | null {
  if (!text) return null
  // First, look for a range with a hyphen / en-dash / em-dash separator.
  const rangeMatch = text.match(/(\d{1,3})\s*[-–—]\s*(\d{1,3})\s*%?/)
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10)
    const b = parseInt(rangeMatch[2], 10)
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      // Defensive sort — the model may emit either ordering.
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      const clampedLo = clampPercent(lo)
      const clampedHi = clampPercent(hi)
      return { value: (clampedLo + clampedHi) / 2, range: [clampedLo, clampedHi] }
    }
  }
  // Fall back to the first single integer.
  const singleMatch = text.match(/(\d{1,3})\s*%?/)
  if (!singleMatch) return null
  const n = parseInt(singleMatch[1], 10)
  if (Number.isNaN(n)) return null
  return { value: clampPercent(n), range: null }
}

/** Convert a chunk of text to a list of bullet points. */
function extractBullets(text: string): string[] {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s+/, '').trim())
    .filter((line) => line.length > 0)
}

/** Trim and collapse whitespace, return the resulting string (or ''). */
function collapseParagraph(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Parse the AI's response markdown into a structured object.
 * Tolerant of missing/extra/mis-ordered sections.
 */
export function parseOutcomeReport(markdown: string): ParsedOutcomeReport {
  const empty: ParsedOutcomeReport = {
    summary: '',
    risk: null,
    severeCaseRate: null,
    riskRange: null,
    severeCaseRateRange: null,
    keyDrivers: [],
    recommendations: [],
    uncertainty: '',
    fullText: '',
  }
  if (!markdown) return empty

  // Find all heading positions in the order they appear.
  const matches: { key: OutcomeSectionKey; index: number; bodyStart: number }[] = []
  const re = new RegExp(
    `^##\\s+(${HEADING_KEYS.join('|')})\\s*$`,
    'gim'
  )
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    const key = m[1].toUpperCase() as OutcomeSectionKey
    matches.push({ key, index: m.index, bodyStart: m.index + m[0].length })
  }

  if (matches.length === 0) {
    // No recognised headings — dump everything into fullText for fallback.
    return { ...empty, fullText: markdown.trim() }
  }

  // Build a body slice for each heading.
  const slices: Record<OutcomeSectionKey, string> = {
    SUMMARY: '',
    RISK: '',
    SEVERE_CASE_RATE: '',
    KEY_DRIVERS: '',
    RECOMMENDATIONS: '',
    UNCERTAINTY: '',
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]
    const next = matches[i + 1]
    const end = next ? next.index : markdown.length
    slices[cur.key] = markdown.slice(cur.bodyStart, end)
  }

  // Strip headings from the full text.
  const fullText = markdown.replace(re, '').trim()

  const riskField = extractPercentField(slices.RISK)
  const severeField = extractPercentField(slices.SEVERE_CASE_RATE)

  return {
    summary: collapseParagraph(slices.SUMMARY),
    risk: riskField?.value ?? null,
    severeCaseRate: severeField?.value ?? null,
    riskRange: riskField?.range ?? null,
    severeCaseRateRange: severeField?.range ?? null,
    keyDrivers: extractBullets(slices.KEY_DRIVERS),
    recommendations: extractBullets(slices.RECOMMENDATIONS),
    uncertainty: collapseParagraph(slices.UNCERTAINTY),
    fullText,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// JSON parser (worker Step 2 contract)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Coerce `risk` / `severeCaseRate` into the same `{ value, range }`
 * shape the markdown parser uses, regardless of which shape the model
 * emitted (single number or `[min, max]` tuple).
 *
 * **Fraction-vs-percent handling.** The 1.7B model sometimes emits
 * decimal fractions even though the prompt asks for 0–100 percentages
 * (e.g. `"risk": [0.30, 0.35]` meaning 30%–35%). To be lenient with
 * both conventions, any raw value strictly less than 1 is treated as
 * a fraction and multiplied by 100. Values ≥ 1 are assumed to be
 * percentages already. So 0.30 → 30, 30 → 30, 0.5 → 50, 50 → 50.
 */
function normalisePercentField(raw: unknown): {
  value: number | null
  range: [number, number] | null
} {
  if (raw === null || raw === undefined) return { value: null, range: null }
  // Convert decimal fractions to percentages. Leaves values ≥ 1 alone
  // (they're already in 0–100 percentage form). `1.0` → `1%` is the
  // chosen convention (most charitable for ambiguous edge cases).
  const fromMaybeFraction = (n: number): number => (n < 1 ? n * 100 : n)
  if (Array.isArray(raw)) {
    const [a, b] = raw
    if (typeof a !== 'number' || typeof b !== 'number') return { value: null, range: null }
    const l = fromMaybeFraction(a)
    const h = fromMaybeFraction(b)
    // Defensive sort — the model may emit either ordering.
    const lo = Math.min(l, h)
    const hi = Math.max(l, h)
    return { value: (lo + hi) / 2, range: [clampPercent(lo), clampPercent(hi)] }
  }
  if (typeof raw === 'number') {
    const v = fromMaybeFraction(raw)
    return { value: clampPercent(v), range: null }
  }
  return { value: null, range: null }
}

/**
 * Parse the worker's per-outcome JSON response into the same
 * `ParsedOutcomeReport` shape the markdown parser produces, so the
 * existing `aggregateOutcomes` and report UI keep working without
 * changes. The model is allowed to emit `risk` as a single number
 * or a `[min, max]` tuple; both are normalised to the
 * `{ value, range }` shape.
 *
 * Returns `null` if the content is not a parseable JSON object, or
 * if it doesn't have at least one of the expected fields. The
 * brace-counted extraction is the same approach the renderer's
 * `PromptToScenarioModal` uses against the streaming 1.7B model,
 * which has a habit of wrapping JSON in stray prose.
 *
 * The original raw JSON is kept on `fullText` so the renderer can
 * read the extra `comparisons` field (per-pair deltas) that the
 * markdown parser never produced.
 */
export function parseOutcomeJson(content: string): ParsedOutcomeReport | null {
  if (!content) return null

  const trimmed = content.trim()
  let candidate: string | null = null
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] !== '{') continue
    let depth = 0
    let endIdx = -1
    for (let j = i; j < trimmed.length; j++) {
      if (trimmed[j] === '{') depth++
      else if (trimmed[j] === '}') {
        depth--
        if (depth === 0) {
          endIdx = j + 1
          break
        }
      }
    }
    if (endIdx === -1) continue
    candidate = trimmed.slice(i, endIdx)
    break
  }
  if (!candidate) return null

  // Strip // line comments — the 1.7B model sometimes annotates its
  // JSON with comments that strict JSON.parse rejects. We only touch
  // // ... up to a newline, leaving string contents alone.
  const stripped = candidate.replace(/\/\/[^\n"\\]*(?:\n|$)/g, (m) =>
    m.endsWith('\n') ? '\n' : ''
  )

  let parsed: any
  try {
    parsed = JSON.parse(stripped)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const risk = normalisePercentField(parsed.risk)
  const severe = normalisePercentField(parsed.severeCaseRate)

  return {
    summary: typeof parsed.summary === 'string' ? collapseParagraph(parsed.summary) : '',
    risk: risk.value,
    severeCaseRate: severe.value,
    riskRange: risk.range,
    severeCaseRateRange: severe.range,
    keyDrivers: Array.isArray(parsed.keyDrivers)
      ? parsed.keyDrivers.map((s: unknown) => String(s)).filter(Boolean)
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map((s: unknown) => String(s)).filter(Boolean)
      : [],
    uncertainty:
      typeof parsed.uncertainty === 'string' ? collapseParagraph(parsed.uncertainty) : '',
    fullText: candidate,
  }
}
