'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react'
import { sendMagicLink } from '@/lib/auth'

/**
 * Standalone magic-link sign-in. Shown only when an existing user lands on a
 * protected non-venue page (currently just `/scan`) without an active session.
 * The main first-time sign-up flow lives at the bottom of the join form — not
 * here — per product spec ("auth at the end, not the front door").
 */

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

export function SignInScreen() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [sent,  setSent]      = useState(false)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isValidEmail(email)) {
      setError('That doesn\'t look like a valid email')
      return
    }

    setLoading(true)
    try {
      // Bring the user back to the same page they were trying to access
      await sendMagicLink(email, pathname || '/')
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send sign-in link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[700px] h-[700px] -top-48 -left-48 animate-glow" />
        <div className="orb orb-pink   w-[500px] h-[500px] bottom-0 -right-32 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-block">
            <span className="font-display text-5xl font-bold gradient-text">WIA</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-wia-ink leading-tight">
            Welcome back
          </h1>
          <p className="text-wia-ink/70 text-sm">
            Enter your email — we&apos;ll send a one-tap sign-in link.
          </p>
        </div>

        {sent ? (
          <div className="glass-strong rounded-3xl p-8 text-center space-y-5">
            <div className="inline-flex">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30">
                <Mail size={28} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-wia-ink">Check your email</h2>
              <p className="text-wia-ink/70 text-sm mt-2">
                Sign-in link sent to <strong className="text-wia-ink">{email}</strong>.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-xs text-wia-ink/60 hover:text-wia-ink/70 underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-wia-ink/60 mb-2">Your email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full glass rounded-xl pl-11 pr-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-wia-ink/30 border-t-white animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  Send sign-in link
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-start gap-2 pt-3 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 leading-relaxed">
              <Shield size={12} className="shrink-0 mt-0.5 text-wia-purple/60" />
              <span>No passwords. No spam. One identity per person, used silently across every WIA venue.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
