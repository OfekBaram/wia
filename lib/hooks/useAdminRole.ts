'use client'

// Server-backed replacement for role detection in admin pages.
// useAuth() relies on the browser Supabase SDK, which hangs once the auth
// cookie is set (e.g. after a hard refresh) — this hook fetches the role from
// /api/admin/me unconditionally on mount instead.

import { useEffect, useState } from 'react'

export type AdminRole = 'super_admin' | 'venue_owner' | 'user'

export interface AdminMe {
  userId: string
  email:  string
  role:   AdminRole
}

export function useAdminRole() {
  const [me,    setMe]    = useState<AdminMe | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled) { setMe(json); setReady(true) } })
      .catch(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  return {
    me,
    ready,
    isSuperAdmin: me?.role === 'super_admin',
    isVenueOwner: me?.role === 'venue_owner',
  }
}
