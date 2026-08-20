'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AIProvider } from '../renderer/src/context/AIContext'
import { ProfileProvider } from '../renderer/src/context/ProfileContext'
import { TrainingProvider } from '../renderer/src/context/TrainingContext'
import { installMockApi, MOCK_PROFILE } from '../renderer/src/mock/api'

export default function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    installMockApi()
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <AIProvider>
      <ProfileProvider initialProfile={MOCK_PROFILE}>
        <TrainingProvider>{children}</TrainingProvider>
      </ProfileProvider>
    </AIProvider>
  )
}
