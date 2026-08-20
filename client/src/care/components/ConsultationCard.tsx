'use client'

import type { Consultation } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { cardStyle, formatSlot, MUTED, NAVY, TEAL } from '../ui'

const STATUS_COLOR: Record<Consultation['status'], string> = {
  requested: '#cc8a00',
  confirmed: TEAL,
  declined: '#c83030',
}

export default function ConsultationCard({ consultation }: { consultation: Consultation }) {
  return (
    <section style={cardStyle}>
      <SectionLabel>Consultation</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 4px' }}>With</p>
          <p style={{ fontSize: 17, fontWeight: 600, color: NAVY, margin: '0 0 12px' }}>
            {consultation.doctor}
          </p>
          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 4px' }}>Proposed slot</p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: NAVY, margin: 0 }}>
            {formatSlot(consultation.proposed_slot)}
          </p>
        </div>
        <StatusPill color={STATUS_COLOR[consultation.status]}>{consultation.status}</StatusPill>
      </div>
    </section>
  )
}
