import { resolveAvatarUrl } from '../lib/notionAvatars'
import type { Patient } from './types'

const STORAGE_KEY = 'naniai.patient_profiles'

export type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type HeightUnit = 'cm' | 'ft'
export type WeightUnit = 'kg' | 'lb'

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface PatientLocalProfile {
  displayName: string
  age?: number
  gender?: GenderOption
  avatarUrl?: string
  dateOfBirth?: string
  preferredName?: string
  pronouns?: string
  phone?: string
  email?: string
  location?: string
  timezone?: string
  emergencyContact?: EmergencyContact
  heightCm?: number
  weightKg?: number
  heightUnit: HeightUnit
  weightUnit: WeightUnit
  bloodGroup?: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  restingHeartRate?: number
  bodyTemperatureC?: number
  spo2?: number
  respiratoryRate?: number
  waistCircumferenceCm?: number
  updatedAt?: string
}

export type PatientProfileForm = {
  displayName: string
  age?: number
  gender?: GenderOption
  avatarUrl?: string
  dateOfBirth: string
  preferredName: string
  pronouns: string
  phone: string
  email: string
  location: string
  timezone: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelationship: string
  heightUnit: HeightUnit
  weightUnit: WeightUnit
  heightValue: string
  heightFt: string
  heightIn: string
  weightValue: string
  bloodGroup: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  restingHeartRate?: number
  bodyTemperature: string
  spo2?: number
  respiratoryRate?: number
  waistCircumference: string
  updatedAt?: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export { BLOOD_GROUPS }

function readAll(): Record<string, PatientLocalProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, PatientLocalProfile>
  } catch {
    return {}
  }
}

function writeAll(profiles: Record<string, PatientLocalProfile>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function getPatientProfile(patientId: string): PatientLocalProfile | null {
  return readAll()[patientId] ?? null
}

export function savePatientProfile(patientId: string, profile: PatientLocalProfile) {
  const all = readAll()
  all[patientId] = { ...profile, updatedAt: new Date().toISOString() }
  writeAll(all)
}

export function defaultProfileForPatient(patient: Patient): PatientLocalProfile {
  return {
    displayName: patient.name,
    location: patient.city,
    avatarUrl: resolveAvatarUrl(patient.name, undefined),
    heightUnit: 'cm',
    weightUnit: 'kg',
  }
}

export function mergeProfile(
  patient: Patient,
  stored: PatientLocalProfile | null,
): PatientLocalProfile {
  const base = defaultProfileForPatient(patient)
  if (!stored) return base
  return {
    ...base,
    ...stored,
    displayName: stored.displayName?.trim() || base.displayName,
    location: stored.location?.trim() || base.location,
    avatarUrl: stored.avatarUrl || base.avatarUrl,
    heightUnit: stored.heightUnit ?? 'cm',
    weightUnit: stored.weightUnit ?? 'kg',
  }
}

export function profileToForm(profile: PatientLocalProfile): PatientProfileForm {
  const heightCm = profile.heightCm
  const weightKg = profile.weightKg

  let heightValue = ''
  let heightFt = ''
  let heightIn = ''
  if (heightCm != null && heightCm > 0) {
    if (profile.heightUnit === 'ft') {
      const totalIn = heightCm / 2.54
      const ft = Math.floor(totalIn / 12)
      const inches = Math.round(totalIn - ft * 12)
      heightFt = String(ft)
      heightIn = String(inches)
    } else {
      heightValue = String(Math.round(heightCm * 10) / 10)
    }
  }

  let weightValue = ''
  if (weightKg != null && weightKg > 0) {
    weightValue =
      profile.weightUnit === 'lb'
        ? String(Math.round(weightKg * 2.20462 * 10) / 10)
        : String(Math.round(weightKg * 10) / 10)
  }

  return {
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    avatarUrl: profile.avatarUrl,
    dateOfBirth: profile.dateOfBirth ?? '',
    preferredName: profile.preferredName ?? '',
    pronouns: profile.pronouns ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    emergencyName: profile.emergencyContact?.name ?? '',
    emergencyPhone: profile.emergencyContact?.phone ?? '',
    emergencyRelationship: profile.emergencyContact?.relationship ?? '',
    heightUnit: profile.heightUnit,
    weightUnit: profile.weightUnit,
    heightValue,
    heightFt,
    heightIn,
    weightValue,
    bloodGroup: profile.bloodGroup ?? '',
    bloodPressureSystolic: profile.bloodPressureSystolic,
    bloodPressureDiastolic: profile.bloodPressureDiastolic,
    restingHeartRate: profile.restingHeartRate,
    bodyTemperature:
      profile.bodyTemperatureC != null ? String(Math.round(profile.bodyTemperatureC * 10) / 10) : '',
    spo2: profile.spo2,
    respiratoryRate: profile.respiratoryRate,
    waistCircumference:
      profile.waistCircumferenceCm != null ? String(profile.waistCircumferenceCm) : '',
    updatedAt: profile.updatedAt,
  }
}

function parseOptionalInt(value: string): number | undefined {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseOptionalFloat(value: string): number | undefined {
  const n = parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function heightToCm(form: PatientProfileForm): number | undefined {
  if (form.heightUnit === 'ft') {
    const ft = parseOptionalInt(form.heightFt) ?? 0
    const inches = parseOptionalInt(form.heightIn) ?? 0
    if (ft <= 0 && inches <= 0) return undefined
    return (ft * 12 + inches) * 2.54
  }
  return parseOptionalFloat(form.heightValue)
}

function weightToKg(form: PatientProfileForm): number | undefined {
  const raw = parseOptionalFloat(form.weightValue)
  if (raw == null) return undefined
  return form.weightUnit === 'lb' ? raw / 2.20462 : raw
}

function tempToC(value: string): number | undefined {
  const raw = parseOptionalFloat(value)
  if (raw == null) return undefined
  // Form stores °C when heightUnit is cm (metric mode) — use weightUnit as proxy? Better: always store °C in form for simplicity.
  return raw
}

export function formToProfile(form: PatientProfileForm): PatientLocalProfile {
  const emergencyName = form.emergencyName.trim()
  const emergencyPhone = form.emergencyPhone.trim()
  const emergencyRelationship = form.emergencyRelationship.trim()

  return {
    displayName: form.displayName.trim(),
    age: form.age,
    gender: form.gender,
    avatarUrl: form.avatarUrl,
    dateOfBirth: form.dateOfBirth.trim() || undefined,
    preferredName: form.preferredName.trim() || undefined,
    pronouns: form.pronouns.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    location: form.location.trim() || undefined,
    timezone: form.timezone.trim() || undefined,
    emergencyContact:
      emergencyName || emergencyPhone
        ? {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelationship,
          }
        : undefined,
    heightCm: heightToCm(form),
    weightKg: weightToKg(form),
    heightUnit: form.heightUnit,
    weightUnit: form.weightUnit,
    bloodGroup: form.bloodGroup || undefined,
    bloodPressureSystolic: form.bloodPressureSystolic,
    bloodPressureDiastolic: form.bloodPressureDiastolic,
    restingHeartRate: form.restingHeartRate,
    bodyTemperatureC: tempToC(form.bodyTemperature),
    spo2: form.spo2,
    respiratoryRate: form.respiratoryRate,
    waistCircumferenceCm: parseOptionalFloat(form.waistCircumference),
    updatedAt: form.updatedAt,
  }
}

export function calculateBmi(heightCm?: number, weightKg?: number): number | undefined {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return undefined
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
]
