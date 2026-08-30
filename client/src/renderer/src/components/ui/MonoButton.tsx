import type { ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { NAVY, TEAL, BLUE, BORDER, RED, monoFont } from '../../theme'

type Variant = 'default' | 'primary' | 'danger'

const VARIANT_STYLES: Record<Variant, CSSProperties> = {
  default: {
    background: '#fff',
    color: NAVY,
    border: `1px solid ${BORDER}`,
  },
  primary: {
    background: BLUE,
    color: '#fff',
    border: '1px solid transparent',
  },
  danger: {
    background: '#fff',
    color: RED,
    border: '1px solid #E8C4C4',
  },
}

export default function MonoButton({
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  onClick: () => void
  disabled?: boolean
  variant?: Variant
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      style={{
        padding: '8px 16px',
        ...VARIANT_STYLES[variant],
        borderRadius: 999,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </motion.button>
  )
}
