'use client'

import { TrendingUp, Users, Repeat, Star, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useI18n } from '@/lib/i18n/I18nProvider'

const BENEFIT_META = [
  { icon: Users,       key: 'b1', color: 'text-wia-purple', bg: 'bg-wia-purple/10', border: 'border-wia-purple/20' },
  { icon: Repeat,      key: 'b2', color: 'text-wia-pink',   bg: 'bg-wia-pink/10',   border: 'border-wia-pink/20' },
  { icon: TrendingUp,  key: 'b3', color: 'text-wia-cyan',   bg: 'bg-wia-cyan/10',   border: 'border-wia-cyan/20' },
  { icon: Star,        key: 'b4', color: 'text-wia-amber',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
]

const VENUE_TYPE_KEYS = [
  'tBars', 'tFestivals', 'tUniversities', 'tCoworking',
  'tHotels', 'tAirports', 'tGyms', 'tCafes', 'tConferences', 'tBeaches',
]

export function ForVenues() {
  const { t } = useI18n()
  return (
    <section id="venues" className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wia-surface/40 to-transparent" />
      <div className="orb orb-purple w-[600px] h-[600px] -bottom-32 -right-32 animate-glow" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wia-ink/15 bg-white/5 text-wia-ink/50 text-sm mb-6">
              {t('forVenues.badge')}
            </div>
            <h2 className="font-display text-5xl font-bold text-wia-ink mb-6 leading-tight">
              {t('forVenues.titleA')}{' '}
              <span className="gradient-text">{t('forVenues.titleB')}</span>
            </h2>
            <p className="text-wia-ink/50 text-lg leading-relaxed mb-8">
              {t('forVenues.body')}
            </p>

            {/* Venue types */}
            <div className="flex flex-wrap gap-2 mb-10">
              {VENUE_TYPE_KEYS.map((k) => (
                <span
                  key={k}
                  className="px-3 py-1 rounded-full text-sm glass border-wia-ink/15 text-wia-ink/50"
                >
                  {t(`forVenues.${k}`)}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href="mailto:venues@wia.com"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/20"
              >
                {t('forVenues.cta')}
                <ArrowRight size={16} className="rtl-mirror" />
              </a>
              <span className="text-wia-ink/55 text-sm">{t('forVenues.freeToStart')}</span>
            </div>
          </div>

          {/* Right — benefits grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFIT_META.map((benefit) => (
              <GlassCard key={benefit.key} className="p-6 space-y-3">
                <div className={`w-10 h-10 rounded-xl ${benefit.bg} border ${benefit.border} flex items-center justify-center`}>
                  <benefit.icon size={20} className={benefit.color} />
                </div>
                <h3 className="font-display font-semibold text-wia-ink">{t(`forVenues.${benefit.key}Title`)}</h3>
                <p className="text-sm text-wia-ink/50 leading-relaxed">{t(`forVenues.${benefit.key}Desc`)}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
