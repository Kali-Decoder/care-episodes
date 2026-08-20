import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'
import { useAI } from '../../context/AIContext'
import { SCENARIO_PRESETS } from '../../../../shared/scenarioPresets'
import type { SimCardTemplate } from '../../types/simulation'
import Spinner from '../ui/Spinner'

/**
 * F.15: Prompt-to-Scenario modal. The user describes a scenario in
 * free text (or accepts a preset) and the local model emits cards
 * as JSONL — one `{"category":"...","title":"...","<category>Fields":{...}}`
 * per card, no prose. The main process streams the model's text
 * over `ai:streamToken`; this modal buffers the deltas, brace-walks
 * the buffer for complete card objects, and emits one
 * `onCardParsed(card)` per valid card.
 *
 * **Auto-close on first card**: as soon as the first valid card
 * arrives, the modal calls `onCancel()` to hide the prompt UI so
 * the user can watch the rest of the cards populate the canvas
 * behind it. The modal stays mounted (parent keeps `keepMounted`
 * true) so the stream subscriptions keep firing until `streamDone`.
 *
 * **Lifecycle**:
 *   1. user opens modal (`open=true`, `keepMounted=true`)
 *   2. user types prompt, clicks Generate → `handleGenerate` runs
 *   3. IPC `ai:generateScenario` fires; main process streams deltas
 *   4. each delta → buffer + brace-walk → parse → `onCardParsed`
 *   5. on first valid card → `onCancel()` → modal hides UI
 *   6. more cards continue to stream in the background → more
 *      `onCardParsed` calls
 *   7. on `ai:streamDone` → `onApplied({ name, description, cardCount })`
 *   8. parent unmounts the modal (`keepMounted=false`)
 *
 * The modal is a pure trigger — the parent owns canvas state and
 * actually mutates the canvas on each `onCardParsed`.
 */

const DEFAULT_MAX_CARDS = 12
const VALID_CATEGORIES = ['subject', 'exposure', 'intervention'] as const

type CardCategory = (typeof VALID_CATEGORIES)[number]

interface PromptToScenarioModalProps {
  /** UI visibility. When `false` the modal hides via CSS but stays mounted if `keepMounted`. */
  open: boolean
  /**
   * If `true`, the modal stays in the React tree (and its stream
   * subscriptions stay alive) even when `open` is `false`. Required
   * for the auto-close-on-first-card UX so the rest of the stream
   * continues to populate the canvas after the prompt UI is gone.
   */
  keepMounted: boolean
  initialPrompt?: string
  presetLabel?: string
  profileSlug: string | null
  /** Fired when the user clicks Cancel OR when the first card arrives. */
  onCancel: () => void
  /**
   * Fired when the user clicks Generate and the IPC call actually
   * starts. Parent uses this to flip `promptMounted` on so the
   * background indicator shows up only when generation is real.
   */
  onGenerating: () => void
  /** Fired for every valid card parsed from the streamed JSONL. */
  onCardParsed: (card: SimCardTemplate) => void
  /** Fired once when the stream completes. */
  onApplied: (result: { name: string; description: string; cardCount: number }) => void
}

const X_SUBJ = 220
const X_EXPO = 540
const X_INTV = 860
const Y_BASE = 220
const Y_STEP = 100

function xForCategory(category: CardCategory): number {
  if (category === 'subject') return X_SUBJ
  if (category === 'exposure') return X_EXPO
  return X_INTV
}

/**
 * Brace-walk `buffer` and extract every complete JSON object that
 * looks like a scenario card
 * (`{"category":"...","title":"...","<category>Fields":{...}}`).
 *
 * Returns:
 *   - `cards`: the parsed cards, in order
 *   - `consumed`: the number of leading characters that have been
 *     fully processed. The caller should slice the buffer by this
 *     amount before the next call.
 *
 * Edge cases handled:
 *   - JSON that spans multiple newlines (the depth counter doesn't
 *     care about `\n`).
 *   - Multiple cards concatenated without a separator (`}{}{`).
 *   - Junk between or before cards (whitespace, stray `}`s, prose
 *     fragments) — we scan past it to the next `{`.
 *   - A `{` or `}` inside a quoted string value (the walker tracks
 *     string state and skips braces while inside `"..."`).
 *   - Incomplete JSON at the end of the buffer (returns `consumed`
 *     stopping before the incomplete tail; the tail is left in
 *     the buffer for the next call).
 *   - Malformed JSON at a balanced `{...}` (e.g. trailing comma)
 *     — skipped, the walker advances to the next `{`.
 */
function extractCardsFromBuffer(
  buffer: string
): { cards: SimCardTemplate[]; consumed: number } {
  const cards: SimCardTemplate[] = []
  let pos = 0
  let lastConsumedEnd = 0

  // Skip leading junk (whitespace, stray `}`, commas, prose
  // fragments) up to the first `{`. We consume this prefix so the
  // next call to this function doesn't re-walk it.
  while (pos < buffer.length && buffer[pos] !== '{') pos++
  lastConsumedEnd = pos

  while (pos < buffer.length && buffer[pos] === '{') {
    const start = pos
    let depth = 0
    let endIdx = -1
    let inString = false
    let escape = false

    for (let i = pos; i < buffer.length; i++) {
      const ch = buffer[i]
      if (inString) {
        if (escape) escape = false
        else if (ch === '\\') escape = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) {
          endIdx = i + 1
          break
        }
      }
    }
    if (endIdx === -1) break // Incomplete, wait for more tokens

    const objStr = buffer.slice(start, endIdx)
    let parsed: any
    try {
      parsed = JSON.parse(objStr)
    } catch {
      // Malformed JSON with balanced braces (e.g. trailing comma).
      // Skip past this object and keep looking for valid cards.
      pos = endIdx
      while (pos < buffer.length && buffer[pos] !== '{') pos++
      lastConsumedEnd = pos
      continue
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      VALID_CATEGORIES.includes(parsed.category)
    ) {
      // Normalise `comorbidities` to an array of trimmed, non-
      // empty strings. The local 1.7B model emits a single
      // string (per the system prompt's "comma-separated"
      // instruction), but the rest of the app — `CanvasCard`'s
      // edit form, `simulationWorker` — treat it as `string[]`
      // and call `.join(', ')`. Coercing at the entry point
      // keeps the rest of the pipeline simple.
      const normalisedSubjectFields =
        parsed.subjectFields && typeof parsed.subjectFields === 'object'
          ? {
              ...parsed.subjectFields,
              comorbidities: Array.isArray(parsed.subjectFields.comorbidities)
                ? parsed.subjectFields.comorbidities
                    .map((s: unknown) => String(s).trim())
                    .filter(Boolean)
                : typeof parsed.subjectFields.comorbidities === 'string'
                  ? parsed.subjectFields.comorbidities
                      .split(',')
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : undefined,
            }
          : parsed.subjectFields

      const id = `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      cards.push({
        id,
        category: parsed.category,
        title:
          typeof parsed.title === 'string' && parsed.title.trim()
            ? parsed.title.trim()
            : `Untitled ${parsed.category} card`,
        subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : undefined,
        subjectFields: normalisedSubjectFields,
        exposureFields: parsed.exposureFields,
        interventionFields: parsed.interventionFields,
      } as SimCardTemplate)
    }

    // Walked past this object — advance to the next `{`,
    // skipping any junk in between (whitespace, prose, etc.).
    pos = endIdx
    while (pos < buffer.length && buffer[pos] !== '{') pos++
    lastConsumedEnd = pos
  }

  return { cards, consumed: lastConsumedEnd }
}

export default function PromptToScenarioModal({
  open,
  keepMounted,
  initialPrompt,
  presetLabel,
  profileSlug,
  onCancel,
  onGenerating,
  onCardParsed,
  onApplied,
}: PromptToScenarioModalProps) {
  const { isReady } = useAI()
  const [prompt, setPrompt] = useState(initialPrompt ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Streaming state for content and thinking (only used while the
  // prompt UI is open; once the modal auto-closes, the user sees
  // the cards on the canvas instead).
  const [streamedContent, setStreamedContent] = useState('')
  const [streamedThinking, setStreamedThinking] = useState('')

  // The stream buffer and counters live in refs so they survive
  // re-renders and aren't part of the React render cycle (they're
  // updated on every token).
  const bufferRef = useRef('')
  const cardsParsedRef = useRef(0)
  const firstCardSeenRef = useRef(false)
  const totalCardsThisRunRef = useRef(0)

  // Max cards the AI may produce for one scenario. Configurable from
  // Settings → AI Configuration; we load it on mount and keep a ref
  // in sync so the stream-subscription useEffect (which has a stable
  // dep list) can read the latest value without re-subscribing.
  const [maxCards, setMaxCards] = useState(DEFAULT_MAX_CARDS)
  const maxCardsRef = useRef(maxCards)

  useEffect(() => {
    window.api.settings
      .get()
      .then((settings) => {
        if (typeof settings.maxCards === 'number') {
          setMaxCards(settings.maxCards)
          maxCardsRef.current = settings.maxCards
        }
      })
      .catch((err) =>
        console.error('[prompt-to-scenario] Failed to load maxCards setting:', err)
      )
  }, [])

  useEffect(() => {
    maxCardsRef.current = maxCards
  }, [maxCards])

  // Reset local state every time the modal opens
  useEffect(() => {
    if (open) {
      setPrompt(initialPrompt ?? '')
      setBusy(false)
      setError(null)
      setStreamedContent('')
      setStreamedThinking('')
      bufferRef.current = ''
      cardsParsedRef.current = 0
      firstCardSeenRef.current = false
      totalCardsThisRunRef.current = 0
    }
  }, [open, initialPrompt])

  // Esc to close (only when not busy)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  // Stream subscriptions. Active whenever the modal is in the React
  // tree (`keepMounted`) — even after the UI auto-closes on the
  // first card, the rest of the stream still feeds `onCardParsed`.
  useEffect(() => {
    if (!keepMounted) return

    const offToken = window.api.ai.onStreamToken((token) => {
      // Update the visible streaming text only while the modal UI
      // is open. Once auto-closed, the user sees cards on the
      // canvas and the JSONL text is no longer useful.
      if (open) setStreamedContent((prev) => prev + token)

      bufferRef.current += token
      // Brace-walk the entire buffer — the model frequently emits
      // cards that span multiple newlines, so we can't rely on
      // `\n` boundaries. The parser tracks how much of the buffer
      // it consumed so we can drop it and avoid re-walking the
      // same bytes on the next token.
      const { cards, consumed } = extractCardsFromBuffer(bufferRef.current)
      if (consumed > 0) bufferRef.current = bufferRef.current.slice(consumed)
      for (const card of cards) {
        if (cardsParsedRef.current >= maxCardsRef.current) break
        cardsParsedRef.current += 1
        totalCardsThisRunRef.current += 1
        onCardParsed(card)

        // First valid card → auto-close the prompt UI so the
        // user can watch the rest of the cards populate the
        // canvas behind it.
        if (!firstCardSeenRef.current) {
          firstCardSeenRef.current = true
          onCancel()
        }
      }
    })

    const offThinking = window.api.ai.onStreamThinking((thinking) => {
      if (open) setStreamedThinking((prev) => prev + thinking)
    })

    const offDone = window.api.ai.onStreamDone(() => {
      // Final flush: drain whatever's left in the buffer. A
      // trailing fragment can still hold one or more concatenated
      // cards if the model never emitted the last `\n` — the
      // brace-walker handles multi-line JSON, so we just call
      // the same parser as the streaming path.
      if (bufferRef.current && cardsParsedRef.current < maxCardsRef.current) {
        const { cards, consumed } = extractCardsFromBuffer(bufferRef.current)
        if (consumed > 0) bufferRef.current = bufferRef.current.slice(consumed)
        for (const card of cards) {
          if (cardsParsedRef.current >= maxCardsRef.current) break
          cardsParsedRef.current += 1
          totalCardsThisRunRef.current += 1
          onCardParsed(card)
        }
      }
      bufferRef.current = ''
    })

    return () => {
      offToken()
      offThinking()
      offDone()
    }
  }, [keepMounted, open, onCardParsed, onCancel])

  // Don't unmount when `keepMounted` is true — the stream
  // subscriptions need to keep firing until the parent fully
  // unmounts us after `onApplied`.
  if (!keepMounted && !open) return null

  async function handleGenerate() {
    if (!isReady) {
      setError('Load a model first.')
      return
    }
    if (!profileSlug) {
      setError('No active profile.')
      return
    }
    if (!prompt.trim()) {
      setError('Prompt is empty.')
      return
    }
    setBusy(true)
    setError(null)
    setStreamedContent('')
    setStreamedThinking('')
    bufferRef.current = ''
    cardsParsedRef.current = 0
    firstCardSeenRef.current = false
    totalCardsThisRunRef.current = 0
    // Notify parent that generation is real so it can flip
    // `promptMounted` on (showing the background indicator).
    onGenerating()
    try {
      const result = await window.api.ai.generateScenario(profileSlug, { prompt: prompt.trim() })

      console.log('[prompt-to-scenario] result:', result)

      if (result.ok) {
        // Wait for any final buffered content to be parsed before
        // we declare done. The streamDone handler has already fired
        // by the time the IPC promise resolves, so the buffer is
        // already drained.
        onApplied({
          name: result.name ?? 'Untitled scenario',
          description: result.description ?? '',
          cardCount: totalCardsThisRunRef.current,
        })
      } else {
        setError(result.error ?? 'Generation failed.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={false}
      animate={open ? 'open' : 'closed'}
      variants={{
        open: { opacity: 1 },
        closed: { opacity: 0, pointerEvents: 'none' },
      }}
      transition={{ duration: 0.18 }}
      onClick={() => {
        if (!busy) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,92,0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        // When closed, hide the element from layout so the user
        // can interact with the canvas behind it.
        visibility: open ? 'visible' : 'hidden',
      }}
    >
      <motion.div
        initial={false}
        animate={open ? 'open' : 'closed'}
        variants={{
          open: { scale: 1, y: 0, opacity: 1 },
          closed: { scale: 0.96, y: 8, opacity: 0 },
        }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(10,10,92,0.30)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0f0',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 11,
                letterSpacing: '0.16em',
                color: MUTED,
                textTransform: 'uppercase',
              }}
            >
              Prompt to scenario
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.12em',
                background: BLUE,
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              AI
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              background: 'transparent',
              color: MUTED,
              border: '1px solid #e0e0f0',
              borderRadius: 4,
              fontFamily: monoFont,
              fontSize: 16,
              lineHeight: 1,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            ×
          </button>
        </header>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {presetLabel && (
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: '0.10em',
                color: MUTED,
                textTransform: 'uppercase',
              }}
            >
              From: {presetLabel}
            </span>
          )}

          {/* AI starters — clickable chips that pre-fill the textarea. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              Example prompts
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {SCENARIO_PRESETS.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (!busy) {
                      setPrompt(p.prompt)
                      setError(null)
                    }
                  }}
                  disabled={busy}
                  whileHover={busy ? undefined : { scale: 1.02 }}
                  whileTap={busy ? undefined : { scale: 0.98 }}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    background: 'transparent',
                    color: BLUE,
                    border: '1.5px solid ' + BLUE,
                    borderRadius: 14,
                    fontFamily: sansFont,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              Describe the scenario
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 3 kids, ages 4-6, in the same class. 2 of them have stomach aches and can't eat for 2 days."
              rows={6}
              maxLength={2000}
              disabled={busy}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontFamily: sansFont,
                fontSize: 13,
                color: NAVY,
                background: '#f7f7fc',
                border: '1px solid #e0e0f0',
                borderRadius: 4,
                outline: 'none',
                resize: 'vertical',
                minHeight: 110,
                maxHeight: 220,
                boxSizing: 'border-box',
                opacity: busy ? 0.6 : 1,
              }}
            />
          </div>

          <span
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.10em',
              color: MUTED,
            }}
          >
            Describe a scenario in plain language. The AI will draft subject, exposure, and intervention cards and place them on the canvas.
          </span>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(200,48,48,0.08)',
                border: '1px solid #c83030',
                borderRadius: 4,
                color: '#c83030',
                fontFamily: sansFont,
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {busy && (
            <div
              ref={(el) => {
                if (el) el.scrollTop = el.scrollHeight
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 12px',
                background: '#f7f7fc',
                border: '1px solid #e0e0f0',
                borderRadius: 4,
                minHeight: 32,
                maxHeight: 80,
                overflowY: 'auto',
              }}
            >
              {streamedContent || streamedThinking ? (
                <span
                  style={{
                    fontFamily: sansFont,
                    fontSize: 12,
                    color: NAVY,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    flex: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {streamedContent || streamedThinking}
                </span>
              ) : (
                <>
                  <Spinner size={14} />
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: MUTED,
                      textTransform: 'uppercase',
                    }}
                  >
                    Generating…
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            borderTop: '1px solid #e0e0f0',
            background: '#fafaff',
          }}
        >
          <motion.button
            type="button"
            onClick={onCancel}
            disabled={busy}
            whileHover={busy ? undefined : { scale: 1.02 }}
            whileTap={busy ? undefined : { scale: 0.98 }}
            style={{
              height: 36,
              padding: '0 16px',
              background: 'transparent',
              color: MUTED,
              border: '1px solid #e0e0f0',
              borderRadius: 6,
              fontFamily: monoFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={busy || !isReady}
            whileHover={busy || !isReady ? undefined : { scale: 1.02 }}
            whileTap={busy || !isReady ? undefined : { scale: 0.98 }}
            style={{
              height: 36,
              padding: '0 18px',
              background: busy || !isReady ? MUTED : BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontFamily: monoFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: busy || !isReady ? 'not-allowed' : 'pointer',
              boxShadow: busy || !isReady ? 'none' : '0 4px 12px rgba(26,26,232,0.22)',
            }}
          >
            {busy ? 'Generating…' : isReady ? 'Generate' : 'Load a model first'}
          </motion.button>
        </footer>
      </motion.div>
    </motion.div>
  )
}

export const PROMPT_GENERATED_LAYOUT = {
  X_SUBJ,
  X_EXPO,
  X_INTV,
  Y_BASE,
  Y_STEP,
  xForCategory,
} as const
