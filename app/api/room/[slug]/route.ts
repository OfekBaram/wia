// Returns everything the room page needs for a single user, in one call.
// Reads auth from the session cookie (via serverClient) and uses adminClient
// to bypass RLS — way more reliable than the browser SDK which can hang on
// cookie state in some environments.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params
  const admin = adminClient()

  const { data: venue, error: vErr } = await admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, image_url, peak_count')
    .eq('slug', slug)
    .maybeSingle()
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })
  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  // Public count (always visible)
  const { count } = await admin
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue.id)
    .eq('is_visible', true)
    .gt('expires_at', new Date().toISOString())

  // Update peak_count if current exceeds stored peak
  if ((count ?? 0) > (venue.peak_count ?? 0)) {
    await admin.from('venues').update({ peak_count: count }).eq('id', venue.id)
  }

  // Who is the caller?
  let userId: string | null = null
  try {
    const ssr = await serverClient()
    const { data } = await ssr.auth.getUser()
    userId = data.user?.id ?? null
  } catch { /* not signed in */ }

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
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    myPresenceId = mine?.id ?? null

    // Only members get to see the full presence list + likes
    if (myPresenceId) {
      const [presRes, sentRes, recvRes] = await Promise.all([
        admin
          .from('presence')
          .select('id, user_id, name, age, gender, status_text, selfie_url, joined_at, is_visible, is_ghost_mode')
          .eq('venue_id', venue.id)
          .eq('is_visible', true)
          .gt('expires_at', new Date().toISOString())
          .order('joined_at', { ascending: false }),
        admin.from('likes')
          .select('to_user_id')
          .eq('venue_id', venue.id)
          .eq('from_user_id', userId),
        admin.from('likes')
          .select('from_user_id')
          .eq('venue_id', venue.id)
          .eq('to_user_id', userId),
      ])
      presence      = presRes.data ?? []
      likesSent     = (sentRes.data ?? []).map(r => r.to_user_id)
      likesReceived = (recvRes.data ?? []).map(r => r.from_user_id)
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
