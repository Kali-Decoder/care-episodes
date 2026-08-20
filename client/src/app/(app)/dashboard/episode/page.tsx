'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CareEpisodePage from '../../../../care/pages/CareEpisodePage'
import { CARE_HOME } from '../../../../care/routes'
import { sansFont } from '../../../../care/ui'

function EpisodeInner() {
  const params = useSearchParams()
  const id = params.get('id')
  if (!id) {
    return (
      <div style={{ padding: 48, fontFamily: sansFont }}>
        <p>No episode selected.</p>
        <Link href={CARE_HOME}>← All episodes</Link>
      </div>
    )
  }
  return <CareEpisodePage episodeId={id} embedded />
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EpisodeInner />
    </Suspense>
  )
}
