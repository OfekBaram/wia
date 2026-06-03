// Server-side venue creation. Replaces the broken client-side createVenue()
// which hung on the browser Supabase SDK after auth.
//
// Enforces role rules:
//   - super_admin: unlimited venues
//   - venue_owner: max 1 venue (their own)
//   - anyone else: rejected

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'
import type { VenueCategory } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Body {
  slug:           string
  name:           string
  tagline?:       string
  category:       VenueCategory
  lat:            number
  lng:            number
  radiusMeters:   number
  imageDataUrl?:  string
}

export async function POST(req: Request) {
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  if (!body.slug || !body.name || !body.category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ error: 'lat/lng must be numbers' }, { status: 400 })
  }
  if (!body.radiusMeters || body.radiusMeters < 10 || body.radiusMeters > 1000) {
    return NextResponse.json({ error: 'radius must be between 10 and 1000m' }, { status: 400 })
  }

  // Identify the caller
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const userId = userData.user.id

  const admin = adminClient()

  // Resolve role
  const { data: roleRow } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  const isSuperAdmin = roleRow?.role === 'super_admin'
  const isVenueOwner = roleRow?.role === 'venue_owner'

  if (!isSuperAdmin && !isVenueOwner) {
    return NextResponse.json({ error: 'Only admins and venue owners can create venues' }, { status: 403 })
  }

  // Venue owners are capped at 1 venue
  if (isVenueOwner) {
    const { data: existing } = await admin
      .from('venues')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'You already have a venue. Venue owners can manage one venue per account.' },
        { status: 409 },
      )
    }
  }

  // Slug uniqueness
  const { data: slugClash } = await admin
    .from('venues')
    .select('slug')
    .eq('slug', body.slug)
    .maybeSingle()
  if (slugClash) {
    return NextResponse.json({ error: `A venue with slug "${body.slug}" already exists.` }, { status: 409 })
  }

  // Upload venue image if provided
  let imageUrl: string | null = null
  if (body.imageDataUrl) {
    const match = body.imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      const mimeType = match[1]
      const ext = mimeType.split('/')[1] ?? 'jpg'
      const buf = Buffer.from(match[2], 'base64')
      const path = `${body.slug}/cover.${ext}`
      const { error: upErr } = await admin.storage
        .from('venue-images')
        .upload(path, buf, { contentType: mimeType, upsert: true })
      if (!upErr) {
        const { data: urlData } = admin.storage.from('venue-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
    }
  }

  // Create
  const { data, error } = await admin
    .from('venues')
    .insert({
      slug:          body.slug,
      name:          body.name,
      tagline:       body.tagline ?? '',
      category:      body.category,
      lat:           body.lat,
      lng:           body.lng,
      radius_meters: body.radiusMeters,
      owner_id:      userId,
      image_url:     imageUrl,
    })
    .select('id, slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug })
}
