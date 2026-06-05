'use client'

import { use, useEffect, useState } from 'react'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Trash2, MapPin, Sparkles, ImagePlus, Save, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
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
  const tabParam    = searchParams.get('tab')
  const { user } = useAuth()

  const [venue,        setVenue]        = useState<(Location & { scanSecret: string; ownerId: string | null; imageUrl: string | null }) | null>(null)
  const [liveCount,    setLiveCount]    = useState(0)
  const [loaded,       setLoaded]       = useState(false)
  const [forbidden,    setForbidden]    = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [tab,          setTab]          = useState<'overview' | 'analytics'>(tabParam === 'analytics' ? 'analytics' : 'overview')
  // Edit venue fields
  const [editName,     setEditName]     = useState('')
  const [editTagline,  setEditTagline]  = useState('')
  const [editRadius,   setEditRadius]   = useState(50)
  const [savingVenue,  setSavingVenue]  = useState(false)
  const [venueMsg,     setVenueMsg]     = useState<string | null>(null)
  // Change password
  const [newPassword,  setNewPassword]  = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [savingPw,     setSavingPw]     = useState(false)
  const [pwMsg,        setPwMsg]        = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/admin/venues/${encodeURIComponent(slug)}`, {
          credentials: 'include',
          cache:       'no-store',
        })
        if (cancelled) return
        if (res.status === 401) { window.location.assign('/admin/login'); return }
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
        const v = { ...json.venue, createdAt: new Date(json.venue.createdAt), imageUrl: json.venue.imageUrl ?? null }
        setVenue(v)
        setEditName(v.name ?? '')
        setEditTagline(v.tagline ?? '')
        setEditRadius(v.radiusMeters ?? 50)
        setLiveCount(json.liveCount ?? 0)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

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

  async function handleImageUpload(file: File) {
    setUploadingImg(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      try {
        const res = await fetch(`/api/admin/venues/${encodeURIComponent(venue!.slug)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        })
        const json = await res.json()
        if (json.ok) setVenue(v => v ? { ...v, imageUrl: json.imageUrl } : v)
      } finally {
        setUploadingImg(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveVenue(e: React.FormEvent) {
    e.preventDefault()
    setSavingVenue(true); setVenueMsg(null)
    try {
      const res = await fetch(`/api/admin/venues/${encodeURIComponent(venue!.slug)}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, tagline: editTagline, radiusMeters: editRadius }),
      })
      const json = await res.json()
      if (!res.ok) { setVenueMsg(json.error ?? 'Failed to save'); return }
      setVenue(v => v ? { ...v, name: editName, tagline: editTagline, radiusMeters: editRadius } : v)
      setVenueMsg('✓ Saved')
      setTimeout(() => setVenueMsg(null), 3000)
    } finally { setSavingVenue(false) }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setPwMsg('Minimum 8 characters'); return }
    setSavingPw(true); setPwMsg(null)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const json = await res.json()
      if (!res.ok) { setPwMsg(json.error ?? 'Failed'); return }
      setNewPassword('')
      setPwMsg('✓ Password updated')
      setTimeout(() => setPwMsg(null), 3000)
    } finally { setSavingPw(false) }
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

      {/* Tab bar */}
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {(['overview', 'analytics'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? 'bg-white shadow text-wia-ink'
                : 'text-wia-ink/50 hover:text-wia-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab venueSlug={slug} />}

      {tab === 'overview' && <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-display font-semibold text-wia-ink">Cover image</h2>
            {(imagePreview ?? venue.imageUrl) ? (
              <div className="relative rounded-xl overflow-hidden h-44">
                <Image src={imagePreview ?? venue.imageUrl!} alt="Cover" fill className="object-cover" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm font-medium flex items-center gap-1.5">
                    <ImagePlus size={16} /> Change photo
                  </span>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                </label>
                {uploadingImg && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-wia-ink/20 hover:border-wia-purple/40 cursor-pointer transition-colors">
                {uploadingImg ? (
                  <div className="w-6 h-6 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={20} className="text-wia-ink/40" />
                    <span className="text-sm text-wia-ink/50">Click to upload a cover photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
              </label>
            )}
            <p className="text-[11px] text-wia-ink/50">Shown as a banner in the room when guests scan in.</p>
          </GlassCard>

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

          <GlassCard className="p-5 space-y-3">
            <h2 className="font-display font-semibold text-wia-ink">Location & geofence</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-wia-ink/60">Geofence radius</span>
              <span className="font-mono text-wia-ink font-medium">{venue.radiusMeters}m</span>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${venue.coordinates.lat}&mlon=${venue.coordinates.lng}&zoom=18`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-wia-purple/80 hover:text-wia-purple transition-colors"
            >
              <MapPin size={12} />
              View venue on map
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

          {/* Edit venue */}
          <GlassCard className="p-5">
            <h2 className="font-display font-semibold text-wia-ink mb-4">Edit venue</h2>
            <form onSubmit={handleSaveVenue} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-wia-ink/60 mb-1.5">Venue name</label>
                <input
                  value={editName} onChange={e => setEditName(e.target.value)}
                  maxLength={60} required
                  className="w-full glass rounded-xl px-4 py-2.5 text-wia-ink placeholder:text-wia-ink/40 outline-none focus:ring-1 focus:ring-wia-purple/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-wia-ink/60 mb-1.5">Tagline</label>
                <input
                  value={editTagline} onChange={e => setEditTagline(e.target.value)}
                  maxLength={80} placeholder="Optional short description"
                  className="w-full glass rounded-xl px-4 py-2.5 text-wia-ink placeholder:text-wia-ink/40 outline-none focus:ring-1 focus:ring-wia-purple/50 text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-wia-ink/60">Geofence radius</label>
                  <span className="text-xs font-mono text-wia-ink">{editRadius}m</span>
                </div>
                <input type="range" min={10} max={500} step={5} value={editRadius}
                  onChange={e => setEditRadius(parseInt(e.target.value))}
                  className="w-full accent-wia-purple"
                />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingVenue}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Save size={14} />
                  {savingVenue ? 'Saving…' : 'Save changes'}
                </button>
                {venueMsg && (
                  <span className={`text-sm ${venueMsg.startsWith('✓') ? 'text-emerald-500' : 'text-red-400'}`}>
                    {venueMsg}
                  </span>
                )}
              </div>
            </form>
          </GlassCard>

          {/* Change password */}
          <GlassCard className="p-5">
            <h2 className="font-display font-semibold text-wia-ink mb-4">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-wia-ink/60 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters" minLength={8}
                    className="w-full glass rounded-xl px-4 py-2.5 pr-10 text-wia-ink placeholder:text-wia-ink/40 outline-none focus:ring-1 focus:ring-wia-purple/50 text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-wia-ink/40 hover:text-wia-ink/70"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingPw || newPassword.length < 8}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Save size={14} />
                  {savingPw ? 'Updating…' : 'Update password'}
                </button>
                {pwMsg && (
                  <span className={`text-sm ${pwMsg.startsWith('✓') ? 'text-emerald-500' : 'text-red-400'}`}>
                    {pwMsg}
                  </span>
                )}
              </div>
            </form>
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
      </div>}
    </div>
  )
}
