import type { Metadata } from 'next'
import './globals.css'
import { AuthGate } from '@/components/auth/AuthGate'
import { FragmentErrorHandler } from '@/components/auth/FragmentErrorHandler'
import { I18nProvider } from '@/lib/i18n/I18nProvider'

// Runs before hydration so a saved Hebrew choice sets RTL on <html> with no flash.
const NO_FLASH_LOCALE = `(function(){try{var l=localStorage.getItem('wia:locale');if(l==='he'){document.documentElement.lang='he';document.documentElement.dir='rtl';}}catch(e){}})();`

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
    // dir/lang are set pre-hydration by NO_FLASH_LOCALE + the I18nProvider,
    // so the server's "en"/ltr won't match — suppress the expected warning.
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_LOCALE }} />
      </head>
      <body className="bg-wia-bg text-wia-ink antialiased">
        <I18nProvider>
          <FragmentErrorHandler />
          <AuthGate>{children}</AuthGate>
        </I18nProvider>
      </body>
    </html>
  )
}
