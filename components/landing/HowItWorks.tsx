'use client'

import { QrCode, MapPin, Camera, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useI18n } from '@/lib/i18n/I18nProvider'

const STEP_META = [
  { number: '01', icon: QrCode, key: 's1', color: 'text-wia-purple', border: 'border-wia-purple/20', bg: 'bg-wia-purple/10' },
  { number: '02', icon: MapPin, key: 's2', color: 'text-wia-cyan',   border: 'border-wia-cyan/20',   bg: 'bg-wia-cyan/10' },
  { number: '03', icon: Camera, key: 's3', color: 'text-wia-pink',   border: 'border-wia-pink/20',   bg: 'bg-wia-pink/10' },
  { number: '04', icon: Users,  key: 's4', color: 'text-wia-green',  border: 'border-wia-green/20',  bg: 'bg-wia-green/10' },
]

export function HowItWorks() {
  const { t } = useI18n()
  return (
    <section id="how" className="relative py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wia-surface/50 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wia-ink/15 bg-white/5 text-wia-ink/50 text-sm mb-6">
            {t('how.badge')}
          </div>
          <h2 className="font-display text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-wia-ink">{t('how.titleA')}</span>
            <br />
            <span className="gradient-text">{t('how.titleB')}</span>
          </h2>
          <p className="text-wia-ink/50 text-xl max-w-2xl mx-auto">
            {t('how.sub')}
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEP_META.map((step, i) => (
            <GlassCard
              key={step.number}
              className="p-6 space-y-4 group hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Number + icon */}
              <div className="flex items-start justify-between">
                <span className={`text-5xl font-display font-bold opacity-20 ${step.color}`}>
                  {step.number}
                </span>
                <div className={`p-3 rounded-xl ${step.bg} border ${step.border}`}>
                  <step.icon size={20} className={step.color} />
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-display font-semibold text-lg text-wia-ink mb-2">
                  {t(`how.${step.key}Title`)}
                </h3>
                <p className="text-sm text-wia-ink/50 leading-relaxed">
                  {t(`how.${step.key}Desc`)}
                </p>
              </div>

              {/* Example */}
              <div className={`px-3 py-2 rounded-lg ${step.bg} border ${step.border}`}>
                <span className={`text-xs font-mono ${step.color}`}>{t(`how.${step.key}Ex`)}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Connector line (desktop only) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
