'use client'

import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import AppNavbar from './AppNavbar'

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
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 200, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppNavbar profile={profile} />
        <main
          style={{
            flex: 1,
            background: '#f7f7fc',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
