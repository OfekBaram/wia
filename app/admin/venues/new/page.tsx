'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, MapPin, Check } from 'lucide-react'
import { slugify, getBaseUrl } from '@/lib/api/venues'
import { VENUE_EMOJI } from '@/lib/mock-data'
import type { VenueCategory } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/cn'

const CATEGORIES: { value: VenueCategory; label: string }[] = [
  { value: 'bar', label: 'Bar' }, { value: 'club', label: 'Club' },
  { value: 'cafe', label: 'Cafe' }, { value: 'festival', label: 'Festival' },
  { value: 'campus', label: 'Campus' }, { value: 'gym', label: 'Gym' },
  { value: 'coworking', label: 'Coworking' }, { value: 'hotel', label: 'Hotel' },
  { value: 'airport', label: 'Airport' }, { value: 'beach', label: 'Beach' },
  { value: 'event', label: 'Event' },
]

export default function NewVenuePage() {
  const router = useRouter()
  const [name,        setName]        = useState('')
  const [slug,        setSlug]        = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [category,    setCategory]    = useState<VenueCategory>('bar')
  const [tagline,     setTagline]     = useState('')
  const [lat,         setLat]         = useState('')
  const [lng,         setLng]         = useState('')
  const [radius,      setRadius]      = useState(50)
  const [error,       setError]       = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  const finalSlug = slugTouched ? slug : slugify(name)
  const url = useMemo(() => `${getBaseUrl()}/${finalSlug || 'your-venue'}`, [finalSlug])

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)) },
      () => setError('Could not read your current location.'),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) return setError('Venue name is required.')
    if (!finalSlug)              return setError('Slug is required.')
    const latNum = parseFloat(lat); const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return setError('Enter valid coordinates (lat/lng).')
    if (radius < 10 || radius > 1000)   return setError('Radius must be between 10 and 1000 meters.')

    setSaving(true)
    try {
      // Server-side create — bypasses the browser SDK that hangs on auth.
      const res = await fetch('/api/admin/venues', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:         name.trim(),
          slug:         finalSlug,
          category,
          lat:          latNum,
          lng:          lngNum,
          radiusMeters: radius,
          tagline:      tagline.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(err.error ?? `Failed to create venue (${res.status})`)
      }
      const { slug: createdSlug } = await res.json()
      router.push(`/admin/venues/${createdSlug}?created=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create venue')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-wia-ink/50 hover:text-wia-ink transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      <h1 className="font-display text-3xl font-bold text-wia-ink mb-2">Add a new venue</h1>
      <p className="text-wia-ink/50 text-sm mb-8">
        Each venue gets a unique WIA URL and a printable QR code for tables.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">Venue name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. The Rooftop Bar" maxLength={60}
              className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">URL slug</label>
            <div className="flex items-center gap-2 glass rounded-xl pl-4 py-3 pr-2 font-mono text-sm">
              <span className="text-wia-ink/55">{getBaseUrl().replace(/^https?:\/\//, '')}/</span>
              <input
                value={finalSlug}
                onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true) }}
                placeholder="rooftop-bar"
                className="flex-1 bg-transparent text-wia-ink placeholder:text-wia-ink/50 outline-none"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-wia-ink/55">Letters, numbers, dashes only.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all',
                    category === c.value
                      ? 'bg-wia-purple/20 border-wia-purple/50 text-wia-ink'
                      : 'glass border-wia-ink/15 text-wia-ink/50 hover:text-wia-ink/80',
                  )}
                >
                  <span>{VENUE_EMOJI[c.value]}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">
              Tagline <span className="text-wia-ink/55">(optional)</span>
            </label>
            <input
              value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="A short hook for your venue" maxLength={80}
              className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-wia-ink">Location</h3>
              <p className="text-xs text-wia-ink/60 mt-0.5">Used to verify guests are physically here.</p>
            </div>
            <button
              type="button" onClick={useCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-xs transition-all"
            >
              <MapPin size={12} />
              Use my location
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-wia-ink/55 mb-1.5">Latitude</label>
              <input
                value={lat} onChange={e => setLat(e.target.value)} placeholder="32.085300" inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 font-mono text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-wia-ink/55 mb-1.5">Longitude</label>
              <input
                value={lng} onChange={e => setLng(e.target.value)} placeholder="34.781800" inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 font-mono text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-wia-ink/60">Geofence radius</label>
              <span className="text-sm font-mono text-wia-ink">{radius}m</span>
            </div>
            <input
              type="range" min={10} max={500} step={5} value={radius}
              onChange={e => setRadius(parseInt(e.target.value, 10))}
              className="w-full accent-wia-purple"
            />
            <p className="mt-1.5 text-[11px] text-wia-ink/55">
              Default 50m for indoor venues, ~200m for festivals.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-2">URL preview</div>
          <div className="font-mono text-sm text-wia-purple break-all">{url}</div>
        </GlassCard>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20"
          >
            {saving ? 'Creating...' : (<><Check size={16} /> Create venue</>)}
          </button>
          <Link
            href="/admin"
            className="px-5 py-3.5 rounded-xl glass border border-wia-ink/15 text-wia-ink/60 hover:text-wia-ink text-sm font-medium transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
