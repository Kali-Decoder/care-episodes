import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Plus, Trash2, X } from 'lucide-react'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../../theme'
import SectionLabel from '../ui/SectionLabel'
import Pill from '../ui/Pill'
import MonoButton from '../ui/MonoButton'

/**
 * Settings → Shared Resources — the P2P tab.
 *
 * Two stacked cards:
 *  1. **Provider** — share this machine's GPU with a remote peer.
 *     Start / stop the QVAC provider, see the public key to share.
 *  2. **Consumer** — delegate simulation outcome completions to a
 *     remote provider. Manage a list of saved peers (manual paste of
 *     public keys) and connect / disconnect.
 *
 * Live updates flow in via `window.api.p2p.onStatus(...)` so the UI
 * stays in sync when the main process flips state (e.g. auto-start
 * provider on launch).
 */

interface P2PPeer {
  id: string
  name: string
  publicKey: string
  createdAt: string
}

interface P2PStatus {
  provider: {
    enabled: boolean
    running: boolean
    starting: boolean
    publicKey: string | null
    seedExists: boolean
    error: string | null
  }
  consumer: {
    enabled: boolean
    activePeerId: string | null
    activePeer: P2PPeer | null
    peers: P2PPeer[]
    outcomeModelLoaded: boolean
    delegatedTo: { publicKey: string; peerName: string } | null
    error: string | null
  }
}

const HEX_KEY_RE = /^[0-9a-f]{64}$/

function truncateKey(publicKey: string): string {
  if (publicKey.length < 20) return publicKey
  return `${publicKey.slice(0, 12)}…${publicKey.slice(-4)}`
}

export default function SharedResources() {
  const [status, setStatus] = useState<P2PStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAddPeer, setShowAddPeer] = useState(false)
  const statusRef = useRef<P2PStatus | null>(null)

  // Initial fetch + subscribe to live updates.
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const s = (await window.api.p2p.status()) as P2PStatus
        if (!mounted) return
        statusRef.current = s
        setStatus(s)
      } catch (err) {
        console.error('Failed to load p2p status:', err)
        if (mounted) setError('Failed to load P2P status.')
      }
    }
    void load()
    const off = window.api.p2p.onStatus((s) => {
      statusRef.current = s
      setStatus(s)
    })
    return () => {
      mounted = false
      off()
    }
  }, [])

  const wrap = async (label: string, fn: () => Promise<unknown>) => {
    setBusyAction(label)
    setError(null)
    try {
      await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed'
      console.error(`[p2p] ${label} failed:`, err)
      setError(message)
    } finally {
      setBusyAction(null)
    }
  }

  // ─── Provider actions ────────────────────────────────────────────────

  const onProviderStart = () => wrap('providerStart', () => window.api.p2p.providerStart())
  const onProviderStop = () => wrap('providerStop', () => window.api.p2p.providerStop())
  const onProviderToggleLaunch = (next: boolean) =>
    wrap('providerSetEnabled', () => window.api.p2p.providerSetEnabled(next))

  const onCopyKey = () => {
    const key = status?.provider.publicKey
    if (!key) return
    void navigator.clipboard
      .writeText(key)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch((err) => {
        console.warn('Copy failed', err)
        setError('Copy failed — please select and copy manually.')
      })
  }

  // ─── Consumer actions ────────────────────────────────────────────────

  const onConsumerToggle = (next: boolean) =>
    wrap('consumerSetEnabled', () => window.api.p2p.consumerSetEnabled(next))

  const onPeerAdd = (input: { name: string; publicKey: string }) =>
    wrap('peersAdd', async () => {
      const r = await window.api.p2p.peersAdd(input)
      if (!r.success) {
        setError(r.error ?? 'Failed to add peer')
        return
      }
      setShowAddPeer(false)
    })

  const onPeerRemove = (id: string, name: string) => {
    if (!window.confirm(`Remove peer "${name}"?`)) return
    void wrap('peersRemove', () => window.api.p2p.peersRemove(id))
  }

  const onPeerConnect = (id: string) =>
    wrap('peersConnect', () => window.api.p2p.peersConnect(id))

  const onPeerDisconnect = () => wrap('peersDisconnect', () => window.api.p2p.peersDisconnect())

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div>
      <SectionLabel>Network</SectionLabel>
      <h2
        style={{
          fontFamily: sansFont,
          fontSize: 22,
          fontWeight: 300,
          color: NAVY,
          margin: '0 0 24px 0',
          lineHeight: 1.2,
        }}
      >
        <strong style={{ fontWeight: 500 }}>Shared</strong> Resources
      </h2>

      {error && (
        <p
          style={{
            margin: '0 0 16px 0',
            padding: '10px 12px',
            background: '#fbe6e6',
            color: '#a82020',
            border: '1px solid #f0b0b0',
            borderRadius: 6,
            fontFamily: sansFont,
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}

      <ProviderCard
        status={status}
        busyAction={busyAction}
        copied={copied}
        onStart={onProviderStart}
        onStop={onProviderStop}
        onToggleLaunch={onProviderToggleLaunch}
        onCopyKey={onCopyKey}
      />

      <div style={{ height: 24 }} />

      <ConsumerCard
        status={status}
        busyAction={busyAction}
        onToggle={onConsumerToggle}
        onAddPeer={() => setShowAddPeer(true)}
        onPeerConnect={onPeerConnect}
        onPeerDisconnect={onPeerDisconnect}
        onPeerRemove={onPeerRemove}
      />

      <AnimatePresence>
        {showAddPeer && (
          <AddPeerModal
            onCancel={() => setShowAddPeer(false)}
            onSubmit={(data) => void onPeerAdd(data)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────── Provider card ─────────────────────────────

function ProviderCard({
  status,
  busyAction,
  copied,
  onStart,
  onStop,
  onToggleLaunch,
  onCopyKey,
}: {
  status: P2PStatus | null
  busyAction: string | null
  copied: boolean
  onStart: () => void
  onStop: () => void
  onToggleLaunch: (next: boolean) => void
  onCopyKey: () => void
}) {
  const provider = status?.provider
  const running = provider?.running ?? false
  const starting = provider?.starting ?? false
  const launchOn = provider?.enabled ?? false
  const publicKey = provider?.publicKey ?? null
  const error = provider?.error ?? null

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e0e0f0',
        borderRadius: 10,
        padding: 20,
      }}
    >
      <SectionLabel>Share compute</SectionLabel>
      <h3
        style={{
          fontFamily: sansFont,
          fontSize: 16,
          fontWeight: 500,
          color: NAVY,
          margin: '0 0 6px 0',
        }}
      >
        Share this machine with peers
      </h3>
      <p
        style={{
          fontFamily: sansFont,
          fontSize: 13,
          color: MUTED,
          margin: '0 0 18px 0',
          lineHeight: 1.5,
        }}
      >
        Run a P2P provider so a remote peer can process simulation outcomes on this
        machine. Leave off if you don't want others using your GPU.
      </p>

      {/* Start on launch toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginRight: 4,
          }}
        >
          Start on launch
        </span>
        {(
          [
            { value: true, label: 'On' },
            { value: false, label: 'Off' },
          ] as const
        ).map((opt) => (
          <motion.button
            key={opt.label}
            type="button"
            disabled={busyAction !== null}
            onClick={() => {
              if (launchOn !== opt.value) onToggleLaunch(opt.value)
            }}
            whileHover={busyAction ? undefined : { scale: 1.02 }}
            whileTap={busyAction ? undefined : { scale: 0.98 }}
            style={{
              padding: '5px 12px',
              background: launchOn === opt.value ? BLUE : '#fff',
              color: launchOn === opt.value ? '#fff' : NAVY,
              border: launchOn === opt.value ? 'none' : '1px solid #e0e0f0',
              borderRadius: 4,
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              cursor: busyAction ? 'not-allowed' : 'pointer',
              opacity: busyAction ? 0.5 : 1,
            }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>

      {/* Manual start / stop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {running ? (
          <MonoButton
            onClick={onStop}
            disabled={busyAction !== null}
            variant="danger"
          >
            {busyAction === 'providerStop' ? 'Stopping…' : 'Stop'}
          </MonoButton>
        ) : (
          <MonoButton
            onClick={onStart}
            disabled={busyAction !== null}
            variant="primary"
          >
            {busyAction === 'providerStart' || starting ? 'Starting…' : 'Start now'}
          </MonoButton>
        )}

        {error ? (
          <Pill tone="error">Error: {error}</Pill>
        ) : running ? (
          <Pill tone="ok">Running</Pill>
        ) : starting ? (
          <Pill tone="busy">Starting</Pill>
        ) : (
          <Pill tone="idle">Stopped</Pill>
        )}
      </div>

      {/* Public key */}
      <SectionLabel>Provider public key</SectionLabel>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fafafc',
          border: '1px solid #f0f0f8',
          borderRadius: 6,
          padding: '8px 10px',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: monoFont,
            fontSize: 11,
            color: publicKey ? NAVY : MUTED,
            wordBreak: 'break-all',
            userSelect: 'all',
            lineHeight: 1.4,
          }}
        >
          {publicKey ?? '—'}
        </span>
        <motion.button
          type="button"
          onClick={onCopyKey}
          disabled={!publicKey}
          whileHover={publicKey ? { scale: 1.05 } : undefined}
          whileTap={publicKey ? { scale: 0.95 } : undefined}
          aria-label="Copy public key"
          style={{
            background: copied ? TEAL : '#fff',
            color: copied ? '#fff' : NAVY,
            border: '1px solid #e0e0f0',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: publicKey ? 'pointer' : 'not-allowed',
            opacity: publicKey ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Copy size={12} />
        </motion.button>
      </div>
      {copied && (
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            color: TEAL,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            margin: '0 0 6px 0',
          }}
        >
          Copied
        </p>
      )}
      <p
        style={{
          fontFamily: monoFont,
          fontSize: 9,
          letterSpacing: '0.10em',
          color: MUTED,
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Give this key to the peer who should use your machine.
      </p>
    </section>
  )
}

// ──────────────────────────── Consumer card ─────────────────────────────

function ConsumerCard({
  status,
  busyAction,
  onToggle,
  onAddPeer,
  onPeerConnect,
  onPeerDisconnect,
  onPeerRemove,
}: {
  status: P2PStatus | null
  busyAction: string | null
  onToggle: (next: boolean) => void
  onAddPeer: () => void
  onPeerConnect: (id: string) => void
  onPeerDisconnect: () => void
  onPeerRemove: (id: string, name: string) => void
}) {
  const consumer = status?.consumer
  const consumerOn = consumer?.enabled ?? false
  const activePeerId = consumer?.activePeerId ?? null
  const peers = consumer?.peers ?? []
  const delegatedTo = consumer?.delegatedTo ?? null
  const error = consumer?.error ?? null

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e0e0f0',
        borderRadius: 10,
        padding: 20,
      }}
    >
      <SectionLabel>Use a peer's compute</SectionLabel>
      <h3
        style={{
          fontFamily: sansFont,
          fontSize: 16,
          fontWeight: 500,
          color: NAVY,
          margin: '0 0 6px 0',
        }}
      >
        Delegate simulation outcomes
      </h3>
      <p
        style={{
          fontFamily: sansFont,
          fontSize: 13,
          color: MUTED,
          margin: '0 0 18px 0',
          lineHeight: 1.5,
        }}
      >
        Outcomes will be processed on a remote machine. Chat and scenario generation
        stay local. Outcomes pause while disconnected.
      </p>

      {/* Delegate toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginRight: 4,
          }}
        >
          Delegate outcomes
        </span>
        {(
          [
            { value: true, label: 'On' },
            { value: false, label: 'Off' },
          ] as const
        ).map((opt) => (
          <motion.button
            key={opt.label}
            type="button"
            disabled={busyAction !== null}
            onClick={() => {
              if (consumerOn !== opt.value) onToggle(opt.value)
            }}
            whileHover={busyAction ? undefined : { scale: 1.02 }}
            whileTap={busyAction ? undefined : { scale: 0.98 }}
            style={{
              padding: '5px 12px',
              background: consumerOn === opt.value ? BLUE : '#fff',
              color: consumerOn === opt.value ? '#fff' : NAVY,
              border: consumerOn === opt.value ? 'none' : '1px solid #e0e0f0',
              borderRadius: 4,
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              cursor: busyAction ? 'not-allowed' : 'pointer',
              opacity: busyAction ? 0.5 : 1,
            }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>

      {/* Status / error */}
      {consumerOn && error && (
        <p
          style={{
            margin: '0 0 12px 0',
            padding: '8px 10px',
            background: '#fbe6e6',
            color: '#a82020',
            border: '1px solid #f0b0b0',
            borderRadius: 6,
            fontFamily: sansFont,
            fontSize: 12,
          }}
        >
          {error}
        </p>
      )}
      {consumerOn && delegatedTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#d6f5f3',
            border: '1px solid #a8e6e2',
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: sansFont,
                fontSize: 13,
                color: '#0a5a57',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Connected to {delegatedTo.peerName}
            </p>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                color: '#0a5a57',
                margin: '4px 0 0 0',
                letterSpacing: '0.04em',
                wordBreak: 'break-all',
              }}
            >
              {truncateKey(delegatedTo.publicKey)}
            </p>
          </div>
          <MonoButton
            onClick={onPeerDisconnect}
            disabled={busyAction !== null}
            variant="danger"
          >
            {busyAction === 'peersDisconnect' ? '…' : 'Disconnect'}
          </MonoButton>
        </div>
      )}
      {consumerOn && !delegatedTo && (
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 9,
            color: MUTED,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            margin: '0 0 12px 0',
          }}
        >
          Not connected — outcomes are paused
        </p>
      )}

      {/* Peers */}
      <SectionLabel>Peers</SectionLabel>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {peers.length === 0 ? (
          <p
            style={{
              fontFamily: sansFont,
              fontSize: 12,
              color: MUTED,
              margin: 0,
              padding: '10px 12px',
              background: '#fafafc',
              border: '1px dashed #e0e0f0',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            No saved peers yet. Add one to delegate outcomes.
          </p>
        ) : (
          peers.map((peer) => {
            const isActive = peer.id === activePeerId
            return (
              <div
                key={peer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 12px',
                  background: isActive ? '#f0fafa' : '#fafafc',
                  border: isActive ? '1px solid #a8e6e2' : '1px solid #f0f0f8',
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: sansFont,
                        fontSize: 13,
                        color: NAVY,
                        fontWeight: 500,
                      }}
                    >
                      {peer.name}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontFamily: monoFont,
                          fontSize: 9,
                          color: TEAL,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      color: MUTED,
                      margin: '4px 0 0 0',
                      wordBreak: 'break-all',
                    }}
                  >
                    {truncateKey(peer.publicKey)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isActive ? (
                    <MonoButton
                      onClick={onPeerDisconnect}
                      disabled={busyAction !== null}
                      variant="default"
                    >
                      Disconnect
                    </MonoButton>
                  ) : (
                    <MonoButton
                      onClick={() => onPeerConnect(peer.id)}
                      disabled={busyAction !== null || !consumerOn}
                      variant="primary"
                    >
                      {busyAction === 'peersConnect' ? '…' : 'Connect'}
                    </MonoButton>
                  )}
                  <motion.button
                    type="button"
                    onClick={() => onPeerRemove(peer.id, peer.name)}
                    disabled={busyAction !== null}
                    whileHover={busyAction ? undefined : { scale: 1.05 }}
                    whileTap={busyAction ? undefined : { scale: 0.95 }}
                    aria-label={`Remove ${peer.name}`}
                    style={{
                      background: '#fff',
                      color: '#a82020',
                      border: '1px solid #f0d0d0',
                      borderRadius: 6,
                      padding: '6px 8px',
                      cursor: busyAction ? 'not-allowed' : 'pointer',
                      opacity: busyAction ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </div>
              </div>
            )
          })
        )}

        <motion.button
          type="button"
          onClick={onAddPeer}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#fff',
            color: NAVY,
            border: '1px dashed #c8c8d8',
            borderRadius: 6,
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add peer…
        </motion.button>
      </div>
    </section>
  )
}

// ──────────────────────────── Add peer modal ────────────────────────────

function AddPeerModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (data: { name: string; publicKey: string }) => void
}) {
  const [name, setName] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => labelRef.current?.focus(), 60)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const normalizedKey = publicKey.trim().toLowerCase()
  const keyValid = HEX_KEY_RE.test(normalizedKey)
  const canSubmit = name.trim().length > 0 && keyValid

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        fontFamily: sansFont,
      }}
    >
      <motion.div
        initial={{ scale: 0.97, y: 4 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 4 }}
        transition={{ duration: 0.12 }}
        style={{
          background: '#fff',
          border: '1px solid #e0e0f0',
          borderRadius: 10,
          boxShadow: '0 16px 48px rgba(0,0,0,0.20)',
          width: 'min(520px, calc(100vw - 48px))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f8',
          }}
        >
          <h2
            style={{
              fontFamily: sansFont,
              fontSize: 16,
              fontWeight: 500,
              color: NAVY,
              margin: 0,
            }}
          >
            Add peer
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
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
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Field label="Name" required>
            <input
              ref={labelRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice's laptop"
              style={inputStyle}
            />
          </Field>

          <Field
            label="Provider public key"
            required
            meta={
              normalizedKey.length > 0
                ? keyValid
                  ? `${normalizedKey.length} hex chars`
                  : `${normalizedKey.length} / 64 — must be 64 hex characters`
                : undefined
            }
            metaTone={keyValid ? 'ok' : normalizedKey.length > 0 ? 'error' : 'idle'}
          >
            <textarea
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="64-character hex Hyperswarm public key"
              style={{
                ...inputStyle,
                minHeight: 90,
                fontFamily: monoFont,
                fontSize: 11,
                lineHeight: 1.5,
                resize: 'vertical',
                wordBreak: 'break-all',
              }}
            />
          </Field>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 20px',
            borderTop: '1px solid #f0f0f8',
            background: '#fafafc',
          }}
        >
          <MonoButton onClick={onCancel}>Cancel</MonoButton>
          <MonoButton
            onClick={() => onSubmit({ name: name.trim(), publicKey: normalizedKey })}
            disabled={!canSubmit}
            variant="primary"
          >
            Add
          </MonoButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Field({
  label,
  required,
  meta,
  metaTone = 'idle',
  children,
}: {
  label: string
  required?: boolean
  meta?: string
  metaTone?: 'idle' | 'ok' | 'error'
  children: React.ReactNode
}) {
  const metaColor = metaTone === 'ok' ? TEAL : metaTone === 'error' ? '#a82020' : MUTED
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
          }}
        >
          {label}
          {required && (
            <span style={{ color: BLUE, marginLeft: 4 }} aria-hidden>
              *
            </span>
          )}
        </label>
        {meta && (
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 10,
              color: metaColor,
              letterSpacing: '0.04em',
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #e0e0f0',
  borderRadius: 6,
  fontFamily: sansFont,
  fontSize: 13,
  color: NAVY,
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}
