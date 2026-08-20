import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Languages, Loader2, X } from 'lucide-react'
import { MUTED, NAVY, TEAL, monoFont, sansFont } from '../theme'
import type { SupportedTargetLang } from '../../../preload/index.d'

/**
 * Translation picker — a small "Translate ▾" dropdown that drives
 * the in-place report-translation flow. The user picks a target
 * language; on confirm the parent calls
 * `window.api.simulations.translateReport(...)` which is a single
 * IPC that re-fetches the data on the main side, runs Bergamot,
 * and returns the translated `ReportResponse`. The renderer
 * overlays the translated data on top of the original English
 * data so the page re-renders in the new language.
 *
 * Picking "Original (English)" (or `null`) clears the overlay —
 * the page reverts to the original English data. No IPC needed.
 *
 * The picker itself does **not** talk to `translation:load` /
 * `translation:unload` / `translation:status`. Those IPCs are
 * still registered in the main process for status surfaces, but
 * the picker is now a pure controlled component: it shows a
 * spinner and a "Translating to <label>…" label when the
 * `translating` prop is true, and the parent is responsible for
 * blocking re-picks (by passing `disabled={translating}`).
 */
export default function TranslationPicker({
  value,
  onChange,
  disabled,
  translating,
}: {
  value: SupportedTargetLang | null
  onChange: (next: SupportedTargetLang | null) => void
  disabled?: boolean
  /** When true, the trigger shows a spinner + "Translating to {label}…" label. */
  translating?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [languages, setLanguages] = useState<Array<{ code: SupportedTargetLang; label: string }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch the supported-language list once on mount. The main
  // process owns the list; we just ask for it once.
  useEffect(() => {
    let alive = true
    window.api.translation.supportedLanguages().then((langs) => {
      if (alive) setLanguages(langs)
    })
    return () => {
      alive = false
    }
  }, [])

  // Close on outside click + on Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const currentLabel = value
    ? languages.find((l) => l.code === value)?.label ?? value
    : 'Original (English)'

  const handlePick = (next: SupportedTargetLang | null) => {
    setOpen(false)
    onChange(next)
  }

  // When the parent flips `translating` to true it will often
  // already have closed the popover via `handlePick`. This is a
  // belt-and-braces close in case the parent forgot.
  useEffect(() => {
    if (translating && open) setOpen(false)
  }, [translating, open])

  const triggerLabel = translating
    ? value
      ? `Translating to ${currentLabel}…`
      : 'Translating…'
    : value
      ? `Translated · ${currentLabel}`
      : 'Translate ▾'

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Keyframe for the in-flight Loader2 spinner. Inline <style>
          avoids needing to touch the global stylesheet just for this
          one icon. The id is namespaced so it can never collide
          with another component's styles. */}
      <style>{`@keyframes tp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <motion.button
        type="button"
        onClick={() => !disabled && !translating && setOpen((v) => !v)}
        disabled={disabled || translating}
        whileHover={!disabled && !translating ? { x: 2 } : undefined}
        whileTap={!disabled && !translating ? { scale: 0.98 } : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: open ? NAVY : '#fff',
          color: open ? '#fff' : (value || translating ? TEAL : MUTED),
          border: '1px solid ' + (open ? NAVY : (value || translating ? TEAL : '#e0e0f0')),
          borderRadius: 6,
          fontFamily: monoFont,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: disabled || translating ? 'not-allowed' : 'pointer',
          opacity: disabled || translating ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
        title={translating ? `Translating to ${currentLabel}…` : 'Translate report'}
      >
        {translating ? (
          <Loader2 size={12} style={{ animation: 'tp-spin 1s linear infinite' }} />
        ) : (
          <Languages size={12} />
        )}
        {triggerLabel}
        <ChevronDown
          size={12}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              // Open downward — the button sits inside `PageWrapper`
              // which is `overflowY: auto`, so an upward-anchored
              // popover gets clipped at the wrapper's top edge.
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              minWidth: 260,
              maxWidth: 320,
              maxHeight: 360,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              zIndex: 50,
              fontFamily: sansFont,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid #f0f0f8',
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  color: MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                }}
              >
                Translate report to
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close language picker"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: MUTED,
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Original (English) option — clears the overlay */}
            <PickerRow
              isActive={value === null}
              onClick={() => handlePick(null)}
              title="Original (English)"
              subtitle="Show the model output as-is"
              active={value === null}
            />

            {languages.map((l) => {
              const isActive = value === l.code
              return (
                <PickerRow
                  key={l.code}
                  isActive={isActive}
                  onClick={() => handlePick(l.code)}
                  title={l.label}
                  subtitle={`EN → ${l.code.toUpperCase()} · ~36 MB first load`}
                  active={isActive}
                />
              )
            })}

            <div
              style={{
                padding: '8px 14px',
                fontFamily: monoFont,
                fontSize: 10,
                color: MUTED,
                borderTop: '1px solid #f0f0f8',
                lineHeight: 1.5,
              }}
            >
              Translation runs on-device via Bergamot. Disclaimer, status labels and table headers stay in English; only the AI-generated prose is translated.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PickerRow({
  isActive,
  onClick,
  title,
  subtitle,
  active,
  rightIcon,
}: {
  isActive?: boolean
  onClick: () => void
  title: string
  subtitle?: string
  active: boolean
  rightIcon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        background: active ? '#f0fafa' : 'transparent',
        border: 'none',
        borderTop: isActive ? 'none' : '1px solid #f7f7fc',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: sansFont,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && <Check size={14} color={TEAL} />}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: NAVY,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: MUTED,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {rightIcon}
    </button>
  )
}
