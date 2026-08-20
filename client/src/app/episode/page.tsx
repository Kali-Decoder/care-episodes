'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CARE_EPISODE, CARE_HOME } from '../../care/routes'

function RedirectInner() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('id')

  useEffect(() => {
    router.replace(id ? CARE_EPISODE(id) : CARE_HOME)
  }, [id, router])

  return null
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  )
}
