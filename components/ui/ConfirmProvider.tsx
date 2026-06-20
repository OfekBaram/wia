'use client'

// App-wide branded confirmation modal, replacing native window.confirm().
// Usage:
//   const confirm = useConfirm()
//   if (await confirm({ message: t('...'), danger: true })) { ...do it... }

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface ConfirmOptions {
  message:       string
  confirmLabel?: string
  cancelLabel?:  string
  /** Red confirm button for destructive actions (delete, report, …). */
  danger?:       boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOpts(null)
  }, [])

  const confirm = useCallback<ConfirmFn>((next) => {
    // If a prior prompt is somehow still open, cancel it first.
    resolver.current?.(false)
    setOpts(next)
    return new Promise<boolean>((resolve) => { resolver.current = resolve })
  }, [])

  useEffect(() => {
    if (!opts) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
      if (e.key === 'Enter')  settle(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [opts, settle])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => settle(false)}
        >
          <div className="absolute inset-0 bg-wia-ink/40 backdrop-blur-sm animate-in fade-in" />
          <div
            className="relative w-full max-w-sm glass-strong rounded-2xl p-6 shadow-2xl shadow-wia-ink/10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-wia-ink text-[15px] leading-relaxed mb-6">{opts.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => settle(false)}
                className="px-4 py-2.5 rounded-xl glass border border-wia-ink/15 text-wia-ink/70 hover:text-wia-ink hover:bg-white/10 text-sm font-medium transition-colors"
              >
                {opts.cancelLabel ?? t('common.cancel')}
              </button>
              <button
                autoFocus
                onClick={() => settle(true)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg ${
                  opts.danger
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-gradient-to-r from-wia-purple to-wia-pink hover:opacity-90 shadow-purple-500/20'
                }`}
              >
                {opts.confirmLabel ?? t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
