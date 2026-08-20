'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CARE_HOME } from '../routes'

/** Legacy home — prescription upload lives on the dashboard only. */
export default function CareHomePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(CARE_HOME)
  }, [router])
  return null
}
