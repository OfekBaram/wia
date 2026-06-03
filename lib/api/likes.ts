import { supabase } from '@/lib/supabase/client'

export const LIKE_LIMIT_PER_ROOM = 5

export interface LikeRow {
  id:           string
  venue_id:     string
  from_user_id: string
  to_user_id:   string
  created_at:   string
}

/** Likes the current user has SENT in this venue. Used for limit check + UI state. */
export async function getMySentLikes(venueId: string): Promise<LikeRow[]> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await sb
    .from('likes')
    .select('*')
    .eq('venue_id', venueId)
    .eq('from_user_id', userData.user.id)

  if (error) return []
  return (data as LikeRow[]) ?? []
}

/** Likes the current user has RECEIVED in this venue. Used for match detection. */
export async function getMyReceivedLikes(venueId: string): Promise<LikeRow[]> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await sb
    .from('likes')
    .select('*')
    .eq('venue_id', venueId)
    .eq('to_user_id', userData.user.id)

  if (error) return []
  return (data as LikeRow[]) ?? []
}

export async function sendLike(venueId: string, toUserId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return { ok: false, reason: 'Not signed in' }
  if (userData.user.id === toUserId) return { ok: false, reason: "You can't like yourself" }

  const { error } = await sb.from('likes').insert({
    venue_id:     venueId,
    from_user_id: userData.user.id,
    to_user_id:   toUserId,
  })
  if (error) {
    if (error.message.includes('like_limit_reached')) {
      return { ok: false, reason: `You've used all ${LIKE_LIMIT_PER_ROOM} likes in this room` }
    }
    if (error.code === '23505') {
      return { ok: false, reason: 'Already liked' }
    }
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}

export async function unsendLike(venueId: string, toUserId: string): Promise<boolean> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return false
  const { error } = await sb.from('likes').delete()
    .eq('venue_id', venueId)
    .eq('from_user_id', userData.user.id)
    .eq('to_user_id', toUserId)
  return !error
}
