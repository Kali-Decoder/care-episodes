'use client'

import type { ReactNode } from 'react'
import MainLayout from '../../renderer/src/components/MainLayout'
import { MOCK_PROFILE } from '../../renderer/src/mock/api'

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return <MainLayout profile={MOCK_PROFILE}>{children}</MainLayout>
}
