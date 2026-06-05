import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = adminClient()

  const { data, error } = await admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ venues: [] })

  // Get live count for each venue
  const venues = await Promise.all((data ?? []).map(async v => {
    const { count } = await admin
      .from('presence')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', v.id)
      .eq('is_visible', true)
      .gt('expires_at', new Date().toISOString())

    return {
      id:            v.id,
      slug:          v.slug,
      name:          v.name,
      tagline:       v.tagline ?? '',
      category:      v.category,
      coordinates:   { lat: v.lat, lng: v.lng },
      radiusMeters:  v.radius_meters,
      isActive:      v.is_active,
      isPremium:     v.is_premium,
      liveCount:     count ?? 0,
      coverImageUrl: v.image_url ?? null,
      createdAt:     v.created_at,
    }
  }))

  return NextResponse.json({ venues })
}
