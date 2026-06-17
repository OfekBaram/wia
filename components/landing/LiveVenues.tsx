'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QrCode, Lock, Plus, Sparkles } from 'lucide-react'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { GlassCard } from '@/components/ui/GlassCard'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface VenueItem {
  slug: string; name: string; tagline: string; category: string
  liveCount: number; coordinates: { lat: number; lng: number }
}

export function LiveVenues() {
  const { t } = useI18n()
  const [venues,  setVenues]  = useState<VenueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/venues/list', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!cancelled) setVenues(d.venues ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section id="nearby" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-3 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-emerald-400 text-sm font-medium">{t('venues.activeNow')}</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-wia-ink">
              {t('venues.title')}
            </h2>
          </div>
        </div>

        <p className="text-wia-ink/60 text-sm sm:text-base mb-10 max-w-2xl flex items-start gap-2">
          <Lock size={14} className="mt-0.5 shrink-0 text-wia-purple" />
          {t('venues.lockNote')}
        </p>

        {loading && (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
          </div>
        )}

        {!loading && venues.length === 0 && (
          <GlassCard className="p-10 sm:p-14 text-center border-dashed border-wia-ink/15">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-wia-purple/20 to-wia-pink/20 border border-wia-purple/30 mb-4 items-center justify-center">
              <Sparkles size={22} className="text-wia-purple" />
            </div>
            <h3 className="font-display text-2xl font-bold text-wia-ink mb-2">
              {t('venues.emptyTitle')}
            </h3>
            <p className="text-wia-ink/50 max-w-md mx-auto mb-6">
              {t('venues.emptyBody')}
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              <Plus size={16} />
              {t('venues.listCta')}
            </Link>
          </GlassCard>
        )}

        {!loading && venues.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {venues.map((venue) => (
              <GlassCard
                key={venue.slug}
                className="p-5 border border-wia-ink/10 relative group"
              >
                <div className="absolute top-3 end-3 w-7 h-7 rounded-lg bg-white/5 border border-wia-ink/15 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <Lock size={12} className="text-wia-ink/50" />
                </div>

                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{VENUE_EMOJI[venue.category as keyof typeof VENUE_EMOJI] ?? '📍'}</span>
                  <LiveBadge count={venue.liveCount} size="sm" />
                </div>

                <h3 className="font-display font-semibold text-wia-ink mb-1 leading-tight pe-8">
                  {venue.name}
                </h3>
                <p className="text-xs text-wia-ink/60 capitalize mb-4">{venue.category}</p>

                <div className="flex items-center justify-end text-[10px] uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-wia-purple/80">
                    <QrCode size={10} />
                    {t('venues.scanAtVenue')}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
