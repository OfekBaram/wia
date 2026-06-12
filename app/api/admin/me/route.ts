// Who am I + admin role — server-side, immune to the browser SDK cookie hang.
// GET → { userId, email, role: 'super_admin' | 'venue_owner' | 'user' }

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: roleRow } = await adminClient()
    .from('admin_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  return NextResponse.json({
    userId: userData.user.id,
    email:  userData.user.email ?? '',
    role:   roleRow?.role ?? 'user',
  })
}
