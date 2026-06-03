import { supabase } from '@/lib/supabase/client'
import type { DbPresence } from '@/lib/supabase/types'
import type { Gender, PresenceProfile } from '@/lib/types'

function rowToPresence(r: DbPresence): PresenceProfile {
  return {
    id:            r.id,
    userId:        r.user_id,
    locationSlug:  '',                 // resolved separately if needed
    name:          r.name,
    age:           r.age,
    gender:        r.gender,
    selfieUrl:     r.selfie_url,
    statusText:    r.status_text,
    isGhostMode:   r.is_ghost_mode,
    isVisible:     r.is_visible,
    arrivedAt:     new Date(r.joined_at),
    lastSeenAt:    new Date(r.last_seen_at),
    isNew:         Date.now() - new Date(r.joined_at).getTime() < 10 * 60_000,
    waveCount:     0, // computed via waves table when needed
  }
}

const PRESENCE_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

export async function listVenuePresence(venueId: string): Promise<PresenceProfile[]> {
  const { data, error } = await supabase()
    .from('presence')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_visible', true)
    .gt('expires_at', new Date().toISOString())
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data as DbPresence[]).map(rowToPresence)
}

export interface JoinVenueInput {
  venueId:     string
  name:        string
  age:         number
  gender:      Gender
  statusText:  string
  selfieUrl:   string
}

export async function joinVenue(input: JoinVenueInput): Promise<PresenceProfile> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) throw new Error('Not signed in')

  // Upsert — re-joining same venue updates the existing row
  const { data, error } = await sb
    .from('presence')
    .upsert(
      {
        user_id:      userData.user.id,
        venue_id:     input.venueId,
        name:         input.name,
        age:          input.age,
        gender:       input.gender,
        status_text:  input.statusText,
        selfie_url:   input.selfieUrl,
        expires_at:   new Date(Date.now() + PRESENCE_TTL_MS).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_visible:   true,
      },
      { onConflict: 'user_id,venue_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return rowToPresence(data as DbPresence)
}

export async function getMyPresence(venueId: string): Promise<PresenceProfile | null> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return null

  const { data, error } = await sb
    .from('presence')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('venue_id', venueId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) throw error
  return data ? rowToPresence(data as DbPresence) : null
}

export async function leaveVenue(venueId: string): Promise<void> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return
  await sb.from('presence').delete()
    .eq('user_id', userData.user.id)
    .eq('venue_id', venueId)
}

/** Heartbeat — keep the presence alive while user has the tab open. */
export async function pingPresence(venueId: string): Promise<void> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return
  await sb.from('presence')
    .update({
      last_seen_at: new Date().toISOString(),
      expires_at:   new Date(Date.now() + PRESENCE_TTL_MS).toISOString(),
    })
    .eq('user_id', userData.user.id)
    .eq('venue_id', venueId)
}
