'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { listPatients } from '../api'
import { DEFAULT_PATIENT_ID, MOCK_PATIENTS } from '../patients'
import type { Patient } from '../types'

const STORAGE_KEY = 'naniai.patient_id'

interface PatientContextType {
  patients: Patient[]
  patientId: string
  selectedPatient: Patient | undefined
  setPatientId: (patientId: string) => void
  hydrated: boolean
  loading: boolean
}

const PatientContext = createContext<PatientContextType | null>(null)

function readStoredPatientId(): string {
  if (typeof window === 'undefined') return DEFAULT_PATIENT_ID
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PATIENT_ID
  } catch {
    return DEFAULT_PATIENT_ID
  }
}

function writeStoredPatientId(patientId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, patientId)
}

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS)
  const [patientId, setPatientIdState] = useState(DEFAULT_PATIENT_ID)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPatientIdState(readStoredPatientId())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    void (async () => {
      try {
        const list = await listPatients()
        if (!cancelled && list.length > 0) setPatients(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated])

  const setPatientId = useCallback((nextId: string) => {
    setPatientIdState(nextId)
    writeStoredPatientId(nextId)
  }, [])

  const selectedPatient = useMemo(
    () => patients.find((p) => p.patient_id === patientId) ?? patients[0],
    [patients, patientId],
  )

  return (
    <PatientContext.Provider
      value={{ patients, patientId, selectedPatient, setPatientId, hydrated, loading }}
    >
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const context = useContext(PatientContext)
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider')
  }
  return context
}
