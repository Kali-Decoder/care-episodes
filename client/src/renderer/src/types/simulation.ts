/**
 * Renderer re-exports of the shared simulation types. The single source
 * of truth is `src/preload/simulation.d.ts` so the main process and the
 * renderer can both consume the same shapes. The runtime constant
 * `EMPTY_CANVAS` is defined locally in `simulationPaths.ts` because
 * `.d.ts` files can't carry runtime values.
 */

export { EMPTY_CANVAS } from '../data/simulationPaths'

export type {
  CanvasCard,
  CanvasState,
  Connection,
  PathStatus,
  PlacedCard,
  SimCardExposureFields,
  SimCardInterventionFields,
  SimCardSubjectFields,
  SimCardTemplate,
  SimCategory,
  SimPathPreview,
  SimTemplate,
  SimTone,
  SimulationOutcome,
  SimulationParent,
  SimulationProgressEvent,
  SimulationStatus,
} from '../../../preload/simulation'
