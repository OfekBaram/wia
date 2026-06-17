'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { LanguageSelector } from '@/components/LanguageSelector'

export function Nav() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-display font-bold tracking-tight gradient-text">WIA</span>
            <span className="text-wia-ink/55 text-sm">{t('nav.tagline')}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-wia-ink/60">
            <Link href="#how" className="hover:text-wia-ink transition-colors">{t('nav.howItWorks')}</Link>
            <Link href="#nearby" className="hover:text-wia-ink transition-colors">{t('nav.nearby')}</Link>
            <Link href="#venues" className="hover:text-wia-ink transition-colors">{t('nav.forVenues')}</Link>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              {t('nav.forVenues')}
            </Link>

            {/* User menu — only shown to signed-in users who landed here */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl glass border-wia-ink/15 hover:bg-white/10 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center text-xs font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-wia-ink/60 hidden sm:inline">{user.email}</span>
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute top-full end-0 mt-2 w-56 glass-strong rounded-2xl border border-wia-ink/15 p-2 z-20 shadow-2xl">
                      <div className="px-3 py-2 border-b border-wia-ink/10 mb-1">
                        <div className="text-xs text-wia-ink/60">{t('nav.signedInAs')}</div>
                        <div className="text-sm text-wia-ink truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => { signOut(); setMenuOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-wia-ink/60 hover:text-wia-ink hover:bg-white/5 transition-colors"
                      >
                        <LogOut size={14} />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
