// Returns everything the join page needs on load — venue data + current user's
// master profile — in a single server-side call, avoiding the browser SDK hang.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const admin = adminClient()

  // Venue
  const { data: venue } = await admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, image_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  // Live count
  const { count } = await admin
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue.id)
    .eq('is_visible', true)
    .gt('expires_at', new Date().toISOString())

  // Current user (optional — guest may not be signed in yet)
  let masterProfile = null
  try {
    const ssr = await serverClient()
    const { data: userData } = await ssr.auth.getUser()
    if (userData.user) {
      const [profileRes] = await Promise.all([
        admin.from('master_profiles').select('*').eq('user_id', userData.user.id).maybeSingle(),
      ])
      const p = profileRes.data
      if (p) {
        masterProfile = {
          userId: userData.user.id,
          email:  userData.user.email ?? '',
          name:   p.name   ?? null,
          age:    p.age    ?? null,
          gender: p.gender ?? null,
        }
      } else if (userData.user.email) {
        masterProfile = {
          userId: userData.user.id,
          email:  userData.user.email,
          name:   null, age: null, gender: null,
        }
      }
    }
  } catch { /* not signed in */ }

  return NextResponse.json({
    venue: {
      id:           venue.id,
      slug:         venue.slug,
      name:         venue.name,
      tagline:      venue.tagline ?? '',
      category:     venue.category,
      coordinates:  { lat: venue.lat, lng: venue.lng },
      radiusMeters: venue.radius_meters,
      isActive:     venue.is_active,
      isPremium:    venue.is_premium,
      liveCount:    count ?? 0,
      coverImageUrl: venue.image_url ?? null,
      createdAt:    venue.created_at,
    },
    masterProfile,
  })
}
