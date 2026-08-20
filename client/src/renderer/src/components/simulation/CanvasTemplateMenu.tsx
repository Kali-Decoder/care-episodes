import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'
import type { SimTemplate } from '../../types/simulation'

interface PromptPreset {
  id: string
  label: string
  prompt: string
}

interface CanvasTemplateMenuProps {
  /** Fires when the user picks a template (after the parent's confirm). */
  onPick: (template: SimTemplate) => void
  /** Fires when the user picks "Blank Canvas". */
  onBlank: () => void
  /** Fires when the user picks "Choose from template" - parent shows modal. */
  onChooseTemplate: () => void
  /**
   * Fires when the user picks "Prompt to scenario · AI" (no preset) or
   * one of the placeholder prompts. `null` means "open with empty
   * textarea"; otherwise the parent pre-fills the modal with the
   * preset's prompt and label.
   */
  onPromptToScenario: (preset: PromptPreset | null) => void
}

/**
 * Small dropdown menu anchored to the toolbar's "New Scenario ▾" button.
 * The parent owns the confirm-and-apply flow — this component only reports
 * the user's choice.
 */
export default function CanvasTemplateMenu({
  onPick: _onPick,
  onBlank,
  onChooseTemplate,
  onPromptToScenario,
}: CanvasTemplateMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onDocPointer(e: PointerEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [open])

  // Close on Esc.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      ref={wrapRef}
      style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}
    >
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onPointerDown={(e) => e.stopPropagation()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          height: 30,
          padding: '0 12px',
          background: 'transparent',
          color: BLUE,
          border: '1.5px solid ' + BLUE,
          borderRadius: 6,
          fontFamily: monoFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        New
        <span style={{ fontSize: 9, marginTop: -1, opacity: 0.8 }}>▾</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            role="menu"
            style={{
              position: 'absolute',
              top: 36,
              left: 0,
              minWidth: 240,
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              boxShadow: '0 12px 32px rgba(10,10,92,0.18)',
              padding: 6,
              zIndex: 110,
            }}
          >
            <MenuItem
              label="Blank Canvas"
              description="Start with an empty stage."
              onClick={() => {
                onBlank()
                setOpen(false)
              }}
            />
            <div style={{ height: 1, background: '#eeeef8', margin: '4px 6px' }} />

            {/* Choose from template - parent shows modal */}
            <MenuItem
              label="Choose from Template"
              description="Pick a pre-built scenario"
              onClick={() => {
                onChooseTemplate()
                setOpen(false)
              }}
            />

            <div style={{ height: 1, background: '#eeeef8', margin: '4px 6px' }} />

            {/* F.15: prompt-to-scenario entry — opens the modal with an
                empty textarea. AI starters are shown inside the modal. */}
            <MenuItem
              label="Prompt to Scenario"
              description="Describe a scenario and let AI generate new cards"
              trailing={<AiPill />}
              onClick={() => {
                onPromptToScenario(null)
                setOpen(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MenuItemProps {
  label: string
  description: string
  onClick: () => void
  /**
   * Optional small badge/pill rendered on the right side of the row
   * (e.g. an "AI" pill for the prompt-to-scenario entries).
   */
  trailing?: React.ReactNode
}

function MenuItem({ label, description, onClick, trailing }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: sansFont,
        color: NAVY,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7fc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            color: MUTED,
            marginTop: 2,
          }}
        >
          {description}
        </span>
      </div>
      {trailing}
    </button>
  )
}

/**
 * Small "AI" pill rendered on the right of the prompt-to-scenario
 * menu items so users can spot the AI-driven entries at a glance.
 */
function AiPill() {
  return (
    <span
      style={{
        fontFamily: monoFont,
        fontSize: 9,
        letterSpacing: '0.10em',
        background: BLUE,
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 8,
        fontWeight: 700,
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      AI
    </span>
  )
}