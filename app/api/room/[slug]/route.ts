// Returns everything the room page needs for a single user, in one call.
// Reads auth from the session cookie (via serverClient) and uses adminClient
// to bypass RLS — way more reliable than the browser SDK which can hang on
// cookie state in some environments.
//
// Presence freshness: every poll updates the caller's `last_seen_at`, and the
// live view + count only include people seen in the last FRESH_MINUTES. This
// keeps the room honest — people who close the tab / walk off without the
// geofence firing drop out instead of lingering as "here now" ghosts.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FRESH_MINUTES = 30

interface RouteParams { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params
  const admin = adminClient()

  const now         = new Date().toISOString()
  const freshCutoff = new Date(Date.now() - FRESH_MINUTES * 60 * 1000).toISOString()

  const { data: venue, error: vErr } = await admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, image_url, peak_count')
    .eq('slug', slug)
    .maybeSingle()
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })
  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  // Who is the caller?
  let userId: string | null = null
  try {
    const ssr = await serverClient()
    const { data } = await ssr.auth.getUser()
    userId = data.user?.id ?? null
  } catch { /* not signed in */ }

  // Heartbeat — this poll IS the proof they're still here. Mark them seen now
  // so they stay in the live view (and so others' freshness filter keeps them).
  if (userId) {
    await admin
      .from('presence')
      .update({ last_seen_at: now })
      .eq('user_id', userId)
      .eq('venue_id', venue.id)
  }

  // Public count — only people seen within the freshness window
  const { count } = await admin
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue.id)
    .eq('is_visible', true)
    .gt('expires_at', now)
    .gt('last_seen_at', freshCutoff)

  // Update peak_count if current exceeds stored peak
  if ((count ?? 0) > (venue.peak_count ?? 0)) {
    await admin.from('venues').update({ peak_count: count }).eq('id', venue.id)
  }

  // Is this user currently in the room?
  let myPresenceId: string | null = null
  let presence: unknown[] = []
  let likesSent:     string[] = []
  let likesReceived: string[] = []

  if (userId) {
    const { data: mine } = await admin
      .from('presence')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', venue.id)
      .gt('expires_at', now)
      .maybeSingle()
    myPresenceId = mine?.id ?? null

    // Only members get to see the full presence list + likes
    if (myPresenceId) {
      const [presRes, sentRes, recvRes, hidesRes] = await Promise.all([
        admin
          .from('presence')
          .select('id, user_id, name, age, gender, status_text, selfie_url, joined_at, is_visible, is_ghost_mode')
          .eq('venue_id', venue.id)
          .eq('is_visible', true)
          .gt('expires_at', now)
          .gt('last_seen_at', freshCutoff)
          .order('joined_at', { ascending: false }),
        admin.from('likes')
          .select('to_user_id')
          .eq('venue_id', venue.id)
          .eq('from_user_id', userId),
        admin.from('likes')
          .select('from_user_id')
          .eq('venue_id', venue.id)
          .eq('to_user_id', userId),
        admin.from('user_hides')
          .select('hidden_user_id')
          .eq('venue_id', venue.id)
          .eq('user_id', userId),
      ])
      const hidden = new Set((hidesRes.data ?? []).map(r => r.hidden_user_id))
      presence      = (presRes.data ?? []).filter(p => !hidden.has((p as { user_id: string }).user_id))
      likesSent     = (sentRes.data ?? []).map(r => r.to_user_id)
      likesReceived = (recvRes.data ?? []).map(r => r.from_user_id).filter(id => !hidden.has(id))
    }
  }

  return NextResponse.json({
    venue: {
      id:            venue.id,
      slug:          venue.slug,
      name:          venue.name,
      tagline:       venue.tagline ?? '',
      category:      venue.category,
      coordinates:   { lat: venue.lat, lng: venue.lng },
      radiusMeters:  venue.radius_meters,
      isActive:      venue.is_active,
      isPremium:     venue.is_premium,
      createdAt:     venue.created_at,
      imageUrl:      venue.image_url ?? null,
    },
    liveCount:    count ?? 0,
    userId,
    isMember:     !!myPresenceId,
    myPresenceId,
    presence,
    likesSent,
    likesReceived,
  })
}
