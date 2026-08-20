import { MUTED, TEAL } from '../theme'

/**
 * Risk numeric → color. Mirrors the inline `riskColor` that previously
 * lived in `pages/SimulationReport.tsx:45-51`. Used by the report's
 * best/worst intervention table, the per-outcome risk bars, and the
 * new Dashboard's "Avg risk" KPI tile.
 *
 * Bands:
 *   null      → MUTED  (no data)
 *   < 25      → TEAL   (low)
 *   25–49     → green  (moderate)
 *   50–74     → amber  (elevated)
 *   ≥ 75      → red    (high)
 */
export function riskColor(value: number | null): string {
  if (value === null) return MUTED
  if (value < 25) return TEAL
  if (value < 50) return '#3ec480'
  if (value < 75) return '#cc8a00'
  return '#c83030'
}
