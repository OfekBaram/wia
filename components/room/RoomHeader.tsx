'use client'

import Link from 'next/link'
import { Ghost, Settings, MapPin, LogOut, QrCode } from 'lucide-react'
import type { Location } from '@/lib/types'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { leaveVenue } from '@/lib/api/presence'

interface RoomHeaderProps {
  location: Location
  isMember?: boolean
  onLeave?: () => void
}

export function RoomHeader({ location, isMember, onLeave }: RoomHeaderProps) {
  const emoji = VENUE_EMOJI[location.category]

  async function leave() {
    await leaveVenue(location.id).catch(() => {})
    onLeave?.()
    window.dispatchEvent(new CustomEvent('wia:left'))
  }

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-wia-ink/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">{emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-bold text-wia-ink text-base sm:text-lg leading-tight truncate">
                {location.name}
              </h1>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-wia-ink/60 truncate">
                <MapPin size={10} className="shrink-0" />
                <span className="font-mono truncate">wia.com/{location.slug}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <LiveBadge count={location.liveCount} />
            <button className="p-2 rounded-xl glass hover:bg-white/10 transition-colors text-wia-ink/60 hover:text-wia-ink" title="Ghost mode">
              <Ghost size={18} />
            </button>
            <button className="p-2 rounded-xl glass hover:bg-white/10 transition-colors text-wia-ink/60 hover:text-wia-ink" title="Settings">
              <Settings size={18} />
            </button>
          </div>

          {isMember ? (
            <button
              onClick={leave}
              className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl glass border border-wia-ink/15 text-white text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Leave</span>
            </button>
          ) : (
            <Link
              href="/scan"
              className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              <QrCode size={14} />
              Scan to join
            </Link>
          )}
        </div>

        <div className="flex sm:hidden items-center justify-between gap-2 mt-3">
          <LiveBadge count={location.liveCount} size="sm" />
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg glass text-wia-ink/60 hover:text-wia-ink" title="Ghost mode">
              <Ghost size={16} />
            </button>
            <button className="p-1.5 rounded-lg glass text-wia-ink/60 hover:text-wia-ink" title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
