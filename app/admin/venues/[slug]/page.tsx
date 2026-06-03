'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Trash2, MapPin, Sparkles } from 'lucide-react'
import { venueRoomUrl, venueScanUrl } from '@/lib/api/venues'
import { VENUE_EMOJI } from '@/lib/mock-data'
import type { Location } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { QRCodePoster } from '@/components/admin/QRCodePoster'
import { useAuth } from '@/lib/hooks/useAuth'

interface Props { params: Promise<{ slug: string }> }

export default function AdminVenuePage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const justCreated = searchParams.get('created') === '1'
  const { user } = useAuth()

  const [venue,     setVenue]     = useState<(Location & { scanSecret: string; ownerId: string | null }) | null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [loaded,    setLoaded]    = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/admin/venues/${encodeURIComponent(slug)}`, {
          credentials: 'include',
          cache:       'no-store',
        })
        if (cancelled) return
        if (res.status === 403) {
          setForbidden(true); setLoaded(true); return
        }
        if (res.status === 404) {
          setVenue(null); setLoaded(true); return
        }
        if (!res.ok) {
          setVenue(null); setLoaded(true); return
        }
        const json = await res.json()
        if (cancelled) return
        // Coerce createdAt to Date for compatibility with the Location type
        setVenue({ ...json.venue, createdAt: new Date(json.venue.createdAt) })
        setLiveCount(json.liveCount ?? 0)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    if (user) load()
    return () => { cancelled = true }
  }, [slug, user])

  if (!loaded) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="font-display text-2xl font-bold text-wia-ink mb-2">Not your venue</h1>
        <p className="text-wia-ink/55 text-sm mb-4">
          This venue is owned by another account. You can only view venues you own.
        </p>
        <Link href="/admin" className="text-wia-purple hover:underline text-sm">← Back to dashboard</Link>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="font-display text-2xl font-bold text-wia-ink mb-2">Venue not found</h1>
        <Link href="/admin" className="text-wia-purple hover:underline text-sm">← Back to dashboard</Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!venue) return
    if (!confirm(`Delete "${venue.name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/venues/${encodeURIComponent(venue.slug)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    router.push('/admin')
  }

  const emoji   = VENUE_EMOJI[venue.category]
  const roomUrl = venueRoomUrl(venue.slug)
  const scanUrl = venueScanUrl(venue.slug, venue.scanSecret)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-wia-ink/50 hover:text-wia-ink transition-colors"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      {justCreated && (
        <GlassCard className="p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-wia-ink text-sm">Your venue is live</div>
            <div className="text-xs text-wia-ink/50 mt-0.5">
              Print the QR code below and place it on tables. Guests scan to enter.
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0">
            {emoji}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-wia-ink">{venue.name}</h1>
            {venue.tagline && <p className="text-wia-ink/50 text-sm">{venue.tagline}</p>}
            <p className="text-wia-ink/55 text-xs font-mono mt-1 capitalize">{venue.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LiveBadge count={liveCount} />
          <Link
            href={`/${venue.slug}`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-sm transition-all"
          >
            <ExternalLink size={14} />
            View public
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl glass border border-wia-ink/15 hover:bg-red-500/10 hover:border-red-500/30 text-white hover:text-red-300 transition-all"
            title="Delete venue"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-display font-semibold text-wia-ink">Venue link</h2>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-1">Public room URL</div>
              <div className="glass rounded-xl px-4 py-3 font-mono text-sm text-wia-ink/80 break-all">{roomUrl}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-1">QR-encoded URL</div>
              <div className="glass rounded-xl px-4 py-3 font-mono text-xs text-wia-purple/80 break-all">{scanUrl}</div>
              <p className="mt-1.5 text-[11px] text-wia-ink/55">
                This URL is what the QR code points to. The <code>scan</code> token unlocks the join flow.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <h2 className="font-display font-semibold text-wia-ink">Location & geofence</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-0.5">Lat</div>
                <div className="font-mono text-wia-ink/80">{venue.coordinates.lat.toFixed(5)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-0.5">Lng</div>
                <div className="font-mono text-wia-ink/80">{venue.coordinates.lng.toFixed(5)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-0.5">Radius</div>
                <div className="font-mono text-wia-ink/80">{venue.radiusMeters}m</div>
              </div>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${venue.coordinates.lat}&mlon=${venue.coordinates.lng}&zoom=18`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-wia-purple/80 hover:text-wia-purple transition-colors"
            >
              <MapPin size={12} />
              View on map
            </a>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-display font-semibold text-wia-ink mb-3">Live activity</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-wia-green">{liveCount}</div>
                <div className="text-xs text-wia-ink/60">Here now</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-wia-purple">—</div>
                <div className="text-xs text-wia-ink/60">Peak today</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-wia-pink">—</div>
                <div className="text-xs text-wia-ink/60">Avg stay</div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="p-5">
            <h2 className="font-display font-semibold text-wia-ink mb-1">Table QR code</h2>
            <p className="text-xs text-wia-ink/60 mb-5">
              Print and place on every table. Guests must scan to enter the room.
            </p>
            <QRCodePoster venueName={venue.name} url={scanUrl} />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
