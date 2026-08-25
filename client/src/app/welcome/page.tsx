'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /welcome route — landing now lives at /. */
export default function Page() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [router])
  return null
}
