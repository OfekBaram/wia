'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Users, Heart, Eye, Clock, MapPin, AlertCircle, Loader } from 'lucide-react'
import type { Location } from '@/lib/types'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { getCurrentCoords, haversineMeters, GPS_GRACE_METERS, GeoError } from '@/lib/geo'
import { LocationHelp } from './LocationHelp'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface StepWelcomeProps {
  location:    Location
  liveCount:   number
  onContinue:  () => void
  isReturning?: boolean
}

const BENEFIT_META = [
  { icon: Users, key: 'b1', color: 'text-wia-purple' },
  { icon: Heart, key: 'b2', color: 'text-wia-pink' },
  { icon: Eye,   key: 'b3', color: 'text-wia-cyan' },
  { icon: Clock, key: 'b4', color: 'text-wia-green' },
]

type GpsState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'too_far'; distance: number }
  | { status: 'denied' }
  | { status: 'error';   errKey: string }

export function StepWelcome({ location, liveCount, onContinue, isReturning }: StepWelcomeProps) {
  const { t } = useI18n()
  const emoji = VENUE_EMOJI[location.category]
  const [gps, setGps] = useState<GpsState>({ status: 'idle' })
  // Which CTA the user tapped — so the result/error renders next to it, not
  // buried below the benefit cards.
  const [anchor, setAnchor] = useState<'top' | 'bottom'>('top')

  async function handleContinue(source: 'top' | 'bottom' = 'top') {
    setAnchor(source)
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
      if (e instanceof GeoError && e.kind === 'denied') { setGps({ status: 'denied' }); return }
      const kind = e instanceof GeoError ? e.kind : 'unavailable'
      const errKey =
        kind === 'timeout'     ? 'joinWelcome.errTimeout'
        : kind === 'unsupported' ? 'joinWelcome.errUnsupported'
        :                          'joinWelcome.errUnavailable'
      setGps({ status: 'error', errKey })
    }
  }

  const checking = gps.status === 'checking'
  const isRetry  = gps.status === 'too_far' || gps.status === 'error' || gps.status === 'denied'

  const renderCta = (source: 'top' | 'bottom') => (
    <button
      onClick={() => handleContinue(source)}
      disabled={checking}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-xl shadow-purple-500/30 disabled:opacity-70"
    >
      {checking ? (
        <>
          <Loader size={18} className="animate-spin" />
          {t('joinWelcome.verifying')}
        </>
      ) : isRetry ? (
        <>
          <MapPin size={18} />
          {t('joinWelcome.tryAgain')}
        </>
      ) : (
        <>
          {isReturning ? t('joinWelcome.ctaReturning') : t('joinWelcome.ctaJoin')}
          <ArrowRight size={18} className="rtl-mirror" />
        </>
      )}
    </button>
  )

  // Result/error block — light-theme colors so it's actually legible.
  const statusBlock = (
    <>
      {gps.status === 'too_far' && (
        <div className="rounded-2xl p-4 border border-amber-400 bg-amber-50">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <div className="text-sm font-semibold text-amber-800">
                {t('joinWelcome.tooFarTitle', { venue: location.name })}
              </div>
              <div className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {t('joinWelcome.tooFarBody', { dist: Math.round(gps.distance), radius: location.radiusMeters })}
              </div>
            </div>
          </div>
        </div>
      )}
      {gps.status === 'denied' && (
        <LocationHelp onRetry={() => handleContinue(anchor)} checking={checking} />
      )}
      {gps.status === 'error' && (
        <div className="rounded-2xl p-4 border border-red-400 bg-red-50">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div>
              <div className="text-sm font-semibold text-red-700">{t('joinWelcome.errTitle')}</div>
              <div className="text-xs text-red-600 mt-0.5 leading-relaxed">{t(gps.errKey)}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const locationNote = (
    <p className="text-center text-xs text-wia-ink/55 leading-relaxed max-w-sm mx-auto flex items-center justify-center gap-1">
      <MapPin size={11} className="text-wia-purple/60" />
      {t('joinWelcome.locNote')}
    </p>
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-emerald-500/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-xs text-emerald-600">{t('joinWelcome.qrVerified')}</span>
        </div>

        {location.coverImageUrl ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden ring-1 ring-wia-ink/10 shadow-sm">
            <Image src={location.coverImageUrl} alt={location.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/45" />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-wia-purple/10 to-wia-pink/10 text-5xl">{emoji}</div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink leading-tight pt-1">
          {isReturning ? t('joinWelcome.welcomeBack') : t('joinWelcome.welcome')}
          <span className="gradient-text">{location.name}</span>
        </h1>

        {liveCount > 0 ? (
          <p className="inline-flex items-center gap-2 text-wia-ink/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wia-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-wia-pink" />
            </span>
            <span><strong className="text-wia-ink">{liveCount}</strong> {liveCount === 1 ? t('joinWelcome.liveOne') : t('joinWelcome.liveMany')}</span>
          </p>
        ) : (
          <p className="text-wia-ink/50">{t('joinWelcome.beFirst')}</p>
        )}
      </div>

      {/* Primary CTA — above the fold, right under the headline */}
      <div className="space-y-3">
        {renderCta('top')}
        {anchor === 'top' && statusBlock}
        {locationNote}
      </div>

      {!isReturning && (
        <div className="space-y-3 pt-1">
          <div className="text-[11px] uppercase tracking-wider text-wia-ink/45 text-center">
            {t('joinWelcome.howItWorks')}
          </div>
          {BENEFIT_META.map((b, i) => (
            <div
              key={b.key}
              className="glass rounded-2xl px-4 py-3.5 flex items-start gap-3"
              style={{ animation: `enter 0.4s ${i * 80}ms backwards ease-out` }}
            >
              <div className={`shrink-0 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${b.color}`}>
                <b.icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-wia-ink">{t(`joinWelcome.${b.key}Title`)}</div>
                <div className="text-xs text-wia-ink/50 leading-relaxed mt-0.5">{t(`joinWelcome.${b.key}Desc`)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repeat CTA at the bottom — only when benefits separate it from the top one */}
      {!isReturning && (
        <div className="space-y-3">
          {renderCta('bottom')}
          {anchor === 'bottom' && statusBlock}
        </div>
      )}
    </div>
  )
}
