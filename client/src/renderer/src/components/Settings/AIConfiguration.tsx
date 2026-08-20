import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAI } from '../../context/AIContext'
import { BLUE, NAVY, MUTED, monoFont, sansFont } from '../../theme'
import SectionLabel from '../ui/SectionLabel'

const CTX_SIZES = [2048, 4096, 8192]
const MAX_CARDS_OPTIONS = [6, 12, 24]

export default function AIConfiguration() {
  const [ctxSize, setCtxSize] = useState(4096)
  const [maxCards, setMaxCards] = useState(12)
  const navigate = useNavigate()
  const { reload, progress, error: aiError, activeModel } = useAI()
  const [isReloading, setIsReloading] = useState(false)
  const [reloadError, setReloadError] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.settings.get()
        setCtxSize(settings.ctx_size)
        if (typeof settings.maxCards === 'number') {
          setMaxCards(settings.maxCards)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleCtxSizeChange = async (newSize: number) => {
    setCtxSize(newSize)
    try {
      await window.api.settings.setCtxSize(newSize)
    } catch (error) {
      console.error('Failed to save ctx_size:', error)
    }
  }

  const handleMaxCardsChange = async (value: number) => {
    setMaxCards(value)
    try {
      await window.api.settings.setMaxCards(value)
    } catch (error) {
      console.error('Failed to save maxCards:', error)
    }
  }

  const handleReloadModel = async () => {
    setIsReloading(true)
    setReloadError('')

    try {
      if (!activeModel) {
        setReloadError('No model is currently selected')
        return
      }
      await reload()
      navigate('/chat')
    } catch (e) {
      setReloadError(e instanceof Error ? e.message : 'Failed to reload model')
    } finally {
      setIsReloading(false)
    }
  }

  return (
    <div>
      <SectionLabel>Model Settings</SectionLabel>
      <h2 style={{ fontFamily: sansFont, fontSize: 22, fontWeight: 300, color: NAVY, margin: '0 0 24px 0', lineHeight: 1.2 }}>
        <strong style={{ fontWeight: 500 }}>AI</strong> Configuration
      </h2>

      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Context Size</SectionLabel>
        <p style={{ fontFamily: sansFont, fontSize: 14, color: MUTED, marginBottom: 16 }}>
          Context size determines how much conversation history the AI can process. Higher values allow for longer conversations but use more memory.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {CTX_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => handleCtxSizeChange(size)}
              style={{
                padding: '10px 22px',
                background: ctxSize === size ? BLUE : '#fff',
                color: ctxSize === size ? '#fff' : NAVY,
                border: ctxSize === size ? 'none' : '1px solid #e0e0f0',
                borderRadius: 6,
                fontFamily: monoFont,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {size} tokens
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <SectionLabel>Max Cards per Scenario</SectionLabel>
        <p style={{ fontFamily: sansFont, fontSize: 14, color: MUTED, marginBottom: 16 }}>
          Caps the number of subject/exposure/intervention cards the AI can generate from a single prompt. Lower values keep scenarios focused; higher values allow more complex multi-part setups.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {MAX_CARDS_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => handleMaxCardsChange(value)}
              style={{
                padding: '10px 22px',
                background: maxCards === value ? BLUE : '#fff',
                color: maxCards === value ? '#fff' : NAVY,
                border: maxCards === value ? 'none' : '1px solid #e0e0f0',
                borderRadius: 6,
                fontFamily: monoFont,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {value} cards
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Apply Changes</SectionLabel>
        <p style={{ fontFamily: sansFont, fontSize: 14, color: MUTED, marginBottom: 16 }}>
          After changing context size, reload the model to apply the new setting.
        </p>

        {activeModel && (
          <p style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Current model: <span style={{ color: NAVY, fontWeight: 700 }}>{activeModel.name}</span>
          </p>
        )}

        {(reloadError || aiError) && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p style={{ fontFamily: monoFont, fontSize: 11, color: '#cc0000', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Error
            </p>
            <p style={{ fontFamily: sansFont, fontSize: 13, color: '#660000', margin: 0 }}>
              {reloadError || aiError?.message || 'Failed to reload model'}
            </p>
          </div>
        )}

        <button
          onClick={handleReloadModel}
          disabled={isReloading || !!progress}
          style={{
            padding: '10px 20px',
            background: isReloading || progress ? MUTED : BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontFamily: monoFont,
            fontSize: 12,
            fontWeight: 500,
            cursor: isReloading || progress ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}
        >
          {isReloading || progress
            ? `Reloading… ${Math.round(progress?.percentage ?? 0)}%`
            : 'Reload Model'}
        </button>
      </div>
    </div>
  )
}
