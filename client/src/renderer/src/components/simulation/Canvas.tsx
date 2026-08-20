import { useEffect, useRef, useState, useCallback } from 'react'
import { BLUE, MUTED, monoFont } from '../../theme'
import CanvasCard, { type CanvasCardEdit, type PortSide } from './CanvasCard'
import CanvasLines from './CanvasLines'
import type { CanvasState } from '../../types/simulation'

interface CanvasProps {
  state: CanvasState
  selectedId: string | null
  /** placementId of the card currently in connect-source mode, if any. */
  connectFrom: string | null
  /** placementId of the card currently in inline-edit mode, if any. */
  editingId: string | null
  onSelectCard: (id: string | null) => void
  onDeleteCard: (id: string) => void
  onToggleCollapse: (id: string) => void
  onPortClick: (placementId: string, side: PortSide) => void
  onDeleteConnection: (id: string) => void
  onCancelConnect: () => void
  onRequestEdit: (id: string) => void
  onEditCard: (id: string, updates: CanvasCardEdit) => void
  onEditCancel: (id: string) => void
}

const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

/**
 * The free-form 2D surface. Fills its parent, paints a dot grid, and
 * hosts the pan/zoom "world" div. The world div contains:
 *   - the SVG line overlay (drawn in canvas-space coordinates, aligned
 *     with the cards),
 *   - the cards themselves (positioned absolutely with `left`/`top`).
 *
 * Mouse wheel zooms (anchored at the cursor). Left/right/middle-mouse
 * drag pans (left-click pans only on empty surface so card drag still
 * works). The bottom-left shows a small badge with − / % / + / Reset
 * for fine control.
 *
 * Esc cancels an in-flight connect, Delete/Backspace removes the
 * selected card. Both are global keydown listeners attached in an effect.
 */
export default function Canvas({
  state,
  selectedId,
  connectFrom,
  editingId,
  onSelectCard,
  onDeleteCard,
  onToggleCollapse,
  onPortClick,
  onDeleteConnection,
  onCancelConnect,
  onRequestEdit,
  onEditCard,
  onEditCancel,
}: CanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ panX: 0, panY: 0, mouseX: 0, mouseY: 0, button: 0 })

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (connectFrom) {
          e.preventDefault()
          onCancelConnect()
        }
        return
      }
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      // Don't let Delete/Backspace nuke a card that's currently being
      // edited — the user might just be editing text in the canvas card.
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && selectedId !== editingId) {
        e.preventDefault()
        onDeleteCard(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [connectFrom, selectedId, editingId, onCancelConnect, onDeleteCard])

  // Wheel zoom — must be a native passive:false listener so we can
  // preventDefault and stop the page from scrolling.
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = surface!.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top
      // World-space point under the cursor (before the zoom change).
      const worldX = (cursorX - pan.x) / zoom
      const worldY = (cursorY - pan.y) / zoom
      // Smooth zoom factor.
      const factor = Math.exp(-e.deltaY * 0.0015)
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor))
      setPan({
        x: cursorX - worldX * newZoom,
        y: cursorY - worldY * newZoom,
      })
      setZoom(newZoom)
    }

    surface.addEventListener('wheel', handleWheel, { passive: false })
    return () => surface.removeEventListener('wheel', handleWheel)
  }, [pan, zoom])

  // Drag pans the world. Triggered by left/right/middle mouse buttons via
  // handleSurfaceMouseDown. We attach window-level listeners for move/up
  // so the user can drag outside the canvas without losing the gesture.
  useEffect(() => {
    if (!isPanning) return
    function onMove(e: MouseEvent) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.mouseX),
        y: panStart.current.panY + (e.clientY - panStart.current.mouseY),
      })
    }
    function onUp(e: MouseEvent) {
      if (e.button === panStart.current.button) setIsPanning(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning])

  const handleSurfaceMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target
      const onEmpty =
        target === surfaceRef.current || target === worldRef.current
      // Pan on: middle-click anywhere, right-click anywhere, or left-click on
      // the empty surface (so left-click on a card still drags via dnd-kit
      // and clicks on ports / action buttons still fire normally).
      const shouldPan =
        e.button === 1 || e.button === 2 || (e.button === 0 && onEmpty)
      if (!shouldPan) return
      e.preventDefault()
      panStart.current = {
        panX: pan.x,
        panY: pan.y,
        mouseX: e.clientX,
        mouseY: e.clientY,
        button: e.button,
      }
      setIsPanning(true)
      // Left-click on the empty surface also clears the current selection.
      if (e.button === 0 && onEmpty) onSelectCard(null)
    },
    [pan.x, pan.y, onSelectCard],
  )

  function zoomBy(delta: number) {
    setZoom((z) => {
      const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta))
      return next
    })
  }

  function resetView() {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  const worldTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`

  return (
    <div
      ref={surfaceRef}
      onMouseDown={handleSurfaceMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#f7f7fc',
        backgroundImage:
          'radial-gradient(circle, #d0d0e8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : 'grab',
        // The browser interprets middle-mouse-drag as auto-scroll; we
        // own that gesture for panning, so tell the browser not to.
        touchAction: 'none',
      }}
    >
      <div
        ref={worldRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transform: worldTransform,
          transformOrigin: '0 0',
        }}
      >
        {state.cards.length === 0 && !connectFrom && <EmptyHint />}

        {/* Lines are rendered first so cards sit visually on top. */}
        <CanvasLines
          connections={state.connections}
          cards={state.cards}
          cardRefs={cardRefs.current}
          onDeleteConnection={onDeleteConnection}
        />

        {state.cards.map((card) => (
          <CanvasCard
            key={card.placementId}
            card={card}
            selected={selectedId === card.placementId}
            isConnectSource={connectFrom === card.placementId}
            editing={editingId === card.placementId}
            onSelect={onSelectCard}
            onDelete={onDeleteCard}
            onToggleCollapse={onToggleCollapse}
            onPortClick={onPortClick}
            onRequestEdit={onRequestEdit}
            onEdit={onEditCard}
            onEditCancel={onEditCancel}
            ref={(el) => {
              cardRefs.current[card.placementId] = el
            }}
          />
        ))}
      </div>

      {connectFrom && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0 18px',
            height: 32,
            background: 'rgba(26,26,232,0.08)',
            border: '1px solid ' + BLUE,
            borderRadius: 16,
            color: BLUE,
            fontFamily: monoFont,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 95,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Click a port to draw a line — Esc to cancel
        </div>
      )}

      <ZoomBadge
        zoom={zoom}
        onZoomIn={() => zoomBy(+ZOOM_STEP)}
        onZoomOut={() => zoomBy(-ZOOM_STEP)}
        onReset={resetView}
      />
    </div>
  )
}

function ZoomBadge({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 6px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid #e0e0f0',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(10,10,92,0.06)',
        zIndex: 60,
        fontFamily: monoFont,
        fontSize: 10,
        color: MUTED,
        userSelect: 'none',
      }}
    >
      <ZoomButton onClick={onZoomOut} label="Zoom out">−</ZoomButton>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 10,
          color: BLUE,
          fontWeight: 700,
          minWidth: 40,
          textAlign: 'center',
          letterSpacing: '0.06em',
        }}
      >
        {Math.round(zoom * 100)}%
      </span>
      <ZoomButton onClick={onZoomIn} label="Zoom in">+</ZoomButton>
      <span style={{ width: 1, height: 16, background: '#e0e0f0', margin: '0 2px' }} />
      <button
        type="button"
        onClick={onReset}
        title="Reset view"
        style={{
          height: 22,
          padding: '0 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: 4,
          color: MUTED,
          fontFamily: monoFont,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Reset
      </button>
    </div>
  )
}

function ZoomButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width: 22,
        height: 22,
        padding: 0,
        background: 'transparent',
        border: 'none',
        borderRadius: 4,
        color: MUTED,
        fontFamily: monoFont,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function EmptyHint() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 360,
        top: 220,
        maxWidth: 460,
        padding: 24,
        fontFamily: monoFont,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#a5a5c4',
        lineHeight: 1.7,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#7a7aa0' }}>
        Empty canvas
      </div> 
      Click + Add Card to add cards, drag them around, then
      connect their ports to build a pipeline.
    </div>
  )
}
