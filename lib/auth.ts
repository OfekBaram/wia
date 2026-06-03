'use client'

// Real auth backed by Supabase. The mock helpers are gone — this file now just
// wraps Supabase calls with WIA-friendly names.

import { supabase } from '@/lib/supabase/client'

export type UserRole = 'user' | 'venue_owner' | 'super_admin'

export interface MasterUser {
  id:        string
  email:     string
  role:      UserRole
  createdAt: string
}

/** Whether the user has access to the /admin area. Both kinds of admins do. */
export function canAccessAdmin(user: MasterUser | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'venue_owner'
}

export function isSuperAdmin(user: MasterUser | null): boolean {
  return user?.role === 'super_admin'
}

export async function getCurrentUser(): Promise<MasterUser | null> {
  const { data, error } = await supabase().auth.getUser()
  if (error || !data.user) return null

  // Check role from admin_users
  const { data: adminRow } = await supabase()
    .from('admin_users')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle()

  const role: UserRole =
    adminRow?.role === 'super_admin' ? 'super_admin'
    : adminRow?.role === 'venue_owner' ? 'venue_owner'
    : 'user'

  return {
    id:        data.user.id,
    email:     data.user.email ?? '',
    role,
    createdAt: data.user.created_at,
  }
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wia:joined:') || k === 'wia:master_user' || k === 'wia:pending_join')
      .forEach(k => localStorage.removeItem(k))
    window.location.assign('/admin/login')
  }
}

/** Send a magic-link email. Returns when the email is queued, not when it's clicked. */
export async function sendMagicLink(email: string, nextPath: string): Promise<void> {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { error } = await supabase().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })
  if (error) throw error
}

// Legacy admin email check, kept around so existing admin login UI keeps compiling.
// The real check is now `admin_users` table membership, queried in `getCurrentUser`.
export function isAdminEmail(email: string): boolean {
  const e = email.toLowerCase().trim()
  return e.includes('admin') || e.endsWith('@wia.com')
}
