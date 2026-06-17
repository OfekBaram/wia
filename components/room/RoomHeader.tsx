'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, LogOut, QrCode } from 'lucide-react'
import type { Location } from '@/lib/types'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface RoomHeaderProps {
  location: Location
  isMember?: boolean
  onLeave?: () => void
}

export function RoomHeader({ location, isMember, onLeave }: RoomHeaderProps) {
  const { t } = useI18n()
  const emoji = VENUE_EMOJI[location.category]

  async function leave() {
    if (!confirm(t('roomHeader.leaveConfirm', { venue: location.name }))) return
    await fetch('/api/leave', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId: location.id }),
    }).catch(() => {})
    onLeave?.()
    window.location.assign(`/${location.slug}`)
  }

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-wia-ink/10">
      {location.coverImageUrl && (
        <div className="relative h-28 sm:h-36 w-full overflow-hidden">
          <Image
            src={location.coverImageUrl}
            alt={location.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
          <div className="absolute bottom-3 left-4 sm:left-6">
            <h1 className="font-display font-bold text-white text-lg sm:text-2xl leading-tight drop-shadow">
              {location.name}
            </h1>
            {location.tagline && (
              <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow">{location.tagline}</p>
            )}
          </div>
          <div className="absolute bottom-3 right-4 sm:right-6">
            <LiveBadge count={location.liveCount} />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!location.coverImageUrl && <span className="text-xl sm:text-2xl shrink-0">{emoji}</span>}
            <div className="min-w-0 flex-1">
              {!location.coverImageUrl && (
                <h1 className="font-display font-bold text-wia-ink text-base sm:text-lg leading-tight truncate">
                  {location.name}
                </h1>
              )}
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-wia-ink/60 truncate">
                <MapPin size={10} className="shrink-0" />
                <span className="font-mono truncate">wia.com/{location.slug}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {!location.coverImageUrl && <LiveBadge count={location.liveCount} />}
          </div>

          {isMember ? (
            <button
              onClick={leave}
              className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl glass border border-wia-ink/15 text-wia-ink/60 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('roomHeader.leave')}</span>
            </button>
          ) : (
            <Link
              href="/scan"
              className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              <QrCode size={14} />
              {t('roomHeader.scanToJoin')}
            </Link>
          )}
        </div>

        {!location.coverImageUrl && (
          <div className="flex sm:hidden items-center mt-3">
            <LiveBadge count={location.liveCount} size="sm" />
          </div>
        )}
      </div>
    </header>
  )
}
