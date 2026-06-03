'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, QrCode, Sparkles } from 'lucide-react'
import { VENUE_EMOJI } from '@/lib/mock-data'
import type { Location } from '@/lib/types'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/hooks/useAuth'

interface VenueRow {
  id:           string
  slug:         string
  name:         string
  tagline:      string
  category:     Location['category']
  coordinates:  { lat: number; lng: number }
  radiusMeters: number
  isActive:     boolean
  isPremium:    boolean
  liveCount:    number
  createdAt:    string
}

function StatTile({
  label, value, sub, color = 'text-wia-purple',
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <GlassCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-wia-ink/55 mb-1">{label}</div>
      <div className={`font-display text-3xl font-bold ${color} leading-none mb-1`}>{value}</div>
      {sub && <div className="text-xs text-wia-ink/60">{sub}</div>}
    </GlassCard>
  )
}

function Row({ venue }: { venue: VenueRow }) {
  const emoji = VENUE_EMOJI[venue.category as keyof typeof VENUE_EMOJI] ?? '📍'
  return (
    <Link
      href={`/admin/venues/${venue.slug}`}
      className="glass rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display font-semibold text-wia-ink">{venue.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-wia-ink/55 capitalize">
            {venue.category}
          </span>
        </div>
        <div className="text-xs text-wia-ink/60 font-mono truncate">wia.com/{venue.slug}</div>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <LiveBadge count={venue.liveCount} size="sm" />
      </div>
      <ArrowRight size={16} className="text-wia-ink/55 group-hover:text-wia-ink group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}

export default function AdminDashboard() {
  const { user, ready } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const isVenueOwner = user?.role === 'venue_owner'

  const [venues,  setVenues]  = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready || !user) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/admin/venues/list', { credentials: 'include', cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setVenues([])
          return
        }
        const { venues: list } = await res.json()
        if (!cancelled) setVenues(list ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [ready, user])

  const totalLive = venues.reduce((sum, v) => sum + v.liveCount, 0)
  const hasVenue  = venues.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink mb-1">
            {isVenueOwner && !hasVenue ? 'Welcome to WIA' : 'Backoffice'}
          </h1>
          <p className="text-wia-ink/55 text-sm">
            {isSuperAdmin
              ? 'Manage every venue on the platform. Monitor live activity, edit settings.'
              : hasVenue
                ? 'Manage your venue, generate QR codes, monitor live guests.'
                : 'Create your venue in under a minute. Get a printable QR code, watch your room come to life.'}
          </p>
        </div>

        {(isSuperAdmin || (isVenueOwner && !hasVenue)) && (
          <Link
            href="/admin/venues/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus size={16} />
            {isSuperAdmin ? 'Add venue' : 'Create my venue'}
          </Link>
        )}
      </div>

      {(isSuperAdmin || hasVenue) && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile
            label={isSuperAdmin ? 'Active venues' : 'Your venue'}
            value={venues.length}
            sub={isSuperAdmin ? 'platform-wide' : 'live and accepting guests'}
            color="text-wia-purple"
          />
          <StatTile label="People live now" value={totalLive} sub="across your venues" color="text-wia-green" />
          <StatTile label="Status" value={loading ? '…' : 'OK'} sub="Supabase connected" color="text-wia-cyan" />
        </div>
      )}

      <div>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-wia-ink">
            {isSuperAdmin ? 'All venues' : 'Your venue'}
          </h2>
          {venues.length > 0 && (
            <span className="text-xs text-wia-ink/60">{venues.length} total</span>
          )}
        </div>

        {loading && (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
          </div>
        )}

        {!loading && !hasVenue && (
          <GlassCard className="p-8 text-center border-dashed border-wia-ink/15">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-wia-purple/10 border border-wia-purple/30 mb-3 items-center justify-center">
              {isVenueOwner ? <Sparkles size={20} className="text-wia-purple" /> : <QrCode size={20} className="text-wia-purple" />}
            </div>
            <h3 className="font-display font-semibold text-wia-ink mb-1">
              {isVenueOwner ? 'Set up your venue' : 'Create your first venue'}
            </h3>
            <p className="text-sm text-wia-ink/55 mb-4 max-w-sm mx-auto">
              {isVenueOwner
                ? 'Tell us where you are. We\'ll generate QR codes you can print and place on tables — guests scan to enter your room.'
                : 'Add a venue, get a QR code for each table, and watch your guests discover each other.'}
            </p>
            <Link
              href="/admin/venues/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wia-purple/20 border border-wia-purple/40 text-wia-purple text-sm font-medium hover:bg-wia-purple/30 transition-all"
            >
              <Plus size={14} />
              {isVenueOwner ? 'Create my venue' : 'New venue'}
            </Link>
          </GlassCard>
        )}

        {!loading && hasVenue && (
          <div className="space-y-2">
            {venues.map(v => <Row key={v.id} venue={v} />)}
          </div>
        )}
      </div>
    </div>
  )
}
