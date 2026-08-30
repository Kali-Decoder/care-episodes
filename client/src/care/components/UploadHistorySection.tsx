'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { EpisodeSummary } from '../types'
import { CARE_EPISODE } from '../routes'
import { stateColor, stateLabel } from '../stateLabels'
import DashboardSection, { DashboardEmpty } from './dashboard/DashboardSection'
import CareLoader from './CareLoader'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, formatTimestamp, monoFont, sansFont } from '../ui'
import { ChevronRight } from 'lucide-react'

export default function UploadHistorySection({
  episodes,
  loading,
  onRefresh,
  title = 'Upload history',
  id = 'upload-history',
}: {
  episodes: EpisodeSummary[]
  loading: boolean
  onRefresh: () => void
  title?: string
  id?: string
}) {
  return (
    <DashboardSection
      title={title}
      accent={BLUE}
      cta="Refresh"
      onCta={onRefresh}
      id={id}
    >
      {loading ? (
        <CareLoader variant="block" label="Loading episodes…" minHeight={160} />
      ) : episodes.length === 0 ? (
        <DashboardEmpty text="No uploads yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {episodes.map((ep, i) => (
            <EpisodeCard key={ep.episode_id} episode={ep} index={i} />
          ))}
        </div>
      )}
    </DashboardSection>
  )
}

function EpisodeCard({ episode, index }: { episode: EpisodeSummary; index: number }) {
  const color = stateColor(episode.state)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        href={CARE_EPISODE(episode.episode_id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          borderTop: index === 0 ? 'none' : '1px solid #f0f0f8',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'background 0.15s',
          fontFamily: sansFont,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = LIGHT_BLUE
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div
          style={{
            width: 4,
            height: 44,
            borderRadius: 99,
            background: color,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: NAVY,
              margin: '0 0 4px',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {episode.summary_line}
          </p>
          <p style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, margin: 0 }}>
            {episode.upload_name ?? episode.episode_id} · {formatTimestamp(episode.created_at)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <StatusPill color={color}>{stateLabel(episode.state)}</StatusPill>
          <ChevronRight size={16} color={BLUE} strokeWidth={2.5} />
        </div>
      </Link>
    </motion.div>
  )
}
