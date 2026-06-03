import { supabase } from '@/lib/supabase/client'
import type { DbVenue } from '@/lib/supabase/types'
import type { Location, VenueCategory } from '@/lib/types'

function rowToVenue(r: DbVenue): Location {
  return {
    id:             r.id,
    slug:           r.slug,
    name:           r.name,
    tagline:        r.tagline ?? '',
    category:       r.category,
    coordinates:    { lat: r.lat, lng: r.lng },
    radiusMeters:   r.radius_meters,
    isActive:       r.is_active,
    isPremium:      r.is_premium,
    liveCount:      0,
    createdAt:      new Date(r.created_at),
    coverImageUrl:  r.image_url ?? undefined,
  }
}

export async function listVenues(): Promise<Location[]> {
  const { data, error } = await supabase()
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DbVenue[]).map(rowToVenue)
}

export async function getVenueBySlug(slug: string): Promise<Location | null> {
  const { data, error } = await supabase()
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? rowToVenue(data as DbVenue) : null
}

/** Used by the admin venue detail page — exposes the scan_secret for QR generation. */
export async function getVenueWithSecret(slug: string): Promise<(Location & { scanSecret: string; ownerId: string | null }) | null> {
  const { data, error } = await supabase()
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const v = data as DbVenue
  return { ...rowToVenue(v), scanSecret: v.scan_secret, ownerId: v.owner_id }
}

export interface CreateVenueInput {
  slug:         string
  name:         string
  tagline?:     string
  category:     VenueCategory
  lat:          number
  lng:          number
  radiusMeters: number
}

export async function createVenue(input: CreateVenueInput): Promise<Location> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) throw new Error('Not signed in')

  // Venue owners are capped at 1 venue. Check their role + existing venues.
  const { data: roleRow } = await sb
    .from('admin_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  const isSuperAdmin = roleRow?.role === 'super_admin'

  if (!isSuperAdmin) {
    const { data: existing } = await sb
      .from('venues')
      .select('id')
      .eq('owner_id', userData.user.id)
      .limit(1)
    if (existing && existing.length > 0) {
      throw new Error('You already have a venue. Venue owners can manage one venue per account.')
    }
  }

  const { data, error } = await sb
    .from('venues')
    .insert({
      slug:          input.slug,
      name:          input.name,
      tagline:       input.tagline ?? '',
      category:      input.category,
      lat:           input.lat,
      lng:           input.lng,
      radius_meters: input.radiusMeters,
      owner_id:      userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return rowToVenue(data as DbVenue)
}

export async function deleteVenue(slug: string): Promise<void> {
  const { error } = await supabase().from('venues').delete().eq('slug', slug)
  if (error) throw error
}

/**
 * Live presence count for a venue. Calls the server-side `/api/venues/:slug/count`
 * endpoint which uses the service-role client so anon visitors see the count
 * even though RLS blocks them from reading the identity rows.
 */
export async function getLiveCount(slugOrId: string, opts?: { isSlug?: boolean }): Promise<number> {
  // Backwards compatibility: callers used to pass the venueId. We accept either,
  // but the new code path is by-slug.
  const slug = opts?.isSlug !== false && !/^[0-9a-f-]{36}$/i.test(slugOrId) ? slugOrId : null
  if (!slug) {
    // Legacy path: look up the slug from the venues cache. Since slug isn't
    // available, fall back to client query (works for authenticated users).
    const { count } = await supabase()
      .from('presence')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', slugOrId)
      .eq('is_visible', true)
      .gt('expires_at', new Date().toISOString())
    return count ?? 0
  }
  try {
    const res = await fetch(`/api/venues/${encodeURIComponent(slug)}/count`, { cache: 'no-store' })
    if (!res.ok) return 0
    const data = await res.json()
    return data.count ?? 0
  } catch { return 0 }
}

/** Look up the count by slug (preferred — works without auth). */
export async function getLiveCountBySlug(slug: string): Promise<number> {
  try {
    const res = await fetch(`/api/venues/${encodeURIComponent(slug)}/count`, { cache: 'no-store' })
    if (!res.ok) return 0
    const data = await res.json()
    return data.count ?? 0
  } catch { return 0 }
}

export function getBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://wia-orcin.vercel.app'
  return window.location.origin
}

export function venueRoomUrl(slug: string): string {
  return `${getBaseUrl()}/${slug}`
}

/** The URL printed on a venue's QR codes — encodes scan_secret as the token. */
export function venueScanUrl(slug: string, scanSecret: string): string {
  return `${getBaseUrl()}/${slug}?scan=${scanSecret}`
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
