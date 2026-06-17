'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, MapPin, Check, ImagePlus, X } from 'lucide-react'
import Image from 'next/image'
import { slugify, getBaseUrl } from '@/lib/api/venues'
import { VENUE_EMOJI } from '@/lib/mock-data'
import type { VenueCategory } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n/I18nProvider'

const CATEGORIES: { value: VenueCategory; labelKey: string }[] = [
  { value: 'bar', labelKey: 'venueNew.cBar' }, { value: 'club', labelKey: 'venueNew.cClub' },
  { value: 'cafe', labelKey: 'venueNew.cCafe' }, { value: 'festival', labelKey: 'venueNew.cFestival' },
  { value: 'campus', labelKey: 'venueNew.cCampus' }, { value: 'gym', labelKey: 'venueNew.cGym' },
  { value: 'coworking', labelKey: 'venueNew.cCoworking' }, { value: 'hotel', labelKey: 'venueNew.cHotel' },
  { value: 'airport', labelKey: 'venueNew.cAirport' }, { value: 'beach', labelKey: 'venueNew.cBeach' },
  { value: 'event', labelKey: 'venueNew.cEvent' },
]

export default function NewVenuePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [name,        setName]        = useState('')
  const [slug,        setSlug]        = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [category,    setCategory]    = useState<VenueCategory>('bar')
  const [tagline,     setTagline]     = useState('')
  const [lat,         setLat]         = useState('')
  const [lng,         setLng]         = useState('')
  const [radius,      setRadius]      = useState(50)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  const finalSlug = slugTouched ? slug : slugify(name)
  const url = useMemo(() => `${getBaseUrl()}/${finalSlug || 'your-venue'}`, [finalSlug])

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)) },
      () => setError(t('venueNew.errReadLoc')),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) return setError(t('venueNew.errName'))
    if (!finalSlug)              return setError(t('venueNew.errSlug'))
    const latNum = parseFloat(lat); const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return setError(t('venueNew.errLoc'))
    if (radius < 10 || radius > 1000)   return setError(t('venueNew.errRadius'))

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
          imageDataUrl: imageDataUrl ?? undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(err.error ?? `Failed to create venue (${res.status})`)
      }
      const { slug: createdSlug } = await res.json()
      router.push(`/admin/venues/${createdSlug}?created=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('venueNew.errCreate'))
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-wia-ink/50 hover:text-wia-ink transition-colors mb-6"
      >
        <ArrowLeft size={14} className="rtl-mirror" />
        {t("venueNew.back")}
      </Link>

      <h1 className="font-display text-3xl font-bold text-wia-ink mb-2">{t("venueNew.title")}</h1>
      <p className="text-wia-ink/50 text-sm mb-8">
        {t("venueNew.sub")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">{t("venueNew.name")}</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder={t("venueNew.namePh")} maxLength={60}
              className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">{t("venueNew.slug")}</label>
            <div className="flex items-center gap-2 glass rounded-xl ps-4 py-3 pe-2 font-mono text-sm">
              <span className="text-wia-ink/55">{getBaseUrl().replace(/^https?:\/\//, '')}/</span>
              <input
                value={finalSlug}
                onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true) }}
                placeholder={t("venueNew.slugPh")}
                className="flex-1 bg-transparent text-wia-ink placeholder:text-wia-ink/50 outline-none"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-wia-ink/55">{t("venueNew.slugHint")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">{t("venueNew.category")}</label>
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
                  <span>{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">
              {t('venueNew.tagline')} <span className="text-wia-ink/55">{t('venueNew.optional')}</span>
            </label>
            <input
              value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder={t("venueNew.taglinePh")} maxLength={80}
              className="w-full glass rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">
              {t('venueNew.cover')} <span className="text-wia-ink/55">{t('venueNew.optional')}</span>
            </label>
            {imageDataUrl ? (
              <div className="relative rounded-xl overflow-hidden h-40">
                <Image src={imageDataUrl} alt={t("venueNew.coverAlt")} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className="absolute top-2 end-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-wia-ink/20 hover:border-wia-purple/40 cursor-pointer transition-colors">
                <ImagePlus size={20} className="text-wia-ink/40" />
                <span className="text-sm text-wia-ink/50">{t("venueNew.coverUpload")}</span>
                <input
                  type="file" accept="image/*" className="sr-only"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = ev => setImageDataUrl(ev.target?.result as string)
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-wia-ink">{t("venueNew.location")}</h3>
              <p className="text-xs text-wia-ink/60 mt-0.5">{t("venueNew.locationSub")}</p>
            </div>
            <button
              type="button" onClick={useCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-wia-ink/15 hover:bg-white/10 text-wia-ink/70 hover:text-wia-ink text-xs transition-all"
            >
              <MapPin size={12} />
              {t("venueNew.useMyLocation")}
            </button>
          </div>

          {lat && lng ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm">
              <MapPin size={14} className="shrink-0" />
              {t("venueNew.locationCaptured")}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
              <MapPin size={14} className="shrink-0" />
              {t('venueNew.locationPrompt')}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-wia-ink/60">{t("venueNew.radius")}</label>
              <span className="text-sm font-mono text-wia-ink">{radius}m</span>
            </div>
            <input
              type="range" min={10} max={500} step={5} value={radius}
              onChange={e => setRadius(parseInt(e.target.value, 10))}
              className="w-full accent-wia-purple"
            />
            <p className="mt-1.5 text-[11px] text-wia-ink/55">
              {t("venueNew.radiusHint")}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 mb-2">{t("venueNew.urlPreview")}</div>
          <div className="font-mono text-sm text-wia-purple break-all">{url}</div>
        </GlassCard>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20"
          >
            {saving ? t('venueNew.creating') : (<><Check size={16} /> {t('venueNew.create')}</>)}
          </button>
          <Link
            href="/admin"
            className="px-5 py-3.5 rounded-xl glass border border-wia-ink/15 text-wia-ink/60 hover:text-wia-ink text-sm font-medium transition-all"
          >
            {t("venueNew.cancel")}
          </Link>
        </div>
      </form>
    </div>
  )
}
