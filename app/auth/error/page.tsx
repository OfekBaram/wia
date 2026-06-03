'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Mail } from 'lucide-react'
import { Suspense } from 'react'

const REASON_COPY: Record<string, { title: string; sub: string }> = {
  otp_expired: {
    title: 'That sign-in link expired',
    sub:   'Magic links last about an hour and can only be used once. Request a fresh one.',
  },
  access_denied: {
    title: 'Sign-in link is invalid',
    sub:   'The link was either already used or was tampered with. Request a new one.',
  },
  // Default falls back to the raw reason
}

function ErrorBody() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'unknown'
  const next   = params.get('next')   ?? '/'

  const copy = REASON_COPY[reason] ?? {
    title: 'Sign-in failed',
    sub:   `We couldn\'t complete the sign-in: ${reason.replace(/_/g, ' ')}`,
  }

  // Where to send them to retry. If they were going to /admin, use admin login;
  // otherwise the venue-specific join flow.
  const retryHref = next.startsWith('/admin') ? '/admin/login' : next || '/'

  return (
    <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-32 -left-32 animate-glow" />
        <div className="orb orb-pink   w-[400px] h-[400px] bottom-0 right-0 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-7">
        <div className="inline-flex">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-300" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold text-wia-ink">{copy.title}</h1>
          <p className="text-wia-ink/50">{copy.sub}</p>
        </div>

        <div className="space-y-3">
          <Link
            href={retryHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/30"
          >
            <Mail size={16} />
            Get a new sign-in link
            <ArrowRight size={16} />
          </Link>

          <div>
            <Link href="/" className="text-xs text-wia-ink/55 hover:text-wia-ink/60 transition-colors">
              ← Back to WIA
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-wia-ink/10 text-[11px] text-wia-ink/55 font-mono">
          reason: {reason}
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wia-bg" />}>
      <ErrorBody />
    </Suspense>
  )
}
