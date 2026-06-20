// Visitor list for a venue's room — available to the venue's owner and to
// super admins. Returns one row per user who has joined this venue's room
// (presence is upserted per user+venue), newest first, with their email
// resolved from auth.users.

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
    .from('venues').select('id, owner_id').eq('slug', slug).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  if (roleRow.role !== 'super_admin' && venue.owner_id !== userData.user.id) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const { data: presence } = await admin
    .from('presence')
    .select('user_id, name, age, gender, joined_at')
    .eq('venue_id', venue.id)
    .order('joined_at', { ascending: false })

  const rows = presence ?? []

  // Resolve each unique visitor's email from auth.users.
  const ids = [...new Set(rows.map(r => r.user_id))]
  const emailMap: Record<string, string | null> = {}
  await Promise.all(ids.map(async (id) => {
    const { data: u } = await admin.auth.admin.getUserById(id)
    emailMap[id] = u?.user?.email ?? null
  }))

  const visitors = rows.map(r => ({
    userId:   r.user_id,
    name:     r.name ?? '',
    age:      r.age ?? null,
    gender:   r.gender ?? null,
    email:    emailMap[r.user_id] ?? null,
    joinedAt: r.joined_at,
  }))

  return NextResponse.json({ visitors })
}
