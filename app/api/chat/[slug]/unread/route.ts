// Returns the latest message timestamp per match for the current user.
// The client compares these against sessionStorage last-read times to
// compute unread counts without fetching full message histories.

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
  const me = userData.user.id

  const { data: venue } = await admin.from('venues').select('id').eq('slug', slug).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  // Get all messages in this venue involving the current user, ordered newest first
  const { data: messages } = await admin
    .from('chat_messages')
    .select('from_user_id, to_user_id, text, created_at')
    .eq('venue_id', venue.id)
    .or(`from_user_id.eq.${me},to_user_id.eq.${me}`)
    .order('created_at', { ascending: false })
    .limit(200)

  // Build latest-message-per-partner map
  const latest: Record<string, { fromUserId: string; text: string; createdAt: string }> = {}
  for (const m of messages ?? []) {
    const partner = m.from_user_id === me ? m.to_user_id : m.from_user_id
    if (!latest[partner]) {
      latest[partner] = { fromUserId: m.from_user_id, text: m.text, createdAt: m.created_at }
    }
  }

  return NextResponse.json({ latest })
}
