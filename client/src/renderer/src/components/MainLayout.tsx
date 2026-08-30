'use client'

import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import AppNavbar from './AppNavbar'
import { LIGHT_BLUE } from '../theme'

interface Profile {
  id: string
  name: string
  type: 'self' | 'family' | 'doctor' | 'community'
  age?: number
  gender?: 'male' | 'female'
  createdAt: string
  avatarUrl?: string
}

export default function MainLayout({
  children,
  profile,
}: {
  profile?: Profile
  children?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: LIGHT_BLUE }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 200, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppNavbar profile={profile} />
        <main
          style={{
            flex: 1,
            background: LIGHT_BLUE,
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
