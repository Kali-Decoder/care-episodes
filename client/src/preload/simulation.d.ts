/**
 * Shared simulation types — included in both the renderer (tsconfig.web)
 * and the main process (tsconfig.node) tsconfigs. The renderer re-exports
 * these from `src/renderer/src/types/simulation.ts`; the main process
 * imports them directly from this file.
 */

export type SimCategory = 'subject' | 'exposure' | 'intervention'

export type SimTone = 'blue' | 'teal' | 'navy' | 'muted'

/**
 * Category-specific structured metadata that cards can carry alongside the
 * free-form `title ` chrome. The AI prompt interpolates
 * these typed fields so the model sees precise age / dose / compliance
 * numbers instead of free-text, which materially improves risk estimation.
 *
 * All fields are optional; the catalog fills in the ones that are known
 * and leaves the rest empty. The user can edit any field in the
 * card-edit form.
 */
export interface SimCardSubjectFields {
  /** e.g. "7-12", "65+", "Adults 35-55" */
  ageRange?: string
  /** e.g. "n=30", "n=200" */
  sampleSize?: string
  /** e.g. "Bangkok suburbs", "Northeast Thailand" */
  region?: string
  /** e.g. ["asthma", "diabetes"] */
  comorbidities?: string[]
  /** Free-form context for anything the typed fields can't capture. */
  context?: string
}

export interface SimCardExposureFields {
  /** e.g. "35 µg/m³", "8h passive" */
  dose?: string
  /** e.g. "PM2.5 µg/m³", "cigarettes/day equivalent" */
  unit?: string
  /** e.g. "ongoing", "6 months", "8h daily" */
  duration?: string
  /** e.g. "daily", "weekly", "intermittent" */
  frequency?: string
  /** e.g. "indoor shared office", "outdoor recess" */
  setting?: string
  /** Free-form context. */
  context?: string
}

export interface SimCardInterventionFields {
  /** e.g. "policy", "device", "education", "service" */
  type?: string
  /** e.g. "school-wide", "individual", "family-level" */
  intensity?: string
  /** e.g. "high", "moderate", "low" */
  compliance?: string
  /** Free-form context. */
  context?: string
}

export interface SimCardTemplate {
  id: string
  category: SimCategory
  title: string
  tone?: SimTone
  /** Category-specific typed fields. All optional. */
  subjectFields?: SimCardSubjectFields
  exposureFields?: SimCardExposureFields
  interventionFields?: SimCardInterventionFields
}

export interface PlacedCard extends SimCardTemplate {
  placementId: string
}

export interface CanvasCard extends PlacedCard {
  x: number
  y: number
  collapsed: boolean
}

export interface Connection {
  id: string
  from: string
  to: string
}

export interface CanvasState {
  cards: CanvasCard[]
  connections: Connection[]
}

// ─────────────────────────────────────────────────────────────────────────
// AI-driven outcome pipeline
// ─────────────────────────────────────────────────────────────────────────

export type PathStatus = 'pending' | 'processing' | 'done' | 'error'

export interface SimPathPreview {
  id: string
  interventionId: string
  pathLabels: {
    subject: string
    exposure: string
    intervention: string
  }
  placementIds: {
    subject: string
    exposure: string
    intervention: string
  }
  /**
   * Typed structured metadata for each axis of the path, sourced from the
   * canvas cards at enumeration time. The worker prompt interpolates
   * this block so the model sees age range / dose / compliance rather
   * than only the free-form `pathLabels` strings.
   */
  details: {
    subject: SimCardSubjectFields
    exposure: SimCardExposureFields
    intervention: SimCardInterventionFields
  }
  status: PathStatus
}

export type SimulationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'error'

export interface SimulationParent {
  id: string
  profileSlug: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  status: SimulationStatus
  canvas: CanvasState
  outcomeCount: number
  completedCount: number
  errorCount: number
}

export interface SimulationOutcome {
  id: string
  simId: string
  sessionSlug: string
  interventionId: string
  pathLabels: SimPathPreview['pathLabels']
  /**
   * Persisted typed metadata so the worker can re-render the prompt
   * on retry / requeue without re-loading the canvas. Optional for
   * backward compatibility with outcomes written before F.3 shipped.
   */
  details?: SimPathPreview['details']
  status: PathStatus
  createdAt: string
  updatedAt: string
  error?: string
}

export interface SimulationProgressEvent {
  simId: string
  outcomeId: string
  status: PathStatus
  error?: string
  completedCount: number
  outcomeCount: number
}

export interface SimTemplate {
  id: string
  name: string
  description: string
  canvas: CanvasState
}
