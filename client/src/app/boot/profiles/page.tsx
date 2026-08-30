'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy boot route — redirects to the in-app profile page. */
export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile')
  }, [router])

  return null
}
