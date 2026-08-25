'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AIProvider } from '../renderer/src/context/AIContext'
import { ProfileProvider } from '../renderer/src/context/ProfileContext'
import { TrainingProvider } from '../renderer/src/context/TrainingContext'
import { installMockApi } from '../renderer/src/mock/api'
import AppLoader from '../components/AppLoader'

export default function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    installMockApi()
    setReady(true)
  }, [])

  if (!ready) {
    return <AppLoader label="Booting NaniAi…" detail="Warming up your care workspace" />
  }

  return (
    <AIProvider>
      <ProfileProvider>
        <TrainingProvider>{children}</TrainingProvider>
      </ProfileProvider>
    </AIProvider>
  )
}
