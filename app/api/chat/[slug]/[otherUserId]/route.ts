// Chat messages for a venue + other-user pair.
// Server-side so we don't rely on the browser SDK (which hangs).
//
// GET  → list last 200 messages, oldest first
// POST → send a message — but only if there's a mutual like between us.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push'

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

  // Is the other person currently typing to me? (heartbeat within last 6s)
  const { data: typingRow } = await c.admin
    .from('chat_typing')
    .select('updated_at')
    .eq('venue_id', c.venueId)
    .eq('from_user_id', c.otherUserId)
    .eq('to_user_id', c.me)
    .maybeSingle()
  const partnerTyping = !!typingRow && (Date.now() - new Date(typingRow.updated_at).getTime() < 6000)

  return NextResponse.json({ messages: data ?? [], partnerTyping })
}

// Typing heartbeat — the client PUTs this every couple of seconds while the
// user is actively typing. Upsert refreshes updated_at.
export async function PUT(_req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)   return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('notFound' in c) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  await c.admin.from('chat_typing').upsert(
    { venue_id: c.venueId, from_user_id: c.me, to_user_id: c.otherUserId, updated_at: new Date().toISOString() },
    { onConflict: 'venue_id,from_user_id,to_user_id' },
  )
  return NextResponse.json({ ok: true })
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

  // Sending ends the typing state — clear my heartbeat so the indicator drops
  // immediately rather than lingering for the 6s window.
  await c.admin.from('chat_typing').delete()
    .eq('venue_id', c.venueId).eq('from_user_id', c.me).eq('to_user_id', c.otherUserId)

  // Notify the recipient — collapses to one notification per sender via tag
  const [{ data: venue }, { data: sender }] = await Promise.all([
    c.admin.from('venues').select('slug, name').eq('id', c.venueId).maybeSingle(),
    c.admin.from('presence').select('name').eq('venue_id', c.venueId).eq('user_id', c.me).maybeSingle(),
  ])
  if (venue) {
    const body = trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed
    const url  = `/${venue.slug}`
    const tag  = `chat-${c.venueId}-${c.me}`
    await sendPushToUser(c.otherUserId, {
      en: { title: `${sender?.name ?? 'Someone'} sent you a message`, body, url, tag },
      he: { title: `${sender?.name ?? 'מישהו'} שלח לכם הודעה`, body, url, tag },
    })
  }

  return NextResponse.json({ ok: true, message: data })
}
