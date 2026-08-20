import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'
import { SIM_TEMPLATES } from '../../data/simulationTemplates'
import type { SimTemplate } from '../../types/simulation'

interface TemplatePickerModalProps {
  open: boolean
  onPick: (template: SimTemplate) => void
  onClose: () => void
}

// Group templates by category
type TemplateCategory = 'Community' | 'Workplace' | 'Hospital'

const CATEGORY_ORDER: TemplateCategory[] = ['Workplace', 'Hospital', 'Community' ]

function categoryForTemplate(id: string): TemplateCategory {
  if (['teen-drugs', 'school-outbreak', 'urban-metabolic'].includes(id)) return 'Community'
  if (id === 'office-smoke') return 'Workplace'
  if (id === 'emergency-transfusion') return 'Hospital'
  return 'Community'
}

export default function TemplatePickerModal({ open, onPick, onClose }: TemplatePickerModalProps) {
  // Esc to close
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // Group templates by category
  const grouped: Record<TemplateCategory, SimTemplate[]> = {
    Community: [],
    Workplace: [],
    Hospital: [],
  }
  for (const t of SIM_TEMPLATES) {
    grouped[categoryForTemplate(t.id)].push(t)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
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
      }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.98, y: 4, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 560,
          maxHeight: '85vh',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(10,10,92,0.30)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.16em',
                color: MUTED,
                textTransform: 'uppercase',
              }}
            >
              Templates
            </span>
            <span
              style={{
                fontFamily: sansFont,
                fontSize: 16,
                fontWeight: 700,
                color: NAVY,
              }}
            >
              Choose from Template
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat]
            if (items.length === 0) return null
            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {cat}
                </span>
                {items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onPick(t)
                      onClose()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: '1px solid #e0e0f0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: sansFont,
                      color: NAVY,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f7f7fc'
                      e.currentTarget.style.borderColor = BLUE
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = '#e0e0f0'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: MUTED,
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {t.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}