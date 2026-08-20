import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedLifeSim — Sandbox for Real-World Health Scenarios',
  description:
    'A privacy-first on-device medical AI sandbox powered by QVAC MedPsy. Explore health scenarios without the cloud.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  )
}
