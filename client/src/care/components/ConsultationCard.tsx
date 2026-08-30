'use client'

import type { Consultation } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { cardStyle, formatSlot, MUTED, NAVY, TEAL, monoFont } from '../ui'

const STATUS_COLOR: Record<Consultation['status'], string> = {
  requested: '#D4924A',
  confirmed: TEAL,
  declined: '#C45C5C',
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
          <p style={{ fontFamily: monoFont, fontSize: 14, color: NAVY, margin: 0 }}>
            {formatSlot(consultation.proposed_slot)}
          </p>
        </div>
        <StatusPill color={STATUS_COLOR[consultation.status]}>{consultation.status}</StatusPill>
      </div>
    </section>
  )
}
