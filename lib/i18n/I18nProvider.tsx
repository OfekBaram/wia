'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { dict, type Locale } from './dictionary'

const STORAGE_KEY = 'wia:locale'

interface I18nContextValue {
  locale: Locale
  dir:    'ltr' | 'rtl'
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function resolve(tree: unknown, key: string): string {
  const val = key.split('.').reduce<unknown>(
    (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    tree,
  )
  return typeof val === 'string' ? val : key
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start at 'en' to match the server-rendered HTML, then adopt the saved
  // locale after mount (localStorage isn't available server-side).
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'he' || saved === 'en') setLocaleState(saved)
    } catch { /* ignore */ }
  }, [])

  const dir: 'ltr' | 'rtl' = locale === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let s = resolve(dict[locale], key)
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
