// Chat messages for a venue + other-user pair.
// Server-side so we don't rely on the browser SDK (which hangs).
//
// GET  → list last 200 messages, oldest first
// POST → send a message — but only if there's a mutual like between us.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ slug: string; otherUserId: string }> }

async function ctx({ params }: RouteParams) {
  const { slug, otherUserId } = await params
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return { unauth: true as const }

  const admin = adminClient()
  const { data: venue } = await admin.from('venues').select('id').eq('slug', slug).maybeSingle()
  if (!venue) return { notFound: true as const }

  return { me: userData.user.id, otherUserId, venueId: venue.id, admin }
}

export async function GET(_req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)   return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('notFound' in c) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  const { data, error } = await c.admin
    .from('chat_messages')
    .select('id, venue_id, from_user_id, to_user_id, text, created_at')
    .eq('venue_id', c.venueId)
    .or(
      `and(from_user_id.eq.${c.me},to_user_id.eq.${c.otherUserId}),` +
      `and(from_user_id.eq.${c.otherUserId},to_user_id.eq.${c.me})`,
    )
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)   return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('notFound' in c) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  const { text } = await req.json().catch(() => ({} as { text?: string }))
  const trimmed = (text ?? '').trim()
  if (!trimmed)                return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  if (trimmed.length > 1000)   return NextResponse.json({ error: 'Message too long (max 1000)' }, { status: 400 })

  // Enforce mutual like server-side (RLS would too, but explicit is clearer)
  const { data: matchData } = await c.admin
    .from('likes')
    .select('from_user_id, to_user_id')
    .eq('venue_id', c.venueId)
    .or(
      `and(from_user_id.eq.${c.me},to_user_id.eq.${c.otherUserId}),` +
      `and(from_user_id.eq.${c.otherUserId},to_user_id.eq.${c.me})`,
    )
  const mutual = (matchData?.length ?? 0) >= 2
  if (!mutual) {
    return NextResponse.json({ error: 'You need a mutual like to chat with this person' }, { status: 403 })
  }

  const { data, error } = await c.admin.from('chat_messages').insert({
    venue_id:     c.venueId,
    from_user_id: c.me,
    to_user_id:   c.otherUserId,
    text:         trimmed,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: data })
}
