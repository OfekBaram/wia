// Send / unsend a like. Uses the SSR cookie client so RLS applies as the
// authed user, but bypasses the broken browser SDK that was hanging the form.
//
// POST   { venueSlug, toUserId }  → insert (returns 200 / 409 already-liked / 403 limit)
// Likes are permanent — no unlike.
//
// The 5-like-per-room cap is enforced by the DB trigger; we surface its error.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function resolve(req: Request) {
  const { venueSlug, toUserId } = await req.json().catch(() => ({} as { venueSlug?: string; toUserId?: string }))
  if (!venueSlug || !toUserId) return { error: NextResponse.json({ error: 'venueSlug and toUserId required' }, { status: 400 }) }

  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }

  const admin = adminClient()
  const { data: venue } = await admin.from('venues').select('id').eq('slug', venueSlug).maybeSingle()
  if (!venue) return { error: NextResponse.json({ error: 'venue not found' }, { status: 404 }) }

  return { fromUserId: userData.user.id, toUserId, venueId: venue.id, admin }
}

export async function POST(req: Request) {
  const r = await resolve(req)
  if ('error' in r) return r.error
  const { fromUserId, toUserId, venueId, admin } = r

  if (fromUserId === toUserId) {
    return NextResponse.json({ error: "You can't like yourself" }, { status: 400 })
  }

  const { error } = await admin.from('likes').insert({
    venue_id:     venueId,
    from_user_id: fromUserId,
    to_user_id:   toUserId,
  })

  if (error) {
    if (error.message.includes('like_limit_reached')) {
      return NextResponse.json({ error: "You've used all 5 likes in this room", code: 'limit' }, { status: 403 })
    }
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if this completes a match
  const { data: reverse } = await admin
    .from('likes')
    .select('id')
    .eq('venue_id', venueId)
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .maybeSingle()

  return NextResponse.json({ ok: true, isMatch: !!reverse })
}

// Likes are permanent by design — there is intentionally no DELETE handler.
