'use client'

export type AuthUser = {
  /** Google `sub` (stable id). */
  googleId: string
  email: string
  googleName: string
  picture?: string
  /** Display name chosen after Google sign-in. */
  username: string
  createdAt: string
}

export type GoogleIdentity = {
  googleId: string
  email: string
  googleName: string
  picture?: string
}

const SESSION_KEY = 'naniai.auth.session'
const USERS_KEY = 'naniai.auth.users'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readSession(): AuthUser | null {
  const user = readJson<AuthUser | null>(SESSION_KEY, null)
  if (!user?.googleId || !user.username?.trim()) return null
  return user
}

export function writeSession(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (!user) {
    window.localStorage.removeItem(SESSION_KEY)
    return
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function readRegisteredUser(googleId: string): AuthUser | null {
  const users = readJson<Record<string, AuthUser>>(USERS_KEY, {})
  const user = users[googleId]
  if (!user?.username?.trim()) return null
  return user
}

export function registerUser(user: AuthUser): AuthUser {
  const users = readJson<Record<string, AuthUser>>(USERS_KEY, {})
  users[user.googleId] = user
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  writeSession(user)
  return user
}

export function clearSession() {
  writeSession(null)
}
