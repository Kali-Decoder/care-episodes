'use client'

import { useRouter } from 'next/navigation'
import LoadingScreen from '../../../renderer/src/pages/LoadingScreen'
import BackToApp from '../BackToApp'

export default function Page() {
  const router = useRouter()
  return (
    <>
      <BackToApp />
      <LoadingScreen onComplete={() => router.push('/dashboard')} />
    </>
  )
}
