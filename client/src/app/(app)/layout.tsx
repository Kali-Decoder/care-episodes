'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../renderer/src/components/MainLayout'
import { useProfile, type Profile } from '../../renderer/src/context/ProfileContext'
import { useAuth } from '../../lib/AuthContext'

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
  const { profile, hydrated: profileHydrated, launchWithName, setProfile } = useProfile()
  const { user, phase, hydrated: authHydrated } = useAuth()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!profileHydrated || !authHydrated) return

    // Prefer authenticated user session.
    if (phase === 'ready' && user?.username) {
      if (!profile?.name?.trim() || profile.name !== user.username) {
        const next = launchWithName(user.username)
        setProfile({
          ...next,
          id: user.googleId,
          avatarUrl: user.picture || next.avatarUrl,
        })
      }
      setAllowed(true)
      return
    }

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
    router.replace('/welcome')
  }, [
    profileHydrated,
    authHydrated,
    phase,
    user,
    profile,
    router,
    launchWithName,
    setProfile,
  ])

  if (!profileHydrated || !authHydrated || !allowed || !profile?.name?.trim()) return null

  return <MainLayout profile={profile}>{children}</MainLayout>
}
