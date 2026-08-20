import type { ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { NAVY, TEAL, monoFont } from '../../theme'

/**
 * The standard monospaced action button used across the app.
 * Three visual variants: `default` (white / NAVY / 1px border),
 * `primary` (TEAL / white), `danger` (white / dark-red / soft red
 * border). Wrapped in a framer-motion button for the standard
 * scale-on-hover / scale-on-tap interaction.
 */
type Variant = 'default' | 'primary' | 'danger'

const VARIANT_STYLES: Record<Variant, CSSProperties> = {
  default: {
    background: '#fff',
    color: NAVY,
    border: '1px solid #e0e0f0',
  },
  primary: {
    background: TEAL,
    color: '#fff',
    border: '1px solid transparent',
  },
  danger: {
    background: '#fff',
    color: '#a82020',
    border: '1px solid #f0d0d0',
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
        padding: '6px 14px',
        ...VARIANT_STYLES[variant],
        borderRadius: 6,
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </motion.button>
  )
}
