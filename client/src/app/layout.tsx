import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'NaniAi — care that follows up, like family would',
  description:
    "Upload a prescription. NaniAi handles the rest — labs, waiting, and knowing when something's changed.",
  applicationName: 'NaniAi',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'NaniAi — care that follows up, like family would',
    description:
      "Upload a prescription. NaniAi handles the rest — labs, waiting, and knowing when something's changed.",
    siteName: 'NaniAi',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'NaniAi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaniAi — care that follows up, like family would',
    description:
      "Upload a prescription. NaniAi handles the rest — labs, waiting, and knowing when something's changed.",
    images: ['/og.png'],
  },
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
