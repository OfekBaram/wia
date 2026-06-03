import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = adminClient()
  const { data: roleRow } = await admin
    .from('admin_users').select('role').eq('user_id', userData.user.id).maybeSingle()
  if (roleRow?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const { data: venues } = await admin
    .from('venues')
    .select('id, slug, name, category, scan_count, peak_count, is_active, created_at')
    .order('created_at', { ascending: false })

  if (!venues) return NextResponse.json({ venues: [] })

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  // For each venue get live count + today's visitors
  const enriched = await Promise.all(venues.map(async v => {
    const [liveRes, todayRes, totalRes] = await Promise.all([
      admin.from('presence').select('*', { count: 'exact', head: true })
        .eq('venue_id', v.id).eq('is_visible', true).gt('expires_at', new Date().toISOString()),
      admin.from('presence').select('user_id', { count: 'exact', head: true })
        .eq('venue_id', v.id).gte('joined_at', todayStart.toISOString()),
      admin.from('presence').select('user_id', { count: 'exact', head: true })
        .eq('venue_id', v.id),
    ])
    return {
      id:            v.id,
      slug:          v.slug,
      name:          v.name,
      category:      v.category,
      isActive:      v.is_active,
      scanCount:     v.scan_count ?? 0,
      peakCount:     v.peak_count ?? 0,
      liveNow:       liveRes.count ?? 0,
      visitorsToday: todayRes.count ?? 0,
      totalVisitors: totalRes.count ?? 0,
    }
  }))

  return NextResponse.json({ venues: enriched })
}
