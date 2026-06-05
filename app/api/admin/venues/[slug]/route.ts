// Admin venue detail (includes scan_secret for QR generation) + delete.
// Gates by ownership for venue owners.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
interface RouteParams { params: Promise<{ slug: string }> }

async function ctx({ params }: RouteParams) {
  const { slug } = await params
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return { unauth: true as const }

  const admin = adminClient()
  const { data: roleRow } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (!roleRow) return { forbidden: true as const }

  return { slug, me: userData.user.id, role: roleRow.role, admin }
}

export async function GET(_req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('forbidden' in c) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: v, error } = await c.admin
    .from('venues')
    .select('id, slug, name, tagline, category, lat, lng, radius_meters, is_active, is_premium, created_at, owner_id, scan_secret, image_url')
    .eq('slug', c.slug)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!v) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  // Ownership gate for venue owners
  if (c.role !== 'super_admin' && v.owner_id !== c.me) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const { count } = await c.admin
    .from('presence')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', v.id)
    .eq('is_visible', true)
    .gt('expires_at', new Date().toISOString())

  return NextResponse.json({
    venue: {
      id:           v.id,
      slug:         v.slug,
      name:         v.name,
      tagline:      v.tagline ?? '',
      category:     v.category,
      coordinates:  { lat: v.lat, lng: v.lng },
      radiusMeters: v.radius_meters,
      isActive:     v.is_active,
      isPremium:    v.is_premium,
      createdAt:    v.created_at,
      ownerId:      v.owner_id,
      scanSecret:   v.scan_secret,
      imageUrl:     v.image_url ?? null,
    },
    liveCount: count ?? 0,
    isOwner:   v.owner_id === c.me,
    role:      c.role,
  })
}

export async function PATCH(req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('forbidden' in c) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: v } = await c.admin.from('venues').select('owner_id').eq('slug', c.slug).maybeSingle()
  if (!v) return NextResponse.json({ error: 'venue not found' }, { status: 404 })
  if (c.role !== 'super_admin' && v.owner_id !== c.me) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  // ── Image upload ──────────────────────────────────────────────────────────
  if (body.imageDataUrl) {
    const match = (body.imageDataUrl as string).match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    const mimeType = match[1]
    const ext = mimeType.split('/')[1] ?? 'jpg'
    const buf = Buffer.from(match[2], 'base64')
    const path = `${c.slug}/cover.${ext}`
    const { error: upErr } = await c.admin.storage
      .from('venue-images')
      .upload(path, buf, { contentType: mimeType, upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    const { data: urlData } = c.admin.storage.from('venue-images').getPublicUrl(path)
    await c.admin.from('venues').update({ image_url: urlData.publicUrl }).eq('slug', c.slug)
    return NextResponse.json({ ok: true, imageUrl: urlData.publicUrl })
  }

  // ── Venue field update ────────────────────────────────────────────────────
  const updates: Record<string, unknown> = {}
  if (typeof body.name     === 'string' && body.name.trim().length >= 2) updates.name     = body.name.trim()
  if (typeof body.tagline  === 'string')                                  updates.tagline  = body.tagline.trim()
  if (typeof body.category === 'string')                                  updates.category = body.category
  if (typeof body.lat      === 'number')                                  updates.lat      = body.lat
  if (typeof body.lng      === 'number')                                  updates.lng      = body.lng
  if (typeof body.radiusMeters === 'number' && body.radiusMeters >= 10)   updates.radius_meters = body.radiusMeters

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await c.admin.from('venues').update(updates).eq('slug', c.slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, params: RouteParams) {
  const c = await ctx(params)
  if ('unauth' in c)    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if ('forbidden' in c) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { data: v } = await c.admin
    .from('venues')
    .select('owner_id')
    .eq('slug', c.slug)
    .maybeSingle()
  if (!v) return NextResponse.json({ error: 'venue not found' }, { status: 404 })
  if (c.role !== 'super_admin' && v.owner_id !== c.me) {
    return NextResponse.json({ error: 'Not your venue' }, { status: 403 })
  }

  const { error } = await c.admin.from('venues').delete().eq('slug', c.slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
