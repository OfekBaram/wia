// Self-service signup for venue owners.
// Creates an auth user with email+password (auto-confirmed), tags them as a
// 'venue_owner' in admin_users, then signs them in via the SSR cookie client
// so they land authenticated on /admin.
//
// Once signed in, their first action on /admin will be to create their venue.
// The "one venue per owner" rule is enforced when they create — they own at
// most one venue.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const RESERVED_EMAILS = new Set([
  'admin@wia.com',
  'ofekbaram5@gmail.com', // super admin — already exists
])

interface Body {
  email:    string
  password: string
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email    = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (RESERVED_EMAILS.has(email)) {
    return NextResponse.json({ error: 'This email is reserved' }, { status: 409 })
  }

  const admin = adminClient()

  // 1. Look for existing user
  let userId: string | null = null
  for (let page = 1; page <= 50 && !userId; page++) {
    const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return NextResponse.json({ error: `listUsers failed: ${error.message}` }, { status: 500 })
    const found = list.users.find(u => u.email?.toLowerCase() === email)
    if (found) { userId = found.id; break }
    if (list.users.length < 200) break
  }

  if (userId) {
    // Existing user — make sure they're not already a venue owner
    const { data: existingRole } = await admin
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    if (existingRole) {
      return NextResponse.json({
        error: 'This email is already registered as a venue owner. Try signing in instead.',
      }, { status: 409 })
    }
    // Update their password so they can sign in with what they typed
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  } else {
    // Create new user with email_confirm=true (skip verification email)
    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr || !createData?.user) {
      return NextResponse.json(
        { error: createErr?.message ?? 'Could not create your account' },
        { status: 500 },
      )
    }
    userId = createData.user.id
  }

  // 2. Tag them as venue_owner in admin_users
  const { error: tagErr } = await admin.from('admin_users').upsert({
    user_id: userId,
    role:    'venue_owner',
  })
  if (tagErr) return NextResponse.json({ error: `role grant failed: ${tagErr.message}` }, { status: 500 })

  // 3. Sign them in via SSR cookie client (sets Set-Cookie on response)
  const ssr = await serverClient()
  const { error: signInErr } = await ssr.auth.signInWithPassword({ email, password })
  if (signInErr) {
    return NextResponse.json({ error: `signin failed: ${signInErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId })
}
