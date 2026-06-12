// Atomic join endpoint — does EVERYTHING server-side in one request:
//   1. Create/find auth user, set a fresh password
//   2. Sign in via SSR cookie client (Set-Cookie on response)
//   3. Upload selfie to Storage (using user's UID for the path)
//   4. Upsert master_profile
//   5. Upsert presence
//   6. Return { ok: true, slug }
//
// This sidesteps the flaky client-side `setSession` + polling chain that was
// hanging the React form handler before. The client just POSTs and navigates.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // seconds — selfie uploads can be slow on flaky mobile

const ADMIN_EMAILS = new Set(['ofekbaram5@gmail.com', 'admin@wia.com'])

interface Body {
  email:        string
  name:         string
  age:          number
  gender:       string
  statusText:   string
  selfieDataUrl: string   // data: URL — server uploads to storage
  venueSlug:    string
}

function randomHex(bytes: number): string {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: Request) {
  let stage = 'parse'
  try {
    const body = await req.json() as Body
    const email = String(body.email ?? '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    if (ADMIN_EMAILS.has(email)) {
      return NextResponse.json(
        { error: 'This email is reserved for admin. Use the admin login page.' },
        { status: 403 },
      )
    }
    if (!body.name || !body.age || !body.gender || !body.venueSlug) {
      return NextResponse.json({ error: 'Missing required profile fields' }, { status: 400 })
    }
    if (!body.selfieDataUrl?.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid selfie format' }, { status: 400 })
    }

    const admin = adminClient()

    // ── Look up venue ────────────────────────────────────────────────
    stage = 'venue_lookup'
    const { data: venue, error: venueErr } = await admin
      .from('venues')
      .select('id, slug')
      .eq('slug', body.venueSlug)
      .maybeSingle()
    if (venueErr || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // ── Find or create user ──────────────────────────────────────────
    stage = 'find_or_create_user'
    const password = `wia_${randomHex(16)}_${randomHex(16)}`
    let userId: string | null = null

    for (let page = 1; page <= 50 && !userId; page++) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (listErr) {
        return NextResponse.json({ error: `listUsers failed: ${listErr.message}` }, { status: 500 })
      }
      const found = list.users.find(u => u.email?.toLowerCase() === email)
      if (found) { userId = found.id; break }
      if (list.users.length < 200) break
    }

    if (userId) {
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (updErr) {
        return NextResponse.json({ error: `password update failed: ${updErr.message}` }, { status: 500 })
      }
    } else {
      const { data: createData, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      })
      if (createErr || !createData?.user) {
        return NextResponse.json(
          { error: createErr?.message ?? 'createUser failed' },
          { status: 500 },
        )
      }
      userId = createData.user.id
    }

    // ── Sign in via SSR cookie client (writes Set-Cookie to response) ──
    stage = 'signin'
    const ssr = await serverClient()
    const { error: signInErr } = await ssr.auth.signInWithPassword({ email, password })
    if (signInErr) {
      return NextResponse.json({ error: `signin failed: ${signInErr.message}` }, { status: 500 })
    }

    // ── Upload selfie via admin (bypass RLS — path enforces ownership) ─
    stage = 'selfie_upload'
    const dataUrlMatch = body.selfieDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/)
    if (!dataUrlMatch) {
      return NextResponse.json({ error: 'Could not decode selfie' }, { status: 400 })
    }
    const [, mime, b64] = dataUrlMatch
    const bytes = Buffer.from(b64, 'base64')
    const path = `${userId}/${body.venueSlug}-${Date.now()}.jpg`
    const { error: upErr } = await admin.storage
      .from('selfies')
      .upload(path, bytes, { contentType: mime, upsert: true })
    if (upErr) {
      return NextResponse.json({ error: `selfie upload failed: ${upErr.message}` }, { status: 500 })
    }
    const { data: pub } = admin.storage.from('selfies').getPublicUrl(path)
    const selfieUrl = pub.publicUrl

    // ── Upsert master_profile + presence ───────────────────────────────
    stage = 'master_profile'
    const { error: mpErr } = await admin.from('master_profiles').upsert({
      user_id: userId,
      name:    body.name,
      age:     body.age,
      gender:  body.gender,
    })
    if (mpErr) {
      return NextResponse.json({ error: `master_profile failed: ${mpErr.message}` }, { status: 500 })
    }

    stage = 'presence'
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    const { error: presErr } = await admin.from('presence').upsert({
      user_id:     userId,
      venue_id:    venue.id,
      name:        body.name,
      age:         body.age,
      gender:      body.gender,
      status_text: body.statusText?.trim() || '',
      selfie_url:  selfieUrl,
      expires_at:  expiresAt,
      left_at:     null,
      is_visible:  true,
    }, { onConflict: 'user_id,venue_id' })
    if (presErr) {
      return NextResponse.json({ error: `presence failed: ${presErr.message}` }, { status: 500 })
    }

    // Increment scan counter
    await admin.rpc('increment_scan_count', { venue_id_arg: venue.id })

    return NextResponse.json({ ok: true, slug: body.venueSlug, userId })
  } catch (e) {
    console.error(`/api/join failed at stage=${stage}`, e)
    return NextResponse.json(
      { error: e instanceof Error ? `[${stage}] ${e.message}` : 'Unknown error' },
      { status: 500 },
    )
  }
}
