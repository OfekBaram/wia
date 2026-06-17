'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { LOCALES } from '@/lib/i18n/dictionary'
import { cn } from '@/lib/cn'

// Compact EN / עברית pill toggle. Persists the choice (handled by the provider)
// and flips the whole document to RTL when Hebrew is selected.
export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl glass border border-wia-ink/15 p-0.5',
        className,
      )}
    >
      <Globe size={13} className="text-wia-ink/45 mx-1 shrink-0" />
      {LOCALES.map(l => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
            locale === l.code
              ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white shadow-sm'
              : 'text-wia-ink/55 hover:text-wia-ink',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
