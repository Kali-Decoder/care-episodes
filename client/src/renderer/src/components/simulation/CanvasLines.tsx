import { useEffect, useState } from 'react'
import { BLUE } from '../../theme'
import { CARD_WIDTH } from './CanvasCard'
import type { CanvasCard, Connection } from '../../types/simulation'

interface CanvasLinesProps {
  connections: Connection[]
  cards: CanvasCard[]
  /** Per-card refs to read the live collapsed height. */
  cardRefs: Record<string, HTMLDivElement | null>
  onDeleteConnection: (id: string) => void
}

interface LineGeometry {
  cx1: number
  cy1: number
  cx2: number
  cy2: number
  x1: number
  y1: number
  x2: number
  y2: number
  midX: number
  midY: number
}

const CARD_HEIGHT_EXPANDED = 110
const CARD_HEIGHT_COLLAPSED = 44
const HANDLE = 80 // bezier control-point offset — gives the S-curve

/**
 * SVG overlay rendering all connection lines as cubic-bezier paths.
 *
 * The SVG fills the canvas wrapper and is positioned at the origin;
 * line coordinates are written in canvas space (i.e. in the same
 * coordinate system the cards use), so the cards and the lines stay
 * perfectly aligned at any pan/zoom. The canvas's own `overflow:hidden`
 * clips anything that scrolls off-screen; `overflow:visible` on the SVG
 * keeps arrowheads that sit just past the viewport visible.
 *
 * Re-measures when the cards list changes (positions / collapse state
 * differ) or when the window resizes.
 */
export default function CanvasLines({
  connections,
  cards,
  cardRefs,
  onDeleteConnection,
}: CanvasLinesProps) {
  const [, force] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  // Repaint when card positions / collapse state change. We can't simply
  // depend on `cards` because the geometry is read from the DOM, so we
  // bump a counter any time the parent re-renders.
  useEffect(() => {
    force((n) => n + 1)
  }, [cards])

  // Repaint on window resize.
  useEffect(() => {
    function onResize() {
      force((n) => n + 1)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (connections.length === 0) return null

  const lines: Array<{ conn: Connection; geom: LineGeometry }> = []
  for (const conn of connections) {
    const geom = computeGeometry(conn, cards, cardRefs)
    if (geom) lines.push({ conn, geom })
  }
  if (lines.length === 0) return null

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="canvas-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={BLUE} />
        </marker>
      </defs>

      {lines.map(({ conn, geom }) => {
        const path = `M ${geom.x1} ${geom.y1} C ${geom.cx1} ${geom.cy1}, ${geom.cx2} ${geom.cy2}, ${geom.x2} ${geom.y2}`
        const isHovered = hovered === conn.id
        return (
          <g key={conn.id} style={{ pointerEvents: 'all' }}>
            {/* Invisible thick hit area so hovering the line is easy. */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth={14}
              fill="none"
              onMouseEnter={() => setHovered(conn.id)}
              onMouseLeave={() => setHovered(null)}
            />
            <path
              d={path}
              stroke={BLUE}
              strokeWidth={1.5}
              fill="none"
              markerEnd="url(#canvas-arrow)"
              pointerEvents="none"
            />
            {isHovered && (
              <g
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConnection(conn.id)
                }}
              >
                <circle cx={geom.midX} cy={geom.midY} r={9} fill="#fff" stroke={BLUE} strokeWidth={1.5} />
                <line
                  x1={geom.midX - 4}
                  y1={geom.midY}
                  x2={geom.midX + 4}
                  y2={geom.midY}
                  stroke={BLUE}
                  strokeWidth={1.5}
                />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Geometry: the line is **always** drawn from the source's right edge
 * (its output port) to the target's left edge (its input port). Cubic-
 * bezier control points flip sign when the target sits to the left of
 * the source so the curve loops out and back without crossing itself.
 */
function computeGeometry(
  conn: Connection,
  cards: CanvasCard[],
  cardRefs: Record<string, HTMLDivElement | null>,
): LineGeometry | null {
  const fromCard = cards.find((c) => c.placementId === conn.from)
  const toCard = cards.find((c) => c.placementId === conn.to)
  if (!fromCard || !toCard) return null

  const fromEl = cardRefs[fromCard.placementId]
  const toEl = cardRefs[toCard.placementId]

  const fromH = fromEl
    ? fromEl.getBoundingClientRect().height
    : fromCard.collapsed
    ? CARD_HEIGHT_COLLAPSED
    : CARD_HEIGHT_EXPANDED
  const toH = toEl
    ? toEl.getBoundingClientRect().height
    : toCard.collapsed
    ? CARD_HEIGHT_COLLAPSED
    : CARD_HEIGHT_EXPANDED

  const x1 = fromCard.x + CARD_WIDTH
  const y1 = fromCard.y + fromH / 2
  const x2 = toCard.x
  const y2 = toCard.y + toH / 2

  // Control points push outward in the direction of travel so the
  // curve never S-bends through itself, even when the target is to
  // the left of the source.
  const dir = x2 >= x1 ? 1 : -1
  const cx1 = x1 + dir * HANDLE
  const cy1 = y1
  const cx2 = x2 - dir * HANDLE
  const cy2 = y2

  return {
    x1,
    y1,
    x2,
    y2,
    cx1,
    cy1,
    cx2,
    cy2,
    midX: (x1 + x2) / 2,
    midY: (y1 + y2) / 2,
  }
}
