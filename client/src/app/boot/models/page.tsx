'use client'

import { useRouter } from 'next/navigation'
import ModelSelector from '../../../renderer/src/pages/ModelSelector'
import BackToApp from '../BackToApp'

export default function Page() {
  const router = useRouter()
  return (
    <>
      <BackToApp />
      <ModelSelector onComplete={() => router.push('/boot/loading')} />
    </>
  )
}
