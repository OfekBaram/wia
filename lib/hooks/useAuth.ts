'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { MasterUser } from '@/lib/auth'

export function useAuth() {
  const [user,  setUser]  = useState<MasterUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sb = supabase()
    let cancelled = false

    async function loadUser() {
      const { data } = await sb.auth.getUser()
      if (cancelled) return

      if (!data.user) {
        setUser(null)
        setReady(true)
        return
      }

      // Resolve role alongside the auth user
      const { data: adminRow } = await sb
        .from('admin_users')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (cancelled) return
      setUser({
        id:        data.user.id,
        email:     data.user.email ?? '',
        role:
          adminRow?.role === 'super_admin' ? 'super_admin'
          : adminRow?.role === 'venue_owner' ? 'venue_owner'
          : 'user',
        createdAt: data.user.created_at,
      })
      setReady(true)
    }

    loadUser()

    const { data: sub } = sb.auth.onAuthStateChange(() => loadUser())

    // Legacy event from older mock code
    const onLegacy = () => loadUser()
    window.addEventListener('wia:auth-changed', onLegacy)

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      window.removeEventListener('wia:auth-changed', onLegacy)
    }
  }, [])

  return { user, ready, isAuthenticated: !!user }
}
