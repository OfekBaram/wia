// PWA manifest — lets users "Add to Home Screen" on iOS/Android and get
// a proper WIA app icon instead of a screenshot.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name:             'WIA – Who Is Around',
    short_name:       'WIA',
    description:      'See who\'s physically here right now.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#0a0612',
    theme_color:      '#a855f7',
    icons: [
      { src: '/icon.svg',       sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  })
}
