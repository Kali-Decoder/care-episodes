import { motion } from 'framer-motion'
import { BLUE, MUTED, NAVY, monoFont, sansFont } from '../../theme'

interface EditScenarioModalProps {
  open: boolean
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onClose: () => void
  onSave: () => void
}

export default function EditScenarioModal({
  open,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSave,
}: EditScenarioModalProps) {
  if (!open) return null

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
          maxWidth: 480,
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
          }}
        >
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 11,
              letterSpacing: '0.16em',
              color: MUTED,
              textTransform: 'uppercase',
            }}
          >
            Edit Scenario
          </span>
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

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name field */}
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
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={name || 'MedLifeSim'}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                fontFamily: sansFont,
                fontSize: 14,
                color: NAVY,
                background: '#f7f7fc',
                border: '1px solid #e0e0f0',
                borderRadius: 4,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description field */}
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
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="What is this scenario modelling?"
              rows={4}
              maxLength={1000}
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
                minHeight: 80,
                maxHeight: 160,
                boxSizing: 'border-box',
              }}
            />
          </div>
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
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
              cursor: 'pointer',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            onClick={onSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              height: 36,
              padding: '0 18px',
              background: BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontFamily: monoFont,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(26,26,232,0.22)',
            }}
          >
            Save
          </motion.button>
        </footer>
      </motion.div>
    </motion.div>
  )
}