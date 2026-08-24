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
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  clearSession,
  readRegisteredUser,
  readSession,
  registerUser,
  type AuthUser,
  type GoogleIdentity,
} from './authStorage'
import {
  getFirebaseAuth,
  googleClientId,
  isFirebaseConfigured,
  isGoogleAuthConfigured,
} from './firebase'

type AuthPhase = 'loading' | 'signed_out' | 'needs_username' | 'ready'

type AuthContextValue = {
  user: AuthUser | null
  googleIdentity: GoogleIdentity | null
  phase: AuthPhase
  hydrated: boolean
  configured: boolean
  signInWithGoogle: () => Promise<void>
  completeRegistration: (username: string) => AuthUser
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gis]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleGis = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity'))
    document.head.appendChild(script)
  })
}

function firebaseUserToIdentity(user: FirebaseUser): GoogleIdentity {
  return {
    googleId: user.uid,
    email: user.email || '',
    googleName: user.displayName?.trim() || user.email?.split('@')[0] || 'User',
    picture: user.photoURL || undefined,
  }
}

async function signInViaFirebase(): Promise<GoogleIdentity> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase Auth is not configured')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return firebaseUserToIdentity(result.user)
}

type UserInfoResponse = {
  sub?: string
  email?: string
  name?: string
  picture?: string
}

async function signInViaGis(): Promise<GoogleIdentity> {
  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set (copy backend OAUTH_CLIENT_ID)')
  }
  await loadGisScript()

  return new Promise((resolve, reject) => {
    const google = window.google
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services unavailable'))
      return
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: (response) => {
        void (async () => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'Google sign-in was cancelled'))
            return
          }
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
            if (!res.ok) throw new Error('Could not load Google profile')
            const data = (await res.json()) as UserInfoResponse
            if (!data.sub || !data.email) throw new Error('Google profile missing identity')
            resolve({
              googleId: data.sub,
              email: data.email,
              googleName: data.name?.trim() || data.email.split('@')[0] || 'User',
              picture: data.picture,
            })
          } catch (err) {
            reject(err)
          }
        })()
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Google sign-in failed'))
      },
    })

    client.requestAccessToken({ prompt: 'select_account' })
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [googleIdentity, setGoogleIdentity] = useState<GoogleIdentity | null>(null)
  const [phase, setPhase] = useState<AuthPhase>('loading')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const session = readSession()
    if (session) {
      setUser(session)
      setPhase('ready')
      setHydrated(true)
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setPhase('signed_out')
      setHydrated(true)
      return
    }

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setGoogleIdentity(null)
        setPhase('signed_out')
        setHydrated(true)
        return
      }
      const identity = firebaseUserToIdentity(fbUser)
      const existing = readRegisteredUser(identity.googleId)
      if (existing) {
        setUser(existing)
        setGoogleIdentity(identity)
        setPhase('ready')
      } else {
        setGoogleIdentity(identity)
        setUser(null)
        setPhase('needs_username')
      }
      setHydrated(true)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const identity = isFirebaseConfigured() ? await signInViaFirebase() : await signInViaGis()
    const existing = readRegisteredUser(identity.googleId)
    if (existing) {
      setUser(existing)
      setGoogleIdentity(identity)
      setPhase('ready')
      return
    }
    setGoogleIdentity(identity)
    setUser(null)
    setPhase('needs_username')
  }, [])

  const completeRegistration = useCallback(
    (username: string) => {
      if (!googleIdentity) {
        throw new Error('Sign in with Google before choosing a username')
      }
      const trimmed = username.trim()
      if (trimmed.length < 2) {
        throw new Error('Please enter a username (at least 2 characters)')
      }
      const next = registerUser({
        googleId: googleIdentity.googleId,
        email: googleIdentity.email,
        googleName: googleIdentity.googleName,
        picture: googleIdentity.picture,
        username: trimmed,
        createdAt: new Date().toISOString(),
      })
      setUser(next)
      setPhase('ready')
      return next
    },
    [googleIdentity],
  )

  const signOut = useCallback(async () => {
    clearSession()
    setUser(null)
    setGoogleIdentity(null)
    setPhase('signed_out')
    const auth = getFirebaseAuth()
    if (auth) await firebaseSignOut(auth)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      googleIdentity,
      phase,
      hydrated,
      configured: isGoogleAuthConfigured(),
      signInWithGoogle,
      completeRegistration,
      signOut,
    }),
    [user, googleIdentity, phase, hydrated, signInWithGoogle, completeRegistration, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
