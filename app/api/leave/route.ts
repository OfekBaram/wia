import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { venueId } = await req.json().catch(() => ({} as { venueId?: string }))
  if (!venueId) return NextResponse.json({ error: 'venueId required' }, { status: 400 })

  const admin = adminClient()
  await admin.from('presence').delete()
    .eq('user_id', userData.user.id)
    .eq('venue_id', venueId)

  return NextResponse.json({ ok: true })
}
