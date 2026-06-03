import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { venueId } = await req.json().catch(() => ({} as { venueId?: string }))
  if (!venueId) return NextResponse.json({ error: 'venueId required' }, { status: 400 })

  const admin = adminClient()

  // Soft-delete: record left_at so session length is preserved for analytics
  await admin.from('presence')
    .update({ left_at: new Date().toISOString(), is_visible: false, expires_at: new Date().toISOString() })
    .eq('user_id', userData.user.id)
    .eq('venue_id', venueId)
    .is('left_at', null)

  return NextResponse.json({ ok: true })
}
