'use client'

import type { Booking } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { cardStyle, formatSlot, MUTED, NAVY, TEAL, monoFont } from '../ui'

const BOOKING_COLOR: Record<Booking['status'], string> = {
  requested: '#cc8a00',
  confirmed: TEAL,
  no_response: '#c83030',
  failed: '#c83030',
}

export default function BookingsCard({ bookings }: { bookings: Booking[] }) {
  return (
    <section style={cardStyle}>
      <SectionLabel>Bookings</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bookings.map((b) => (
          <div
            key={b.idempotency_key}
            style={{
              padding: '14px 16px',
              border: '1px solid #e0e0f0',
              borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: NAVY, margin: '0 0 4px' }}>{b.test_code}</p>
                <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{b.lab_name}</p>
              </div>
              <StatusPill color={BOOKING_COLOR[b.status]}>{b.status}</StatusPill>
            </div>
            <p style={{ fontFamily: monoFont, fontSize: 11, color: NAVY, margin: '0 0 4px' }}>
              Requested {formatSlot(b.requested_at)}
            </p>
            {b.slot_hold && (
              <p style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, margin: 0 }}>
                Slot hold {formatSlot(b.slot_hold)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
