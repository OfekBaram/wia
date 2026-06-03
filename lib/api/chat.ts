import { supabase } from '@/lib/supabase/client'

export interface ChatMessage {
  id:           string
  venue_id:     string
  from_user_id: string
  to_user_id:   string
  text:         string
  created_at:   string
}

export async function listMessages(venueId: string, otherUserId: string): Promise<ChatMessage[]> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return []

  const myId = userData.user.id
  const { data, error } = await sb
    .from('chat_messages')
    .select('*')
    .eq('venue_id', venueId)
    .or(
      `and(from_user_id.eq.${myId},to_user_id.eq.${otherUserId}),` +
      `and(from_user_id.eq.${otherUserId},to_user_id.eq.${myId})`,
    )
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return []
  return (data as ChatMessage[]) ?? []
}

export async function sendMessage(
  venueId: string, toUserId: string, text: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return { ok: false, reason: 'Not signed in' }

  const trimmed = text.trim()
  if (!trimmed) return { ok: false, reason: 'Empty message' }
  if (trimmed.length > 1000) return { ok: false, reason: 'Message too long (max 1000 chars)' }

  const { error } = await sb.from('chat_messages').insert({
    venue_id:     venueId,
    from_user_id: userData.user.id,
    to_user_id:   toUserId,
    text:         trimmed,
  })
  if (error) {
    if (error.code === '42501') {
      return { ok: false, reason: 'You need a mutual like to chat with this person' }
    }
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}
