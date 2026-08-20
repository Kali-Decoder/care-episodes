/**
 * Shared path-enumeration logic. Imported by both the renderer
 * (`src/renderer/src/data/simulationPaths.ts`) and the main process
 * (`src/main/simulations.ts`) so the two stay byte-for-byte identical.
 *
 * The 3-step pipeline is: `subject → exposure → intervention`.
 */

import type { CanvasCard, Connection, SimCategory, SimPathPreview } from '../preload/simulation'

function freshId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'outcome-' + crypto.randomUUID()
  }
  return 'outcome-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

/**
 * Enumerate all valid paths through the canvas's connection graph.
 * Each path is a 3-tuple (subject, exposure, intervention) of placed cards.
 */
export function enumeratePaths(
  cards: CanvasCard[],
  connections: Connection[]
): SimPathPreview[] {
  const byId = new Map(cards.map((c) => [c.placementId, c]))
  const outgoing = new Map<string, string[]>()

  for (const conn of connections) {
    if (!outgoing.has(conn.from)) outgoing.set(conn.from, [])
    outgoing.get(conn.from)!.push(conn.to)
  }

  const getChildren = (id: string, cat: SimCategory): CanvasCard[] =>
    (outgoing.get(id) ?? [])
      .map((toId) => byId.get(toId))
      .filter((c): c is CanvasCard => !!c && c.category === cat)

  const results: SimPathPreview[] = []
  const subjects = cards.filter((c) => c.category === 'subject')

  for (const subj of subjects) {
    for (const expo of getChildren(subj.placementId, 'exposure')) {
      for (const intv of getChildren(expo.placementId, 'intervention')) {
        results.push({
          id: freshId(),
          interventionId: intv.id,
          pathLabels: {
            subject: subj.title,
            exposure: expo.title,
            intervention: intv.title,
          },
          placementIds: {
            subject: subj.placementId,
            exposure: expo.placementId,
            intervention: intv.placementId,
          },
          details: {
            subject: subj.subjectFields ?? {},
            exposure: expo.exposureFields ?? {},
            intervention: intv.interventionFields ?? {},
          },
          status: 'pending',
        })
      }
    }
  }

  return results
}
