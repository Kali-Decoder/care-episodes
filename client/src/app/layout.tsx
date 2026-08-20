import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Care Episode Agent — Patient view',
  description:
    'Upload a prescription and follow your care episode as AI agents book labs, wait for results, and explain findings in plain language.',
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
