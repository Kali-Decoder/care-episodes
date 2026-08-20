/**
 * Pure formatting helpers shared by the Dashboard, RecentSimulations,
 * Sessions list, and any future page that needs a glanceable date or
 * uptime label. Kept in `utils/` (not `components/ui/`) because they
 * are framework-agnostic and may be imported from non-component code.
 */

/**
 * Human-friendly uptime: <1m / 5m / 3h / 2d. Mirrors the inline
 * `formatUptime` that previously lived in `pages/Dashboard.tsx`.
 */
export function uptimeLabel(seconds: number): string {
  if (seconds < 60) return '<1m'
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

/**
 * Glanceable relative date used in recent-activity lists.
 * Buckets match the inline `formatDate` previously defined in both
 * `components/simulation/RecentSimulationRow.tsx:402-413` and
 * `pages/Sessions.tsx:15-27`:
 *   0 days          → "Today"
 *   1 day           → "Yesterday"
 *   < 7 days        → "N days ago"
 *   7-13 days       → "1 week ago"
 *   14-29 days      → "N weeks ago"
 *   >= 30 days      → locale date string
 */
export function relativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
