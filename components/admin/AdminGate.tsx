'use client'

import Link from 'next/link'
import { Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

interface AdminGateProps {
  children: React.ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'venue_owner')) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-purple w-[600px] h-[600px] -top-32 -left-32 animate-glow" />
          <div className="orb orb-pink   w-[400px] h-[400px] bottom-0 right-0 animate-glow" />
        </div>

        <div className="relative z-10 w-full max-w-md text-center space-y-6">
          <div className="inline-flex">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30">
              <Shield size={28} className="text-wia-ink" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold text-wia-ink">
              Admin access required
            </h1>
            <p className="text-wia-ink/50">
              {user
                ? <>You&apos;re signed in as <strong className="text-wia-ink">{user.email}</strong> — this account doesn&apos;t have admin permissions.</>
                : <>Sign in with an authorized admin email to manage venues.</>}
            </p>
          </div>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/30"
          >
            Admin sign-in
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/"
            className="block text-xs text-wia-ink/55 hover:text-wia-ink/60 transition-colors"
          >
            ← Back to WIA
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
