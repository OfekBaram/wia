// Hide / report a person in a room.
//
// POST { venueSlug, targetUserId, action: 'hide' | 'report', reason? }
// - hide:   target disappears from the caller's room view (per venue)
// - report: stores a report row AND hides the target for the reporter

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const me = userData.user.id

  const { venueSlug, targetUserId, action, reason } = await req.json().catch(() => ({} as {
    venueSlug?: string; targetUserId?: string; action?: string; reason?: string
  }))
  if (!venueSlug || !targetUserId || !['hide', 'report'].includes(action ?? '')) {
    return NextResponse.json({ error: 'venueSlug, targetUserId and action (hide|report) required' }, { status: 400 })
  }
  if (targetUserId === me) {
    return NextResponse.json({ error: "You can't moderate yourself" }, { status: 400 })
  }

  const admin = adminClient()
  const { data: venue } = await admin.from('venues').select('id').eq('slug', venueSlug).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  if (action === 'report') {
    const { error } = await admin.from('user_reports').insert({
      reporter_id: me,
      reported_id: targetUserId,
      venue_id:    venue.id,
      reason:      (reason ?? '').slice(0, 500) || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Both actions hide the target for the caller
  const { error: hideErr } = await admin.from('user_hides').upsert(
    { user_id: me, hidden_user_id: targetUserId, venue_id: venue.id },
    { onConflict: 'user_id,hidden_user_id,venue_id', ignoreDuplicates: true },
  )
  if (hideErr) return NextResponse.json({ error: hideErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
