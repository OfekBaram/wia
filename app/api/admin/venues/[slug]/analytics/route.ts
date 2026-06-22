import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ slug: string }> }

type Range = 'today' | '7d' | '30d' | '90d'
type Gran  = 'hour' | 'day' | 'week'

const DAY = 24 * 60 * 60 * 1000

function rangeStartAndGran(range: Range): { start: Date; gran: Gran } {
  const now = new Date()
  if (range === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return { start: d, gran: 'hour' } }
  if (range === '7d')    return { start: new Date(now.getTime() - 7  * DAY), gran: 'day' }
  if (range === '90d')   return { start: new Date(now.getTime() - 90 * DAY), gran: 'week' }
  return { start: new Date(now.getTime() - 30 * DAY), gran: 'day' }
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export async function GET(req: Request, { params }: RouteParams) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const range = (['today', '7d', '30d', '90d'].includes(searchParams.get('range') ?? '')
    ? searchParams.get('range') : '30d') as Range

  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const admin = adminClient()
  const { data: roleRow } = await admin
    .from('admin_users').select('role').eq('user_id', userData.user.id).maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: venue } = await admin
    .from('venues').select('id, scan_count, peak_count, owner_id').eq('slug', slug).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  if (roleRow.role !== 'super_admin' && venue.owner_id !== userData.user.id) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const { start, gran } = rangeStartAndGran(range)
  const startIso = start.toISOString()

  // All presence rows (one per user+venue). joined_at = first visit, last_seen_at = most recent.
  const { data: allPresence } = await admin
    .from('presence')
    .select('user_id, gender, age, joined_at, left_at, last_seen_at')
    .eq('venue_id', venue.id)
  const all = allPresence ?? []
  const inRange = all.filter(r => new Date(r.joined_at) >= start)

  // ── KPIs (range-scoped) ──────────────────────────────────────────────
  const visitors = inRange.length

  // Clamp to the 4h presence TTL: longer spans mean joined_at (first visit)
  // and left_at (a later visit's leave) bracket multiple visits — noise.
  const SESSION_CAP = 240
  const durations = inRange
    .filter(r => r.left_at)
    .map(r => (new Date(r.left_at!).getTime() - new Date(r.joined_at).getTime()) / 60_000)
    .filter(m => m > 0)
    .map(m => Math.min(m, SESSION_CAP))
  const avgSessionMin = durations.length
    ? Math.round(durations.reduce((s, m) => s + m, 0) / durations.length)
    : null

  const withAge = inRange.filter(r => r.age)
  const avgAge = withAge.length ? Math.round(withAge.reduce((s, r) => s + r.age, 0) / withAge.length) : null

  // Lifetime returning rate: came back on a different day than they first joined.
  const returned = all.filter(r => r.last_seen_at && ymd(new Date(r.last_seen_at)) > ymd(new Date(r.joined_at))).length
  const returningRate = all.length ? Math.round((returned / all.length) * 100) : 0

  // ── Visitors over time (by joined_at, bucketed by granularity) ───────
  const buckets = new Map<string, number>()
  const keyFor = (d: Date): string => {
    if (gran === 'hour') return String(d.getHours())
    if (gran === 'week') return ymd(new Date(d.getTime() - ((d.getTime() - start.getTime()) % (7 * DAY))))
    return ymd(d)
  }
  // seed empty buckets so the chart has a continuous axis
  if (gran === 'hour') { for (let h = 0; h < 24; h++) buckets.set(String(h), 0) }
  else {
    const step = gran === 'week' ? 7 * DAY : DAY
    for (let t = start.getTime(); t <= Date.now(); t += step) buckets.set(keyFor(new Date(t)), 0)
  }
  for (const r of inRange) { const k = keyFor(new Date(r.joined_at)); buckets.set(k, (buckets.get(k) ?? 0) + 1) }
  const series = [...buckets.entries()].map(([k, count]) => ({
    label: gran === 'hour' ? `${k.padStart(2, '0')}:00` : k.slice(5).replace('-', '/'),
    count,
  }))

  // ── Arrivals by hour of day (within range) ───────────────────────────
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${String(h).padStart(2, '0')}`, count: 0 }))
  for (const r of inRange) hourly[new Date(r.joined_at).getHours()].count += 1

  // ── Age distribution (within range) ──────────────────────────────────
  const ageDefs = [['18–24', 18, 24], ['25–34', 25, 34], ['35–44', 35, 44], ['45+', 45, 200]] as const
  const ageBuckets = ageDefs.map(([label, lo, hi]) => ({
    label, count: inRange.filter(r => r.age && r.age >= lo && r.age <= hi).length,
  }))

  // ── Gender (within range) ────────────────────────────────────────────
  const genderCounts: Record<string, number> = {}
  for (const r of inRange) genderCounts[r.gender ?? 'unspecified'] = (genderCounts[r.gender ?? 'unspecified'] ?? 0) + 1

  // ── Likes & messages (range-scoped via created_at) ───────────────────
  const [likesRes, msgsRes] = await Promise.all([
    admin.from('likes').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id).gte('created_at', startIso),
    admin.from('chat_messages').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id).gte('created_at', startIso),
  ])

  return NextResponse.json({
    range, granularity: gran,
    kpis: {
      visitors,
      avgSessionMin,
      avgAge,
      totalLikes:    likesRes.count ?? 0,
      totalMessages: msgsRes.count ?? 0,
      returningRate,                       // lifetime
      peakCount:     venue.peak_count ?? 0, // lifetime
      scanCount:     venue.scan_count ?? 0, // lifetime
    },
    series,
    hourly,
    ageBuckets,
    genderCounts,
  })
}
