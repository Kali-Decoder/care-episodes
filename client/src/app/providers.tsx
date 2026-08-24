'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AIProvider } from '../renderer/src/context/AIContext'
import { ProfileProvider } from '../renderer/src/context/ProfileContext'
import { TrainingProvider } from '../renderer/src/context/TrainingContext'
import { AuthProvider } from '../lib/AuthContext'
import { installMockApi } from '../renderer/src/mock/api'

export default function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    installMockApi()
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <AuthProvider>
      <AIProvider>
        <ProfileProvider>
          <TrainingProvider>{children}</TrainingProvider>
        </ProfileProvider>
      </AIProvider>
    </AuthProvider>
  )
}
