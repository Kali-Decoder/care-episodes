import { createContext, useContext, useState, ReactNode } from 'react'

export interface Profile {
  id: string
  name: string
  type: 'self' | 'family' | 'doctor' | 'community'
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
}

interface ProfileContextType {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ 
  children, 
  initialProfile 
}: { 
  children: ReactNode
  initialProfile: Profile | null 
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
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