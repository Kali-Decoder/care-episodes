'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { resolveAvatarUrl } from '../../../lib/notionAvatars'

export interface Profile {
  id: string
  name: string
  type: 'self' | 'family' | 'doctor' | 'community'
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
  avatarUrl?: string
}

const STORAGE_KEY = 'naniai.profile'

interface ProfileContextType {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  /** Create/update the patient profile from a display name and persist it. */
  launchWithName: (name: string) => Profile
  hydrated: boolean
}

const ProfileContext = createContext<ProfileContextType | null>(null)

function readStoredProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Profile
    if (!parsed?.name?.trim()) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredProfile(profile: Profile | null) {
  if (typeof window === 'undefined') return
  if (!profile) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function profileFromName(name: string, existing?: Profile | null): Profile {
  const trimmed = name.trim()
  const id = existing?.id ?? 'profile-local'
  return {
    id,
    name: trimmed,
    type: existing?.type ?? 'self',
    age: existing?.age,
    gender: existing?.gender,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    avatarUrl: resolveAvatarUrl(trimmed || id, existing?.avatarUrl),
  }
}

export function ProfileProvider({
  children,
  initialProfile = null,
}: {
  children: ReactNode
  initialProfile?: Profile | null
}) {
  const [profile, setProfileState] = useState<Profile | null>(initialProfile)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredProfile()
    if (stored) {
      const next = {
        ...stored,
        avatarUrl: resolveAvatarUrl(stored.name || stored.id, stored.avatarUrl),
      }
      setProfileState(next)
      writeStoredProfile(next)
    }
    setHydrated(true)
  }, [])

  const setProfile = useCallback((next: Profile | null) => {
    setProfileState(next)
    writeStoredProfile(next)
  }, [])

  const launchWithName = useCallback(
    (name: string) => {
      const next = profileFromName(name, profile)
      setProfile(next)
      return next
    },
    [profile, setProfile],
  )

  return (
    <ProfileContext.Provider value={{ profile, setProfile, launchWithName, hydrated }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}
