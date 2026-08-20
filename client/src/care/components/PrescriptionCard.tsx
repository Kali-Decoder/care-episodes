'use client'

import type { Prescription } from '../types'
import SectionLabel from '../../renderer/src/components/ui/SectionLabel'
import StatusPill from '../../renderer/src/components/ui/StatusPill'
import { cardStyle, MUTED, NAVY, TEAL, monoFont } from '../ui'

export default function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  return (
    <section style={cardStyle}>
      <SectionLabel>Prescription</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', margin: '0 0 4px' }}>
            Diagnosis
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: NAVY, margin: 0 }}>{prescription.diagnosis}</p>
        </div>
        <div>
          <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', margin: '0 0 4px' }}>
            Prescriber
          </p>
          <p style={{ fontSize: 15, color: NAVY, margin: 0 }}>{prescription.doctor}</p>
          <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>{prescription.date}</p>
        </div>
      </div>
      {prescription.medicines.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', margin: '0 0 8px' }}>
            Medicines
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#4a4a78', fontSize: 14, lineHeight: 1.6 }}>
            {prescription.medicines.map((m) => (
              <li key={m.name}>
                {m.name} — {m.dose}, {m.frequency}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p style={{ fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', margin: '0 0 10px' }}>
        Tests ordered
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prescription.tests.map((test) => (
          <div
            key={test.test_code}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: '#fafafe',
              borderRadius: 6,
              border: '1px solid #e0e0f0',
            }}
          >
            <span style={{ fontSize: 14, color: NAVY }}>{test.display_name}</span>
            <StatusPill color={test.urgency === 'urgent' ? '#c83030' : TEAL}>
              {test.urgency}
            </StatusPill>
          </div>
        ))}
      </div>
    </section>
  )
}
