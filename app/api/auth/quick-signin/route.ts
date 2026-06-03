// "Quick sign-in" — creates a WIA master account (or fetches existing) and
// returns a session for that email. NO email verification, NO password.
// This is the entry path for end users joining a venue room — they prove
// presence by scanning a QR, so requiring email verification on top is
// redundant friction.
//
// Security model:
//   - Admin email is BLOCKED here (must use password sign-in instead).
//   - Anyone with email X can sign in as X. This is intentional for the room
//     access pattern — the email is just an identifier for their temporary
//     presence, not a high-trust credential. Verification can be added later
//     if abuse becomes an issue.
//   - The server obtains a session by generating an admin magic-link token
//     and immediately verifying it on the server. No email is sent.

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

// Emails that are NOT allowed to sign in via this endpoint — they must use
// the admin password flow instead. Mirrors the admin allowlist.
const ADMIN_EMAILS = new Set([
  'ofekbaram5@gmail.com',
  'admin@wia.com',
])

export async function POST(req: Request) {
  try {
    return await handle(req)
  } catch (e) {
    console.error('quick-signin uncaught:', e)
    return NextResponse.json(
      { error: e instanceof Error ? `${e.name}: ${e.message}` : 'Unknown error' },
      { status: 500 },
    )
  }
}

async function handle(req: Request) {
  let email: string
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  if (ADMIN_EMAILS.has(email)) {
    return NextResponse.json(
      { error: 'This email is reserved for admin sign-in. Use the admin login page.' },
      { status: 403 },
    )
  }

  const admin = adminClient()

  // Strategy:
  //   1. Find existing user by email (if any). If none → create with random pwd.
  //   2. Set a fresh random password on the user (one-time, immediately consumed).
  //   3. Sign in with password to mint a session. Return it.

  // Step 1 — find or create the user.
  // Look up first (more reliable than relying on createUser's "duplicate" error path).
  // Use Web Crypto API (available on Node 19+ and Edge runtime)
  const randomHex = (bytes: number): string =>
    Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
  const password = `wia_${randomHex(16)}_${randomHex(16)}`
  let userId: string | null = null

  // Find existing user by paging through listUsers
  for (let page = 1; page <= 50 && !userId; page++) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (listErr) {
      return NextResponse.json({ error: `listUsers failed: ${listErr.message}` }, { status: 500 })
    }
    const found = list.users.find(u => u.email?.toLowerCase() === email)
    if (found) { userId = found.id; break }
    if (list.users.length < 200) break // last page
  }

  if (userId) {
    // Existing user — set fresh password
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (updErr) {
      return NextResponse.json({ error: `update failed: ${updErr.message}` }, { status: 500 })
    }
  } else {
    // New user — create
    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr || !createData?.user) {
      return NextResponse.json(
        { error: createErr?.message ?? 'createUser returned no user' },
        { status: 500 },
      )
    }
    userId = createData.user.id
  }

  // Step 2 — sign in with password using the SSR cookie-aware client.
  // This writes the auth cookies to the response, so the browser receives
  // the session via Set-Cookie headers — no client-side setSession needed.
  const ssr = await serverClient()
  const { data: sessionData, error: signInErr } = await ssr.auth.signInWithPassword({
    email,
    password,
  })

  if (signInErr || !sessionData.session) {
    return NextResponse.json(
      { error: signInErr?.message ?? 'Could not sign you in' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    // Still return tokens for backwards compat — but the cookie set by
    // serverClient is now the source of truth for the browser.
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    user: {
      id:    sessionData.user!.id,
      email: sessionData.user!.email,
    },
  })
}
