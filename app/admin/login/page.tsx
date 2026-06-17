'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Building2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/I18nProvider'

type Mode = 'signin' | 'signup'

export default function AdminLoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [mode,            setMode]            = useState<Mode>('signin')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)

  // Until the session check resolves, render a spinner instead of the form so
  // already-signed-in admins never see a login-page flash before the redirect.
  const [checkingSession, setCheckingSession] = useState(true)

  // Already signed in with an admin role? Skip the form entirely.
  // Server-side check — never the browser SDK (it hangs once the cookie is set).
  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(me => {
        if (me && (me.role === 'super_admin' || me.role === 'venue_owner')) {
          window.location.assign('/admin') // keep the spinner up through navigation
        } else {
          setCheckingSession(false)
        }
      })
      .catch(() => setCheckingSession(false))
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError(t('login.errRequired'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase().auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
      router.push('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.errSignin'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError(t('login.errRequired')); return
    }
    if (password.length < 8) {
      setError(t('login.errMin')); return
    }
    if (password !== passwordConfirm) {
      setError(t('login.errMismatch')); return
    }

    setLoading(true)
    try {
      // 1. Server creates the user + tags them as a venue_owner.
      const res = await fetch('/api/venue-owner/signup', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(err.error ?? t('login.errCreate'))
      }

      // 2. Make sure the browser client also has the session in memory.
      const { error: signInErr } = await supabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInErr) throw signInErr

      router.push('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.errSignup'))
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-32 -left-32 animate-glow" />
        <div className="orb orb-pink   w-[400px] h-[400px] bottom-0 right-0 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30">
              {mode === 'signup' ? <Building2 size={24} className="text-white" /> : <Shield size={24} className="text-white" />}
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-wia-ink mb-2">
              {mode === 'signup' ? t('login.signupTitle') : t('login.signinTitle')}
            </h1>
            <p className="text-wia-ink/55 text-sm">
              {mode === 'signup' ? t('login.signupSub') : t('login.signinSub')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-2xl p-1 flex mb-4 max-w-xs mx-auto">
          <button
            onClick={() => { setMode('signin'); setError(null) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === 'signin' ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white shadow' : 'text-wia-ink/60 hover:text-wia-ink'
            }`}
          >
            {t('login.signin')}
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === 'signup' ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white shadow' : 'text-wia-ink/60 hover:text-wia-ink'
            }`}
          >
            {t('login.signup')}
          </button>
        </div>

        <form
          onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
          className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">{t('login.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
              <input
                type="email" inputMode="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'signup' ? 'you@yourvenue.com' : 'admin@wia.com'}
                disabled={loading}
                className="w-full glass rounded-xl ps-11 pe-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">
              {t('login.password')}
              {mode === 'signup' && <span className="text-wia-ink/50 font-normal">{t('login.passwordHint')}</span>}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" disabled={loading}
                className="w-full glass rounded-xl ps-11 pe-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-wia-ink/60 mb-2">{t('login.confirmPassword')}</label>
              <div className="relative">
                <Lock size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
                <input
                  type="password" autoComplete="new-password"
                  value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••" disabled={loading}
                  className="w-full glass rounded-xl ps-11 pe-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || (mode === 'signup' && !passwordConfirm)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/20"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {mode === 'signup' ? t('login.creating') : t('login.signingIn')}
              </>
            ) : (
              <>
                {mode === 'signup' ? <Sparkles size={16} /> : null}
                {mode === 'signup' ? t('login.createAccount') : t('login.signin')}
                <ArrowRight size={16} className="rtl-mirror" />
              </>
            )}
          </button>

          {mode === 'signup' && (
            <div className="pt-3 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 leading-relaxed">
              <strong className="text-wia-ink/70">{t('login.whatYouGet')}</strong>{t('login.whatYouGetBody')}
            </div>
          )}
          {mode === 'signin' && (
            <div className="pt-3 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 leading-relaxed text-center">
              {t('login.newVenueQ')}{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null) }}
                className="text-wia-purple hover:underline"
              >
                {t('login.createAnAccount')}
              </button>
            </div>
          )}
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-wia-ink/55 hover:text-wia-ink transition-colors">{t('login.backToWia')}</Link>
        </div>
      </div>
    </div>
  )
}
