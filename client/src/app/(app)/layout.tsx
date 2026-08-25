'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../renderer/src/components/MainLayout'
import { useProfile, type Profile } from '../../renderer/src/context/ProfileContext'
import AppLoader from '../../components/AppLoader'

function readStoredName(): string | null {
  try {
    const raw = window.localStorage.getItem('naniai.profile')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Profile
    return parsed?.name?.trim() || null
  } catch {
    return null
  }
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { profile, hydrated, launchWithName } = useProfile()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!hydrated) return

    if (profile?.name?.trim()) {
      setAllowed(true)
      return
    }

    const storedName = readStoredName()
    if (storedName) {
      launchWithName(storedName)
      setAllowed(true)
      return
    }

    setAllowed(false)
    router.replace('/')
  }, [hydrated, profile, router, launchWithName])

  if (!hydrated || !allowed || !profile?.name?.trim()) {
    return (
      <AppLoader
        label={hydrated ? 'Opening your care space…' : 'Loading profile…'}
        detail="Getting your episodes ready"
      />
    )
  }

  return <MainLayout profile={profile}>{children}</MainLayout>
}
