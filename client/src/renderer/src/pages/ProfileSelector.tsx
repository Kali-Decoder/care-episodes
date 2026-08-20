import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { BLUE, TEAL, NAVY, MUTED, monoFont, sansFont } from '../theme'

type ProfileType = 'self' | 'family' | 'doctor' | 'community'

interface Profile {
  id: string
  name: string
  type: ProfileType
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
}

interface ProfileSelectorProps {
  profiles?: Profile[]
  onSelect: (profile: Profile) => void
  onCreateProfile: (profileData: Omit<Profile, 'id' | 'createdAt'>) => void
}

const profileTypeOptions = [
  { id: 'self', label: 'For yourself' },
  { id: 'family', label: 'For a family member' },
  { id: 'doctor', label: 'You are a doctor' },
  { id: 'community', label: 'You are a community leader' },
]

function Wordmark() {
  return (
    <p style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', color: BLUE, margin: 0 }}>
      <span style={{ color: NAVY }}>MedLife</span>Sim
    </p>
  )
}

/** Thin 2px teal accent bar at top of card */
function TealBar() {
  return <div style={{ height: 3, background: TEAL, borderRadius: '4px 4px 0 0' }} />
}

function CreateProfileForm({
  onComplete,
  onBack,
}: {
  onComplete: (profile: Omit<Profile, 'id' | 'createdAt'>) => void
  onBack: () => void
}) {
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')

  const handleTypeSelect = (type: ProfileType) => {
    setProfileType(type)
    setStep('details')
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onComplete({
      name,
      type: profileType!,
      age: profileType === 'self' ? (parseInt(age) || undefined) : undefined,
      gender: profileType === 'self' ? (gender || undefined) : undefined,
    })
  }

  const backBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: monoFont,
        fontSize: 12,
        color: MUTED,
        letterSpacing: '0.06em',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      ← back
    </button>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid #d0d0e8`,
    borderRadius: 6,
    fontFamily: sansFont,
    fontSize: 14,
    color: NAVY,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: MUTED,
    marginBottom: 6,
    fontFamily: monoFont,
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
      {step === 'type' ? (
        <>
          {backBtn(onBack)}
          <p style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
            New profile
          </p>
          <h2 style={{ fontFamily: sansFont, fontSize: 20, fontWeight: 300, color: NAVY, marginBottom: 24, lineHeight: 1.3 }}>
            Who are you creating<br /><strong style={{ fontWeight: 500 }}>this profile for?</strong>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profileTypeOptions.map((type, i) => (
              <motion.button
                key={type.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect(type.id as ProfileType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 16px',
                  background: '#f7f7fc',
                  border: `1px solid #e0e0f0`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 0,
                  background: i === 0 ? BLUE : TEAL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: monoFont, fontWeight: 700, fontSize: 12, color: '#fff',
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: sansFont, fontSize: 14, color: NAVY }}>{type.label}</span>
                <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 18 }}>›</span>
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <>
          {backBtn(() => setStep('type'))}
          <p style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
            Profile details
          </p>
          <h2 style={{ fontFamily: sansFont, fontSize: 20, fontWeight: 300, color: NAVY, marginBottom: 28, lineHeight: 1.3 }}>
            <strong style={{ fontWeight: 500 }}>Create</strong> your profile
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Enter name"
            />
          </div>

          {profileType === 'self' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={inputStyle}
                  placeholder="Enter age"
                />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: `2px solid ${gender === g ? BLUE : '#e0e0f0'}`,
                        borderRadius: 6,
                        background: gender === g ? '#f0f0fd' : '#fff',
                        color: gender === g ? NAVY : MUTED,
                        fontFamily: monoFont,
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!name.trim() || (profileType === 'self' && !gender)}
            style={{
              width: '100%',
              padding: '13px 0',
              background: BLUE,
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontFamily: monoFont,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              opacity: !name.trim() || (profileType === 'self' && !gender) ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            CREATE PROFILE
          </motion.button>
        </>
      )}
    </motion.div>
  )
}

export default function ProfileSelector({ onSelect, onCreateProfile }: ProfileSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [localProfiles, setLocalProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load profiles when component mounts
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      if (window.api?.profiles) {
        const loadedProfiles = await window.api.profiles.getAll()
        setLocalProfiles(loadedProfiles)
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateComplete = (profileData: Omit<Profile, 'id' | 'createdAt'>) => {
    onCreateProfile(profileData)
    setShowCreateForm(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 56,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: sansFont,
      }}
    >
      {/* ── SEABW geometric blocks ── */}
      <div style={{ position: 'absolute', top: 0, right: 180, width: 200, height: 160, background: TEAL, zIndex: 1 }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 80, background: BLUE, zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 80, right: 0, width: 320, height: 240, background: BLUE, zIndex: 2 }} />
      {/* Teal left-edge accent */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 100, background: TEAL, zIndex: 5 }} />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'relative',
          zIndex: 10,
          background: '#fff',
          borderRadius: 0,
          border: `1px solid #e0e0f0`,
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        <TealBar />

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <Wordmark />
            <span style={{ fontFamily: monoFont, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase' }}>
              Private & On-Device AI
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <span style={{ fontFamily: monoFont, fontSize: 12, color: MUTED, letterSpacing: '0.1em' }}>
                LOADING PROFILES...
              </span>
            </div>
          ) : (
            <>
              {!showCreateForm ? (
                <>
                  <p style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
                    Profiles
                  </p>
                  <h1 style={{ fontFamily: sansFont, fontSize: 24, fontWeight: 300, color: NAVY, marginBottom: 24, lineHeight: 1.2 }}>
                    <strong style={{ fontWeight: 500 }}>Select</strong> a profile<br />to continue
                  </h1>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {localProfiles.length === 0 && (
                      <p style={{ fontSize: 13, color: MUTED, marginBottom: 8, fontFamily: sansFont }}>
                        No profiles yet — create one to get started.
                      </p>
                    )}

                    {localProfiles.map((profile) => (
                      <motion.button
                        key={profile.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(profile)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '12px 14px',
                          background: '#f7f7fc',
                          border: '1px solid #e0e0f0',
                          borderRadius: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, background: BLUE,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: monoFont, fontWeight: 700, fontSize: 12, color: '#fff',
                          flexShrink: 0,
                        }}>
                          {profile.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ display: 'block', fontFamily: sansFont, fontSize: 14, fontWeight: 500, color: NAVY }}>{profile.name}</span>
                          <span style={{ fontFamily: monoFont, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{profile.type}</span>
                        </div>
                        <span style={{ color: TEAL, fontSize: 20 }}>›</span>
                      </motion.button>
                    ))}

                    {/* Create new */}
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateForm(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 14px',
                        background: '#fff',
                        border: `2px dashed ${TEAL}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        marginTop: 4,
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, background: TEAL,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: monoFont, fontWeight: 700, fontSize: 18, color: '#fff',
                        flexShrink: 0,
                      }}>
                        +
                      </div>
                      <span style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '0.1em', color: '#085041', textTransform: 'uppercase' }}>
                        Create new profile
                      </span>
                    </motion.button>
                  </div>
                </>
              ) : (
                <CreateProfileForm
                  onComplete={handleCreateComplete}
                  onBack={() => setShowCreateForm(false)}
                />
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}