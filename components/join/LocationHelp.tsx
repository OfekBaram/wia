'use client'

import { useEffect, useState } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { detectGeoPlatform, type GeoPlatform } from '@/lib/geo'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface LocationHelpProps {
  /** Re-run the GPS check. Also fired automatically when the tab regains focus. */
  onRetry: () => void
  /** True while the parent is re-checking — disables the button. */
  checking?: boolean
}

// i18n keys per platform: [titleKey, stepsKey]. Steps are newline-joined strings.
const PLATFORM_KEYS: Record<GeoPlatform, { title: string; steps: string }> = {
  'ios-safari': { title: 'locHelp.iosSafariTitle', steps: 'locHelp.iosSafariSteps' },
  'ios-chrome': { title: 'locHelp.iosChromeTitle', steps: 'locHelp.iosChromeSteps' },
  android:      { title: 'locHelp.androidTitle',   steps: 'locHelp.androidSteps' },
  desktop:      { title: 'locHelp.desktopTitle',   steps: 'locHelp.desktopSteps' },
}

/**
 * Shown when the location permission is denied. Detects the device and walks
 * the user through re-enabling it, then retries automatically when they
 * return from Settings (the tab fires visibilitychange on the way back).
 */
export function LocationHelp({ onRetry, checking }: LocationHelpProps) {
  const { t } = useI18n()
  const [platform, setPlatform] = useState<GeoPlatform>('desktop')

  useEffect(() => { setPlatform(detectGeoPlatform()) }, [])

  // Auto-retry when the user comes back from the Settings app
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') onRetry()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [onRetry])

  const guide = PLATFORM_KEYS[platform]
  const steps = t(guide.steps).split('\n')

  return (
    <div className="glass-strong rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-3 text-start">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <MapPin size={15} className="text-amber-500" />
        </div>
        <div>
          <div className="text-sm font-semibold text-wia-ink">{t(guide.title)}</div>
          <div className="text-[11px] text-wia-ink/55">
            {t('locHelp.intro')}
          </div>
        </div>
      </div>

      <ol className="space-y-1.5 ps-1">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-wia-ink/70 leading-relaxed">
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-wia-purple/15 text-wia-purple text-[10px] font-bold flex items-center justify-center mt-px">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <button
        onClick={onRetry}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass border border-wia-ink/15 text-sm font-medium text-wia-ink hover:border-wia-purple/40 transition-all disabled:opacity-60"
      >
        <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
        {checking ? t('locHelp.checking') : t('locHelp.retry')}
      </button>
    </div>
  )
}
