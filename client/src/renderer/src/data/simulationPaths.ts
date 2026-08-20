import type { CanvasState } from '../types/simulation'
import { enumeratePaths as enumeratePathsShared } from '../../../shared/simulationPaths'

/**
 * Thin renderer-side wrapper. The actual implementation lives in
 * `src/shared/simulationPaths.ts` so the main process can reuse it
 * without crossing the renderer/main module boundary.
 */

/** A canvas with no cards and no connections. */
export const EMPTY_CANVAS: CanvasState = { cards: [], connections: [] }

/**
 * Pure logic for enumerating all valid subject → exposure → intervention
 * paths from a canvas. Returns path-only previews (no risk or summary
 * data) — those come from the AI after the user clicks Proceed in the
 * builder.
 */
export function enumeratePaths(
  cards: CanvasState['cards'],
  connections: CanvasState['connections']
) {
  return enumeratePathsShared(cards, connections)
}

/** Returns true when the canvas has at least one valid path. */
export function canEnumerate(
  cards: CanvasState['cards'],
  connections: CanvasState['connections']
): boolean {
  return enumeratePathsShared(cards, connections).length > 0
}
