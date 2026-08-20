import type { ReactNode } from 'react'
import { MUTED, monoFont } from '../../theme'

/**
 * Mono uppercase eyebrow used as a small section label inside the
 * Settings pages. Was previously redefined in 4 files (AIConfiguration,
 * WorkerConfiguration, SharedResources, Documents).
 */
export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </p>
  )
}
