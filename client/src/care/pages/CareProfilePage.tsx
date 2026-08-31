'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Check, Heart, User } from 'lucide-react'
import { useProfile, type Profile } from '../../renderer/src/context/ProfileContext'
import { NOTION_AVATAR_URLS, resolveAvatarUrl } from '../../lib/notionAvatars'
import UserAvatar from '../../renderer/src/components/UserAvatar'
import { usePatient } from '../context/PatientContext'
import {
  BLOOD_GROUPS,
  COMMON_TIMEZONES,
  calculateBmi,
  bmiCategory,
  formToProfile,
  getPatientProfile,
  mergeProfile,
  profileToForm,
  savePatientProfile,
  type GenderOption,
  type HeightUnit,
  type PatientProfileForm,
  type WeightUnit,
} from '../patientProfileStorage'
import { BLUE, LIGHT_BLUE, MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'

type ProfileTab = 'basic' | 'contact' | 'health'

const TABS: { id: ProfileTab; label: string; icon: typeof User }[] = [
  { id: 'basic', label: 'Basic info', icon: User },
  { id: 'contact', label: 'Emergency', icon: Heart },
  { id: 'health', label: 'Health metrics', icon: Activity },
]

const PRONOUN_OPTIONS = ['She/Her', 'He/Him', 'They/Them', 'She/They', 'He/They', 'Prefer not to say']

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const emptyForm = (): PatientProfileForm => ({
  displayName: '',
  heightUnit: 'cm',
  weightUnit: 'kg',
  dateOfBirth: '',
  preferredName: '',
  pronouns: '',
  phone: '',
  email: '',
  location: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  heightValue: '',
  heightFt: '',
  heightIn: '',
  weightValue: '',
  bloodGroup: '',
  bodyTemperature: '',
  waistCircumference: '',
})

export default function CareProfilePage() {
  const { profile, setProfile, hydrated } = useProfile()
  const { patientId, selectedPatient } = usePatient()
  const [form, setForm] = useState<PatientProfileForm>(emptyForm)
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const loadForm = useCallback(() => {
    if (!selectedPatient) return
    const stored = getPatientProfile(patientId)
    const merged = mergeProfile(selectedPatient, stored)
    setForm(profileToForm(merged))
  }, [patientId, selectedPatient])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  const bmi = useMemo(() => {
    const heightCm =
      form.heightUnit === 'ft'
        ? (() => {
            const ft = parseInt(form.heightFt, 10) || 0
            const inches = parseInt(form.heightIn, 10) || 0
            if (ft <= 0 && inches <= 0) return undefined
            return (ft * 12 + inches) * 2.54
          })()
        : parseFloat(form.heightValue) || undefined
    const weightKg =
      form.weightUnit === 'lb'
        ? (parseFloat(form.weightValue) || 0) / 2.20462
        : parseFloat(form.weightValue) || undefined
    return calculateBmi(heightCm, weightKg)
  }, [form.heightUnit, form.heightFt, form.heightIn, form.heightValue, form.weightUnit, form.weightValue])

  if (!hydrated) return null

  if (!profile || !selectedPatient) {
    return (
      <div style={{ padding: '48px 36px', fontFamily: sansFont, color: MUTED }}>
        No profile yet. Launch the app from the welcome page to set up your profile.
      </div>
    )
  }

  const patch = (updates: Partial<PatientProfileForm>) => setForm((prev) => ({ ...prev, ...updates }))

  const save = () => {
    const trimmed = form.displayName.trim()
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.')
      setActiveTab('basic')
      return
    }

    const next = formToProfile({ ...form, displayName: trimmed })
    savePatientProfile(patientId, next)

    const legacyGender =
      next.gender === 'male' || next.gender === 'female' ? next.gender : undefined
    setProfile({
      ...profile,
      name: next.displayName,
      age: next.age,
      gender: legacyGender,
      avatarUrl: next.avatarUrl,
    })

    setError('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const displayLabel = (form.preferredName ?? '').trim() || form.displayName.trim() || selectedPatient.name

  return (
    <div
      className="care-profile-page"
      style={{
        fontFamily: sansFont,
        minHeight: '100%',
        background: `
          radial-gradient(ellipse 55% 45% at 100% 0%, rgba(62,196,192,0.08), transparent 50%),
          radial-gradient(ellipse 50% 40% at 0% 30%, rgba(26,26,232,0.06), transparent 50%),
          ${LIGHT_BLUE}
        `,
        padding: '28px 36px 72px',
        boxSizing: 'border-box',
      }}
    >
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <p style={eyebrowStyle}>Account · Profile</p>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: NAVY, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Your <strong style={{ fontWeight: 600 }}>profile</strong>
        </h1>
        <p style={{ fontSize: 14, color: '#4a4a78', margin: 0, lineHeight: 1.55 }}>
          Details for <strong>{selectedPatient.name}</strong> — stored on this device only.
        </p>
      </motion.header>

      <div className="care-profile-layout">
        <motion.aside
          className="care-profile-sidebar"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, borderRadius: 12, padding: '24px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <UserAvatar name={form.displayName || selectedPatient.name} src={form.avatarUrl} size={88} />
            <p style={{ fontSize: 17, fontWeight: 600, color: NAVY, margin: '14px 0 2px', lineHeight: 1.3 }}>
              {displayLabel}
            </p>
            {(form.preferredName ?? '').trim() &&
            form.displayName.trim() &&
            (form.preferredName ?? '').trim() !== form.displayName.trim() ? (
              <p style={{ fontSize: 12, color: MUTED, margin: '0 0 6px' }}>{form.displayName}</p>
            ) : null}
            <p style={sidebarMetaStyle}>Patient profile</p>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bmi != null && (
              <SidebarStat label="BMI" value={String(bmi)} hint={bmiCategory(bmi)} accent={TEAL} />
            )}
            {form.bloodGroup ? (
              <SidebarStat label="Blood group" value={form.bloodGroup} />
            ) : null}
            {form.location ? <SidebarStat label="Location" value={form.location} /> : null}
          </div>

          <p style={{ fontSize: 12, color: MUTED, margin: '18px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
            Member since {formatMemberSince(profile.createdAt)}
          </p>
        </motion.aside>

        <motion.div
          className="care-profile-main"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          style={{ ...cardStyle, borderRadius: 12, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div className="care-profile-tabs" role="tablist" aria-label="Profile sections">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`care-profile-tab${active ? ' care-profile-tab--active' : ''}`}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="care-profile-tab-panel" role="tabpanel">
            {activeTab === 'basic' && (
              <>
                <p className="care-profile-tab-intro">Identity, contact details, and avatar for this patient.</p>
                <div className="care-profile-grid">
                  <Field label="Display name">
                    <input
                      value={form.displayName}
                      onChange={(e) => {
                        patch({ displayName: e.target.value })
                        if (error) setError('')
                      }}
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Preferred name">
                    <input
                      value={form.preferredName}
                      onChange={(e) => patch({ preferredName: e.target.value })}
                      placeholder="What we call you"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Date of birth">
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => patch({ dateOfBirth: e.target.value })}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Age">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={form.age ?? ''}
                      onChange={(e) =>
                        patch({ age: e.target.value ? parseInt(e.target.value, 10) : undefined })
                      }
                      placeholder="e.g. 34"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Pronouns">
                    <select
                      value={form.pronouns}
                      onChange={(e) => patch({ pronouns: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select pronouns</option>
                      {PRONOUN_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Gender">
                    <select
                      value={form.gender ?? ''}
                      onChange={(e) =>
                        patch({ gender: (e.target.value || undefined) as GenderOption | undefined })
                      }
                      style={inputStyle}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => patch({ phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => patch({ email: e.target.value })}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      value={form.location}
                      onChange={(e) => patch({ location: e.target.value })}
                      placeholder="City, region"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Timezone">
                    <select
                      value={form.timezone}
                      onChange={(e) => patch({ timezone: e.target.value })}
                      style={inputStyle}
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Avatar" span={2}>
                    <div className="care-profile-avatars">
                      {NOTION_AVATAR_URLS.map((url, i) => {
                        const selected = form.avatarUrl === url
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() => patch({ avatarUrl: url })}
                            title={`Avatar ${i + 1}`}
                            className={`care-profile-avatar-btn${selected ? ' care-profile-avatar-btn--selected' : ''}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" width={44} height={44} />
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          avatarUrl: resolveAvatarUrl(
                            form.displayName.trim() || selectedPatient.name,
                            undefined,
                          ),
                        })
                      }
                      style={textBtnStyle}
                    >
                      Reset to default for name
                    </button>
                  </Field>
                </div>
              </>
            )}

            {activeTab === 'contact' && (
              <>
                <p className="care-profile-tab-intro">
                  Someone we can reach if you need urgent help during a care episode.
                </p>
                <div className="care-profile-grid">
                  <Field label="Contact name">
                    <input
                      value={form.emergencyName}
                      onChange={(e) => patch({ emergencyName: e.target.value })}
                      placeholder="Full name"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Relationship">
                    <input
                      value={form.emergencyRelationship}
                      onChange={(e) => patch({ emergencyRelationship: e.target.value })}
                      placeholder="Spouse, parent, friend…"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Phone" span={2}>
                    <input
                      type="tel"
                      value={form.emergencyPhone}
                      onChange={(e) => patch({ emergencyPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </>
            )}

            {activeTab === 'health' && (
              <>
                <p className="care-profile-tab-intro">
                  Vitals and body metrics — BMI is calculated from height and weight.
                </p>
                <div className="care-profile-grid">
                  <Field label="Height">
                    <UnitToggle
                      options={[
                        { value: 'cm', label: 'cm' },
                        { value: 'ft', label: 'ft & in' },
                      ]}
                      value={form.heightUnit}
                      onChange={(v) => patch({ heightUnit: v as HeightUnit })}
                    />
                    {form.heightUnit === 'cm' ? (
                      <input
                        value={form.heightValue}
                        onChange={(e) => patch({ heightValue: e.target.value })}
                        placeholder="e.g. 170"
                        style={{ ...inputStyle, marginTop: 8 }}
                      />
                    ) : (
                      <div className="care-profile-dual-input">
                        <input
                          value={form.heightFt}
                          onChange={(e) => patch({ heightFt: e.target.value })}
                          placeholder="ft"
                          style={inputStyle}
                        />
                        <input
                          value={form.heightIn}
                          onChange={(e) => patch({ heightIn: e.target.value })}
                          placeholder="in"
                          style={inputStyle}
                        />
                      </div>
                    )}
                  </Field>

                  <Field label="Weight">
                    <UnitToggle
                      options={[
                        { value: 'kg', label: 'kg' },
                        { value: 'lb', label: 'lb' },
                      ]}
                      value={form.weightUnit}
                      onChange={(v) => patch({ weightUnit: v as WeightUnit })}
                    />
                    <input
                      value={form.weightValue}
                      onChange={(e) => patch({ weightValue: e.target.value })}
                      placeholder={form.weightUnit === 'kg' ? 'e.g. 68' : 'e.g. 150'}
                      style={{ ...inputStyle, marginTop: 8 }}
                    />
                  </Field>

                  <Field label="BMI (calculated)">
                    <div
                      style={{
                        ...inputStyle,
                        background: LIGHT_BLUE,
                        border: '1.5px solid #e8e8f2',
                        color: bmi != null ? NAVY : MUTED,
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: 46,
                      }}
                    >
                      {bmi != null ? `${bmi} — ${bmiCategory(bmi)}` : 'Enter height & weight'}
                    </div>
                  </Field>

                  <Field label="Blood group">
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => patch({ bloodGroup: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Blood pressure (mmHg)">
                    <div className="care-profile-bp">
                      <input
                        type="number"
                        min={50}
                        max={250}
                        value={form.bloodPressureSystolic ?? ''}
                        onChange={(e) =>
                          patch({
                            bloodPressureSystolic: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                        placeholder="120"
                        style={inputStyle}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        min={30}
                        max={150}
                        value={form.bloodPressureDiastolic ?? ''}
                        onChange={(e) =>
                          patch({
                            bloodPressureDiastolic: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                        placeholder="80"
                        style={inputStyle}
                      />
                    </div>
                  </Field>

                  <Field label="Resting heart rate (bpm)">
                    <input
                      type="number"
                      min={30}
                      max={220}
                      value={form.restingHeartRate ?? ''}
                      onChange={(e) =>
                        patch({
                          restingHeartRate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="e.g. 72"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Body temperature (°C)">
                    <input
                      value={form.bodyTemperature}
                      onChange={(e) => patch({ bodyTemperature: e.target.value })}
                      placeholder="e.g. 36.6"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="SpO₂ (%)">
                    <input
                      type="number"
                      min={70}
                      max={100}
                      value={form.spo2 ?? ''}
                      onChange={(e) =>
                        patch({ spo2: e.target.value ? parseInt(e.target.value, 10) : undefined })
                      }
                      placeholder="e.g. 98"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Respiratory rate (breaths/min)">
                    <input
                      type="number"
                      min={8}
                      max={40}
                      value={form.respiratoryRate ?? ''}
                      onChange={(e) =>
                        patch({
                          respiratoryRate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="e.g. 16"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Waist circumference (cm)">
                    <input
                      value={form.waistCircumference}
                      onChange={(e) => patch({ waistCircumference: e.target.value })}
                      placeholder="e.g. 82"
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </>
            )}
          </div>

          <div className="care-profile-footer">
            {error ? <p className="care-profile-error">{error}</p> : null}
            <div className="care-profile-footer-row">
              <button type="button" onClick={save} style={saveBtnStyle}>
                Save profile
              </button>
              {saved && (
                <span className="care-profile-saved">
                  <Check size={16} />
                  Saved for {selectedPatient.name.split(' ')[0]}
                </span>
              )}
            </div>
            <p className="care-profile-footnote">
              Each demo patient has their own profile on this device. Switch profiles in the sidebar to
              edit another person&apos;s details.
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .care-profile-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .care-profile-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #ececf4;
          background: #fafaff;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .care-profile-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          background: transparent;
          color: ${MUTED};
          font-family: ${monoFont};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }

        .care-profile-tab:hover {
          color: ${NAVY};
          background: rgba(26, 26, 232, 0.03);
        }

        .care-profile-tab--active {
          color: ${BLUE};
          border-bottom-color: ${BLUE};
          background: #fff;
        }

        .care-profile-tab-panel {
          padding: 24px 28px 8px;
          flex: 1;
        }

        .care-profile-tab-intro {
          font-size: 13px;
          color: #4a4a78;
          line-height: 1.55;
          margin: 0 0 20px;
        }

        .care-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 20px;
          align-items: start;
        }

        .care-profile-field {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .care-profile-field--span-2 {
          grid-column: 1 / -1;
        }

        .care-profile-avatars {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
          gap: 8px;
        }

        .care-profile-avatar-btn {
          padding: 4px;
          border-radius: 10px;
          border: 2px solid #e0e0f0;
          background: #fff;
          cursor: pointer;
        }

        .care-profile-avatar-btn img {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 8px;
        }

        .care-profile-avatar-btn--selected {
          border-color: ${BLUE};
          background: #f0f0fd;
        }

        .care-profile-dual-input {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .care-profile-bp {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 8px;
          align-items: center;
        }

        .care-profile-bp span {
          color: ${MUTED};
          font-size: 14px;
          text-align: center;
        }

        .care-profile-footer {
          padding: 18px 28px 22px;
          border-top: 1px solid #ececf4;
          background: #fafaff;
        }

        .care-profile-footer-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .care-profile-error {
          font-size: 13px;
          color: #c83030;
          margin: 0 0 10px;
        }

        .care-profile-saved {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: ${TEAL};
          font-weight: 600;
        }

        .care-profile-footnote {
          font-size: 12px;
          color: ${MUTED};
          margin: 12px 0 0;
          line-height: 1.5;
        }

        @media (max-width: 960px) {
          .care-profile-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .care-profile-page {
            padding: 16px 16px 48px !important;
          }

          .care-profile-grid {
            grid-template-columns: 1fr;
          }

          .care-profile-field--span-2 {
            grid-column: auto;
          }

          .care-profile-tab-panel,
          .care-profile-footer {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  )
}

function SidebarStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: LIGHT_BLUE,
        borderRadius: 10,
        padding: '10px 12px',
        textAlign: 'left',
      }}
    >
      <p style={{ ...sidebarMetaStyle, margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: accent ?? NAVY, margin: 0 }}>{value}</p>
      {hint ? <p style={{ fontSize: 11, color: TEAL, margin: '2px 0 0' }}>{hint}</p> : null}
    </div>
  )
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: `1.5px solid ${value === opt.value ? BLUE : '#e0e0f0'}`,
            background: value === opt.value ? '#f0f0fd' : '#fff',
            color: value === opt.value ? NAVY : MUTED,
            fontFamily: monoFont,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Field({
  label,
  children,
  span,
}: {
  label: string
  children: React.ReactNode
  span?: 2
}) {
  return (
    <div className={span === 2 ? 'care-profile-field care-profile-field--span-2' : 'care-profile-field'}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MUTED,
  margin: '0 0 8px',
}

const sidebarMetaStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: MUTED,
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1.5px solid #e0e0f0',
  fontFamily: sansFont,
  fontSize: 15,
  color: NAVY,
  outline: 'none',
  background: '#fff',
  minHeight: 46,
}

const textBtnStyle: React.CSSProperties = {
  marginTop: 10,
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: monoFont,
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: TEAL,
  cursor: 'pointer',
}

const saveBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 8,
  border: 'none',
  background: BLUE,
  color: '#fff',
  fontFamily: monoFont,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}
