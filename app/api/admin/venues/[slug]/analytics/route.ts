import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = adminClient()

  const { data: roleRow } = await admin
    .from('admin_users').select('role').eq('user_id', userData.user.id).maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: venue } = await admin
    .from('venues')
    .select('id, scan_count, peak_count, owner_id')
    .eq('slug', slug)
    .maybeSingle()
  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  if (roleRow.role !== 'super_admin' && venue.owner_id !== userData.user.id) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekStart  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
  const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // All presence rows for this venue (including historical soft-deleted)
  const { data: allPresence } = await admin
    .from('presence')
    .select('user_id, gender, age, joined_at, left_at, last_seen_at')
    .eq('venue_id', venue.id)

  const rows = allPresence ?? []

  // Total unique visitors
  const totalVisitors = new Set(rows.map(r => r.user_id)).size

  // Visitors today
  const visitorsToday = new Set(
    rows.filter(r => new Date(r.joined_at) >= todayStart).map(r => r.user_id)
  ).size

  // Visitors this week
  const visitorsWeek = new Set(
    rows.filter(r => new Date(r.joined_at) >= weekStart).map(r => r.user_id)
  ).size

  // Avg session length (minutes) — only for rows with left_at
  const completedSessions = rows.filter(r => r.left_at)
  const avgSessionMin = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((sum, r) => {
          const ms = new Date(r.left_at!).getTime() - new Date(r.joined_at).getTime()
          return sum + ms / 60_000
        }, 0) / completedSessions.length
      )
    : null

  // Gender breakdown
  const genderCounts: Record<string, number> = {}
  for (const r of rows) {
    genderCounts[r.gender ?? 'unspecified'] = (genderCounts[r.gender ?? 'unspecified'] ?? 0) + 1
  }

  // Avg age
  const withAge = rows.filter(r => r.age)
  const avgAge = withAge.length > 0
    ? Math.round(withAge.reduce((s, r) => s + r.age, 0) / withAge.length)
    : null

  // Total likes & messages for this venue
  const [likesRes, msgsRes] = await Promise.all([
    admin.from('likes').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id),
    admin.from('chat_messages').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id),
  ])

  // Visitors by day (last 30 days) for the chart
  const byDay: Record<string, number> = {}
  for (const r of rows) {
    if (new Date(r.joined_at) < monthStart) continue
    const day = r.joined_at.slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + 1
  }
  const dailySeries = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))

  return NextResponse.json({
    totalVisitors,
    visitorsToday,
    visitorsWeek,
    avgSessionMin,
    avgAge,
    genderCounts,
    scanCount:    venue.scan_count ?? 0,
    peakCount:    venue.peak_count ?? 0,
    totalLikes:   likesRes.count ?? 0,
    totalMessages: msgsRes.count ?? 0,
    dailySeries,
  })
}
