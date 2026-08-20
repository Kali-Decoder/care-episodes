import type { ModelEntry } from '../../../preload/index.d'
import { BLUE, MUTED, TEAL } from '../theme'

/**
 * Pure helpers for displaying model registry entries. No React, no IPC —
 * kept separate so ModelCard / ModelSelector / future table views can
 * share the same derivation logic.
 */

export function deriveAbbreviation(entry: ModelEntry): string {
  if (entry.params) {
    const cleaned = entry.params.replace(/[^\d.BMK]/gi, '').toUpperCase().slice(0, 4)
    if (cleaned) return cleaned
  }
  const tokens = entry.name.split(/[\s()_-]+/).filter(Boolean)
  const first = tokens[0] ?? ''
  if (first.length >= 2) return first.slice(0, 2).toUpperCase()
  return entry.sourceKind === 'file' ? 'LOC' : 'MDL'
}

export function deriveMetaLine(entry: ModelEntry): string {
  const parts: string[] = []
  if (entry.sourceKind === 'file') {
    const filename = entry.source.split(/[\\/]/).pop() ?? entry.source
    const trimmed = filename.length > 28 ? filename.slice(0, 25) + '…' : filename
    parts.push(`Local file • ${trimmed}`)
  } else {
    if (entry.params) parts.push(`~${entry.params}`)
    if (entry.quantization) parts.push(entry.quantization)
    parts.push(entry.sourceKind === 'registry' ? 'Registry' : 'Remote URL')
  }
  return parts.join(' • ').toUpperCase()
}

export type EntryTone = 'idle' | 'active' | 'inflight' | 'error'

export interface EntryStatus {
  color: string
  label: string
  tone: EntryTone
}

export interface EntryState {
  activeId: string | null
  lastSelectedId: string | null
  progress: { phase: 'downloading' | 'loading'; percentage: number } | null
  error: { code: string; message: string } | null
}

/**
 * Format a byte count as a 2-decimal short human label. Examples:
 * `2.16 GB`, `1.05 MB`, `512 B`. Returns `null` for missing/zero
 * values so callers can decide whether to render the pill at all.
 */
export function formatSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
}

export function statusForEntry(entry: ModelEntry, state: EntryState): EntryStatus {
  if (state.error && state.activeId === entry.id) {
    return { color: '#cc0000', label: 'Error', tone: 'error' }
  }
  if (state.progress && state.activeId === entry.id) {
    const verb = state.progress.phase === 'downloading' ? 'Downloading' : 'Loading'
    return {
      color: BLUE,
      label: `${verb} ${Math.round(state.progress.percentage)}%`,
      tone: 'inflight',
    }
  }
  if (state.activeId === entry.id) {
    return { color: TEAL, label: 'Loaded', tone: 'active' }
  }
  if (state.lastSelectedId === entry.id) {
    return { color: MUTED, label: 'Last used', tone: 'idle' }
  }
  return { color: MUTED, label: 'Not loaded', tone: 'idle' }
}
