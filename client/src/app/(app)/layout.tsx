'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../renderer/src/components/MainLayout'
import { useProfile } from '../../renderer/src/context/ProfileContext'
import { usePatient } from '../../care/context/PatientContext'
import { profileFromName } from '../../renderer/src/context/ProfileContext'
import AppLoader from '../../components/AppLoader'

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { profile, setProfile } = useProfile()
  const { selectedPatient, hydrated, loading } = usePatient()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!hydrated || loading) return

    if (!selectedPatient) {
      setAllowed(false)
      router.replace('/')
      return
    }

    if (profile?.name !== selectedPatient.name) {
      setProfile(profileFromName(selectedPatient.name, profile))
    }
    setAllowed(true)
  }, [hydrated, loading, selectedPatient, profile, router, setProfile])

  if (!hydrated || loading || !allowed || !selectedPatient) {
    return (
      <AppLoader
        label={hydrated ? 'Opening your care space…' : 'Loading profiles…'}
        detail="Getting your episodes ready"
      />
    )
  }

  return <MainLayout profile={profile ?? undefined}>{children}</MainLayout>
}
