import { motion } from 'framer-motion'
import { BLUE } from '../../theme'

/**
 * Tiny in-flight indicator. 0.9s linear infinite rotate, 2px BLUE
 * border + transparent top. Default size is 12px (matches the existing
 * StartSimulation inline spinner); pass `size={14}` for the slightly
 * larger PromptToScenarioModal variant.
 */
export default function Spinner({ size = 12 }: { size?: number }) {
  return (
    <motion.div
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        border: `2px solid ${BLUE}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
    />
  )
}
