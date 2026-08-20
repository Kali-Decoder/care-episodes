import { useState } from 'react'
import { motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../theme'

interface AddCustomModelFormProps {
  onComplete: (entry: {
    name: string
    source: string
    description?: string
  }) => void
  onCancel: () => void
}

/**
 * Form for adding a custom model entry. Source can be a local .gguf path
 * (entered manually or via the native file picker) or an http(s) URL,
 * with an optional one-line description.
 */
export function AddCustomModelForm({ onComplete, onCancel }: AddCustomModelFormProps) {
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [browsing, setBrowsing] = useState(false)

  const handleBrowse = async () => {
    if (browsing) return
    setBrowsing(true)
    try {
      const picked = await window.api.models.pickFile()
      if (picked) {
        setSource(picked)
        if (!name.trim()) {
          const filename = picked.split(/[\\/]/).pop()?.replace(/\.gguf$/i, '') ?? ''
          if (filename) setName(filename)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open file picker')
    } finally {
      setBrowsing(false)
    }
  }

  const handleSubmit = () => {
    if (!name.trim() || !source.trim()) {
      setError('Both name and source are required')
      return
    }
    onComplete({
      name: name.trim(),
      source: source.trim(),
      description: description.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid #d0d0e8`,
    borderRadius: 6,
    fontFamily: sansFont,
    fontSize: 14,
    color: NAVY,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 6,
    fontFamily: monoFont,
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: monoFont,
          fontSize: 12,
          color: MUTED,
          letterSpacing: '0.06em',
          marginBottom: 24,
        }}
      >
        ← back
      </button>

      <p
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          letterSpacing: '0.14em',
          color: MUTED,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        New custom model
      </p>
      <h2
        style={{
          fontFamily: sansFont,
          fontSize: 20,
          fontWeight: 300,
          color: NAVY,
          marginBottom: 24,
          lineHeight: 1.3,
        }}
      >
        Add a <strong style={{ fontWeight: 500 }}>local GGUF</strong>
      </h2>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          placeholder="My local model"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Source</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={inputStyle}
            placeholder="C:\path\to\model.gguf or https://…"
          />
          <button
            type="button"
            onClick={handleBrowse}
            disabled={browsing}
            style={{
              padding: '0 16px',
              background: '#fff',
              border: '1px solid #e0e0f0',
              borderRadius: 6,
              color: NAVY,
              fontFamily: monoFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: browsing ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {browsing ? '…' : 'Browse…'}
          </button>
        </div>
        <p
          style={{
            fontFamily: monoFont,
            fontSize: 10,
            color: MUTED,
            marginTop: 6,
            letterSpacing: '0.06em',
          }}
        >
          Local .gguf file or remote URL
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={inputStyle}
          placeholder="A short one-liner shown in the picker"
        />
      </div>

      {error && (
        <p
          style={{
            fontFamily: sansFont,
            fontSize: 12,
            color: '#cc0000',
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!name.trim() || !source.trim()}
        style={{
          width: '100%',
          marginTop: 24,
          padding: '13px 0',
          background: BLUE,
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.1em',
          cursor: 'pointer',
          opacity: !name.trim() || !source.trim() ? 0.4 : 1,
        }}
      >
        ADD MODEL
      </motion.button>
    </motion.div>
  )
}
