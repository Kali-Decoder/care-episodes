'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { BLUE, MUTED, NAVY, TEAL, monoFont, sansFont } from '../ui'

type PatientPickerProps = {
  /** Compact style for the app header. */
  variant?: 'header' | 'cards'
  onSelect?: (patientId: string) => void
}

export default function PatientPicker({ variant = 'header', onSelect }: PatientPickerProps) {
  const { patients, patientId, selectedPatient, setPatientId, loading } = usePatient()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (id: string) => {
    setPatientId(id)
    onSelect?.(id)
    setOpen(false)
  }

  if (variant === 'cards') {
    return (
      <div
        style={{
          display: 'grid',
          gap: 10,
          fontFamily: sansFont,
        }}
      >
        {patients.map((p) => {
          const selected = p.patient_id === patientId
          return (
            <button
              key={p.patient_id}
              type="button"
              disabled={loading}
              onClick={() => pick(p.patient_id)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 10,
                border: `1.5px solid ${selected ? BLUE : '#e0e0f0'}`,
                background: selected ? 'rgba(26,26,232,0.05)' : '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: sansFont,
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 600, color: NAVY, margin: '0 0 4px' }}>{p.name}</p>
              <p style={{ fontSize: 13, color: '#4a4a78', margin: '0 0 2px' }}>
                {p.city}
                {p.scenario ? ` · ${p.scenario}` : ''}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  const label = selectedPatient?.name ?? 'Select profile'

  return (
    <div ref={rootRef} style={{ position: 'relative', fontFamily: sansFont }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #e0e0f0',
          background: '#fff',
          color: NAVY,
          cursor: loading ? 'wait' : 'pointer',
          maxWidth: 260,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${TEAL}18`,
            color: TEAL,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <UserRound size={14} />
        </span>
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
          {selectedPatient?.scenario ? (
            <span
              style={{
                display: 'block',
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: MUTED,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedPatient.scenario}
            </span>
          ) : null}
        </span>
        <ChevronDown size={14} color={MUTED} style={{ flexShrink: 0 }} />
      </button>

      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 280,
            background: '#fff',
            border: '1px solid #e0e0f0',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(10, 10, 92, 0.12)',
            zIndex: 120,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontFamily: monoFont,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: 0,
              padding: '10px 14px 8px',
            }}
          >
            Demo profile
          </p>
          {patients.map((p) => {
            const selected = p.patient_id === patientId
            return (
              <button
                key={p.patient_id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(p.patient_id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  border: 'none',
                  borderTop: '1px solid #f0f0f8',
                  background: selected ? 'rgba(26,26,232,0.05)' : '#fff',
                  cursor: 'pointer',
                  fontFamily: sansFont,
                }}
              >
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: NAVY }}>{p.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#5a5a88', marginTop: 2 }}>
                  {p.city}
                  {p.scenario ? ` · ${p.scenario}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
