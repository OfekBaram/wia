// Public live-count endpoint.
// Anyone can GET this — returns the number of *visible* presence rows whose
// session hasn't expired. Identities stay private (gated by RLS on the
// `presence` table itself). Implementation uses the service-role admin client
// so the count is accurate regardless of who is calling.

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const sb = adminClient()

  // Lookup venue id by slug
  const { data: venue, error: venueErr } = await sb
    .from('venues')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (venueErr || !venue) {
    return NextResponse.json({ count: 0 }, { status: 200 })
  }

  const { count, error } = await sb
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venue.id)
    .eq('is_visible', true)
    .gt('expires_at', new Date().toISOString())

  if (error) return NextResponse.json({ count: 0 }, { status: 200 })

  return NextResponse.json(
    { count: count ?? 0 },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
