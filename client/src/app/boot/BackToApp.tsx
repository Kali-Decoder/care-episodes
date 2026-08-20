'use client'

import { useRouter } from 'next/navigation'
import { MUTED, monoFont } from '../../renderer/src/theme'

export default function BackToApp() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.push('/dashboard')}
      style={{
        position: 'fixed',
        left: 24,
        bottom: 24,
        zIndex: 50,
        background: 'transparent',
        border: 'none',
        color: MUTED,
        fontFamily: monoFont,
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      ← Back to app
    </button>
  )
}
