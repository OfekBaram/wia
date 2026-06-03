// Admin venue list, filtered by the caller's role.
//   - super_admin → all venues
//   - venue_owner → only venues they own
//   - else        → 403

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const admin = adminClient()
  const { data: roleRow } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (!roleRow) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let query = admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, owner_id')
    .order('created_at', { ascending: false })

  if (roleRow.role !== 'super_admin') {
    query = query.eq('owner_id', userData.user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Live counts via the existing count function — same admin client
  const venues = await Promise.all(
    (data ?? []).map(async (v) => {
      const { count } = await admin
        .from('presence')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', v.id)
        .eq('is_visible', true)
        .gt('expires_at', new Date().toISOString())
      return {
        id:           v.id,
        slug:         v.slug,
        name:         v.name,
        tagline:      v.tagline ?? '',
        category:     v.category,
        coordinates:  { lat: v.lat, lng: v.lng },
        radiusMeters: v.radius_meters,
        isActive:     v.is_active,
        isPremium:    v.is_premium,
        liveCount:    count ?? 0,
        createdAt:    v.created_at,
      }
    }),
  )

  return NextResponse.json({
    role:   roleRow.role,
    venues,
  })
}
