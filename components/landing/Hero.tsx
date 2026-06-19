'use client'

import Image from 'next/image'
import Link from 'next/link'
import { QrCode, Zap, ArrowRight } from 'lucide-react'
import { LiveDot } from '@/components/ui/LiveBadge'
import { HERO_CARDS } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/I18nProvider'

function HeroPersonCard({
  name,
  age,
  selfieUrl,
  arrivedMinutesAgo,
  statusText,
  className,
}: {
  name: string
  age: number
  selfieUrl: string
  arrivedMinutesAgo: number
  statusText: string
  className?: string
}) {
  return (
    <div className={`glass-strong rounded-2xl p-3 w-44 ${className ?? ''}`}>
      <div className="relative">
        <Image
          src={selfieUrl}
          alt={name}
          width={160}
          height={160}
          className="w-full h-36 object-cover rounded-xl"
        />
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-wia-ink">
          {age}
        </span>
        <div className="absolute bottom-2 left-2">
          <LiveDot />
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-wia-ink">{name}</span>
          <span className="text-[10px] text-wia-ink/60">{arrivedMinutesAgo}m</span>
        </div>
        <p className="text-[10px] text-wia-ink/50 leading-snug line-clamp-2">
          {statusText}
        </p>
      </div>
    </div>
  )
}

export function Hero() {
  const { t } = useI18n()
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      {/* Background orbs */}
      <div className="orb orb-purple w-[700px] h-[700px] -top-32 -left-48 animate-glow" />
      <div className="orb orb-pink w-[500px] h-[500px] top-1/2 -right-32 animate-glow" style={{ animationDelay: '1s' }} />
      <div className="orb orb-cyan w-[400px] h-[400px] bottom-0 left-1/3 animate-glow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="enter-1 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wia-purple/30 bg-wia-purple/10 text-wia-purple text-sm font-medium">
              <Zap size={14} className="fill-current" />
              {t('hero.badge')}
            </div>

            {/* Headline */}
            <div className="enter-2 space-y-2">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="gradient-text">{t('hero.titleA')}</span>
                <br />
                <span className="text-wia-ink">{t('hero.titleB')}</span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="enter-3 text-xl text-wia-ink/60 leading-relaxed max-w-lg">
              {t('hero.subheading')}
            </p>

            {/* CTAs — homepage isn't the funnel. Real users arrive via QR. */}
            <div className="enter-4 space-y-3">
              <div className="glass rounded-2xl p-4 border border-wia-purple/20 flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-wia-purple/15 flex items-center justify-center">
                  <QrCode size={16} className="text-wia-purple" />
                </div>
                <div className="text-sm">
                  <div className="text-wia-ink font-medium mb-0.5">{t('hero.atVenueTitle')}</div>
                  <div className="text-wia-ink/70 text-xs leading-relaxed">
                    {t('hero.atVenueBody')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/admin/go"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/30"
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight size={16} className="rtl-mirror" />
                </Link>
                <Link
                  href="#nearby"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl glass border border-wia-ink/15 text-wia-ink hover:text-wia-ink text-sm font-medium transition-all"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </div>
            </div>

            {/* Status — pulled live from DB further down */}
            <div className="enter-5 flex items-center gap-3 text-xs sm:text-sm text-wia-ink/70 flex-wrap">
              <div className="flex items-center gap-2">
                <LiveDot />
                <span>{t('hero.statusNew')}</span>
              </div>
            </div>
          </div>

          {/* Right — floating person cards */}
          <div className="enter-6 relative h-[520px] hidden lg:block">
            {/* Grid of cards with float animations */}
            <div className="absolute top-0 left-4 animate-float">
              <HeroPersonCard {...HERO_CARDS[0]} />
            </div>
            <div className="absolute top-12 right-0 animate-float-delay">
              <HeroPersonCard {...HERO_CARDS[1]} />
            </div>
            <div className="absolute bottom-12 left-16 animate-float-delay2">
              <HeroPersonCard {...HERO_CARDS[2]} />
            </div>
            <div className="absolute bottom-0 right-8 animate-float">
              <HeroPersonCard {...HERO_CARDS[3]} />
            </div>

            {/* Center connection lines / vibe indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border border-wia-purple/20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-wia-pink/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wia-purple to-wia-pink animate-pulse-slow" />
                  </div>
                </div>
                {/* Ping rings */}
                <div className="absolute inset-0 rounded-full border border-wia-purple/10 animate-ping-slow" />
                <div className="absolute -inset-4 rounded-full border border-wia-purple/5 animate-ping-slow" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
