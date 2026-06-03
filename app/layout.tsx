import type { Metadata } from 'next'
import './globals.css'
import { AuthGate } from '@/components/auth/AuthGate'
import { FragmentErrorHandler } from '@/components/auth/FragmentErrorHandler'

export const metadata: Metadata = {
  title: {
    default:  'WIA – Who Is Around',
    template: '%s · WIA',
  },
  description: 'See who\'s physically here right now. The live social layer on top of every place.',
  keywords: ['social discovery', 'real-time', 'location', 'live', 'people nearby'],
  applicationName: 'WIA',
  authors: [{ name: 'WIA' }],
  manifest: '/manifest.webmanifest',
  themeColor: '#a855f7',
  openGraph: {
    title:       'WIA – Who Is Around',
    description: 'See who\'s physically here right now.',
    type:        'website',
    siteName:    'WIA',
  },
  twitter: {
    card:        'summary',
    title:       'WIA – Who Is Around',
    description: 'See who\'s physically here right now.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-wia-bg text-wia-ink antialiased">
        <FragmentErrorHandler />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  )
}
