'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { SignInScreen } from './SignInScreen'

interface AuthGateProps {
  children: React.ReactNode
}

// The Google master-account gate only applies to *action* paths — entering
// a venue or using the scanner. The homepage, locked room previews, and the
// admin section are all freely accessible (admin has its own email gate).
//
// This matches the real user funnel: end users never visit the homepage.
// They land on `/{slug}?scan=xxx` from a physical QR code, hit a protected
// action path, and the Google sign-in shows up at the moment it's needed.
function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false  // admin uses email auth
  if (pathname.startsWith('/scan')) return true     // in-app QR scanner needs a master account
  // `/{slug}/join` is NOT protected — first-time auth happens via the magic-link
  // field at the bottom of the profile form. Returning users with a session
  // skip the email step entirely.
  return false
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, ready } = useAuth()
  const pathname = usePathname()

  if (!isProtectedPath(pathname)) return <>{children}</>

  if (!ready) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <SignInScreen />

  return <>{children}</>
}
