'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Building2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode,            setMode]            = useState<Mode>('signin')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Email and password are required')
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
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Email and password are required'); return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters'); return
    }
    if (password !== passwordConfirm) {
      setError('Passwords don\'t match'); return
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
        throw new Error(err.error ?? 'Could not create your account')
      }

      // 2. Make sure the browser client also has the session in memory.
      const { error: signInErr } = await supabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInErr) throw signInErr

      router.push('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
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
              {mode === 'signup' ? 'Get WIA at your venue' : 'Admin backoffice'}
            </h1>
            <p className="text-wia-ink/55 text-sm">
              {mode === 'signup'
                ? 'Sign up in 30 seconds. Add your venue, get a QR code, watch your room come to life.'
                : 'Manage venues, generate QR codes, monitor activity.'}
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
            Sign in
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === 'signup' ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white shadow' : 'text-wia-ink/60 hover:text-wia-ink'
            }`}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
          className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
              <input
                type="email" inputMode="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'signup' ? 'you@yourvenue.com' : 'admin@wia.com'}
                disabled={loading}
                className="w-full glass rounded-xl pl-11 pr-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-wia-ink/60 mb-2">
              Password
              {mode === 'signup' && <span className="text-wia-ink/50 font-normal"> (at least 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" disabled={loading}
                className="w-full glass rounded-xl pl-11 pr-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-wia-ink/60 mb-2">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wia-ink/55" />
                <input
                  type="password" autoComplete="new-password"
                  value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••" disabled={loading}
                  className="w-full glass rounded-xl pl-11 pr-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
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
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {mode === 'signup' ? <Sparkles size={16} /> : null}
                {mode === 'signup' ? 'Create account' : 'Sign in'}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {mode === 'signup' && (
            <div className="pt-3 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 leading-relaxed">
              <strong className="text-wia-ink/70">What you get:</strong> One venue, a printable QR code,
              live guest tracking, and a private dashboard. Free while we&apos;re in beta.
            </div>
          )}
          {mode === 'signin' && (
            <div className="pt-3 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 leading-relaxed text-center">
              New venue?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null) }}
                className="text-wia-purple hover:underline"
              >
                Create an account
              </button>
            </div>
          )}
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-wia-ink/55 hover:text-wia-ink transition-colors">← Back to WIA</Link>
        </div>
      </div>
    </div>
  )
}
