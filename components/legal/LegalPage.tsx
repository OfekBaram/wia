'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { LanguageSelector } from '@/components/LanguageSelector'
import type { Doc, LegalKey } from '@/lib/legal/content'
import { legal } from '@/lib/legal/content'

export function LegalPage({ docKey }: { docKey: LegalKey }) {
  const { t, locale } = useI18n()
  const doc: Doc = legal[docKey][locale]

  return (
    <div className="min-h-screen bg-wia-bg flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-48 -left-48 animate-glow" />
        <div className="orb orb-pink w-[500px] h-[500px] -bottom-32 -right-32 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-5 flex items-center justify-between gap-3 border-b border-wia-ink/10">
          <Link href="/" className="font-display text-xl font-bold gradient-text shrink-0">WIA</Link>
          <LanguageSelector className="shrink-0" />
        </div>

        {/* Content */}
        <main className="flex-1 px-5 sm:px-6 py-10">
          <article className="w-full max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-block text-sm text-wia-ink/55 hover:text-wia-ink transition-colors mb-6"
            >
              {t('joinPage.backHome')}
            </Link>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink mb-2">
              {doc.title}
            </h1>
            <p className="text-xs text-wia-ink/45 mb-8">{doc.updated}</p>

            <p className="text-wia-ink/70 leading-relaxed mb-10">{doc.intro}</p>

            <div className="space-y-9">
              {doc.sections.map((s, i) => (
                <section key={i}>
                  <h2 className="font-display text-lg font-semibold text-wia-ink mb-3">{s.h}</h2>
                  <div className="space-y-2.5">
                    {s.p.map((para, j) => (
                      <p key={j} className="text-sm text-wia-ink/65 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </main>

        {/* Footer cross-links */}
        <div className="px-6 py-8 border-t border-wia-ink/10">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 text-sm text-wia-ink/55">
            <Link href="/privacy" className="hover:text-wia-ink transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-wia-ink transition-colors">{t('footer.terms')}</Link>
            <Link href="/safety" className="hover:text-wia-ink transition-colors">{t('footer.safety')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
