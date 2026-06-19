'use client'

import Link from 'next/link'
import { LiveDot } from '@/components/ui/LiveBadge'
import { useI18n } from '@/lib/i18n/I18nProvider'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-wia-ink/10 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold gradient-text">WIA</span>
            <span className="text-wia-ink/50">·</span>
            <div className="flex items-center gap-2 text-sm text-wia-ink/60">
              <LiveDot />
              {t('footer.liveNow', { count: 91 })}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-wia-ink/55">
            <Link href="/privacy" className="hover:text-wia-ink/60 transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-wia-ink/60 transition-colors">{t('footer.terms')}</Link>
            <Link href="/safety" className="hover:text-wia-ink/60 transition-colors">{t('footer.safety')}</Link>
            <Link href="/admin/go" className="hover:text-wia-ink/60 transition-colors">{t('footer.venueAdmin')}</Link>
          </div>

          <div className="text-xs text-wia-ink/50">
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  )
}
