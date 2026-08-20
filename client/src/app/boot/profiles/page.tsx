'use client'

import { useRouter } from 'next/navigation'
import { useProfile } from '../../../renderer/src/context/ProfileContext'
import ProfileSelector from '../../../renderer/src/pages/ProfileSelector'
import BackToApp from '../BackToApp'

export default function Page() {
  const router = useRouter()
  const { setProfile } = useProfile()

  return (
    <>
      <BackToApp />
      <ProfileSelector
        onSelect={(selected) => {
          setProfile(selected)
          router.push('/dashboard')
        }}
        onCreateProfile={(profileData) => {
          void (async () => {
            const created = await window.api.profiles.add(profileData)
            setProfile(created)
            router.push('/dashboard')
          })()
        }}
      />
    </>
  )
}
