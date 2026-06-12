'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Users, Heart, Eye, Clock, MapPin, AlertCircle, Loader } from 'lucide-react'
import type { Location } from '@/lib/types'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { getCurrentCoords, haversineMeters, GPS_GRACE_METERS, GeoError } from '@/lib/geo'
import { LocationHelp } from './LocationHelp'

interface StepWelcomeProps {
  location:    Location
  liveCount:   number
  onContinue:  () => void
  isReturning?: boolean
}

const BENEFITS = [
  {
    icon:  Users,
    title: 'See who is here right now',
    sub:   'Every person physically present in this room. Not who lives nearby — who is HERE.',
    color: 'text-wia-purple',
  },
  {
    icon:  Heart,
    title: 'Like, match, chat',
    sub:   'Send up to 5 likes. When someone likes you back, chat opens up.',
    color: 'text-wia-pink',
  },
  {
    icon:  Eye,
    title: 'You stay private to outsiders',
    sub:   "People not at this venue can't see you. Your presence is local.",
    color: 'text-wia-cyan',
  },
  {
    icon:  Clock,
    title: 'Disappears when you leave',
    sub:   'Your room identity is temporary. Step outside the venue and you disconnect automatically.',
    color: 'text-wia-green',
  },
]

type GpsState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'too_far'; distance: number }
  | { status: 'denied' }
  | { status: 'error';   message: string }

export function StepWelcome({ location, liveCount, onContinue, isReturning }: StepWelcomeProps) {
  const emoji = VENUE_EMOJI[location.category]
  const [gps, setGps] = useState<GpsState>({ status: 'idle' })

  async function handleContinue() {
    setGps({ status: 'checking' })
    try {
      const here = await getCurrentCoords()
      const dist = haversineMeters(here, location.coordinates)
      const limit = location.radiusMeters + GPS_GRACE_METERS
      if (dist > limit) {
        setGps({ status: 'too_far', distance: dist })
        return
      }
      // Within range — advance
      onContinue()
    } catch (e) {
      if (e instanceof GeoError && e.kind === 'denied') setGps({ status: 'denied' })
      else setGps({ status: 'error', message: e instanceof Error ? e.message : 'Location check failed' })
    }
  }

  const checking = gps.status === 'checking'

  return (
    <div className="space-y-7">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-emerald-500/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-xs text-emerald-300">QR verified · you&apos;re at the venue</span>
        </div>

        {location.coverImageUrl ? (
          <div className="relative w-full h-36 rounded-2xl overflow-hidden -mx-0 mb-1">
            <Image src={location.coverImageUrl} alt={location.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
          </div>
        ) : (
          <div className="inline-block text-5xl mb-1">{emoji}</div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink leading-tight">
          {isReturning ? 'Welcome back to ' : 'Welcome to '}
          <span className="gradient-text">{location.name}</span>
        </h1>

        {liveCount > 0 ? (
          <p className="text-wia-ink/60">
            <strong className="text-wia-ink">{liveCount} {liveCount === 1 ? 'person is' : 'people are'}</strong> here right now.
          </p>
        ) : (
          <p className="text-wia-ink/50">Be the first one in the room.</p>
        )}
      </div>

      {!isReturning && (
        <div className="space-y-3">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className="glass rounded-2xl px-4 py-3.5 flex items-start gap-3"
              style={{ animation: `enter 0.4s ${i * 80}ms backwards ease-out` }}
            >
              <div className={`shrink-0 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${b.color}`}>
                <b.icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-wia-ink">{b.title}</div>
                <div className="text-xs text-wia-ink/50 leading-relaxed mt-0.5">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GPS error states */}
      {gps.status === 'too_far' && (
        <div className="glass-strong rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-300" />
            <div>
              <div className="text-sm font-semibold text-amber-200">
                You&apos;re too far from {location.name}
              </div>
              <div className="text-xs text-amber-200/70 mt-0.5">
                You&apos;re about <strong>{Math.round(gps.distance)}m</strong> away. The room is only joinable within {location.radiusMeters}m of the venue. Walk closer and try again.
              </div>
            </div>
          </div>
        </div>
      )}
      {gps.status === 'denied' && (
        <LocationHelp onRetry={handleContinue} checking={checking} />
      )}
      {gps.status === 'error' && (
        <div className="glass-strong rounded-2xl p-4 border border-red-500/30 bg-red-500/5 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-300" />
            <div>
              <div className="text-sm font-semibold text-red-200">Location check failed</div>
              <div className="text-xs text-red-200/70 mt-0.5">{gps.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold text-base hover:opacity-90 transition-all shadow-xl shadow-purple-500/30 disabled:opacity-70"
      >
        {checking ? (
          <>
            <Loader size={18} className="animate-spin" />
            Verifying your location...
          </>
        ) : gps.status === 'too_far' || gps.status === 'error' || gps.status === 'denied' ? (
          <>
            <MapPin size={18} />
            Try again
          </>
        ) : (
          <>
            {isReturning ? 'Set up this visit' : 'Join the room'}
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <p className="text-center text-xs text-wia-ink/55 leading-relaxed max-w-sm mx-auto flex items-center justify-center gap-1">
        <MapPin size={11} className="text-wia-purple/60" />
        We&apos;ll ask for your location to verify you&apos;re actually at the venue.
      </p>
    </div>
  )
}
