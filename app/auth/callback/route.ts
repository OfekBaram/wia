// Magic-link redirect target. The user clicks the link in their email →
// browser opens this URL → we exchange the `code` for a session and bounce
// them to `?next=...`.
//
// Two failure paths to handle:
// 1. Supabase verify failure — returns the user here with `?error=...&error_code=...`
// 2. Code exchange failure (DB error, etc.) — `exchangeCodeForSession` throws
// In both cases, send them to /auth/error with the reason so they get a
// human-readable explanation + a way to start over.

import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const next  = url.searchParams.get('next') ?? '/'

  // Surface explicit Supabase errors (e.g. otp_expired) coming back as query
  // params from the /auth/v1/verify endpoint when it fails server-side.
  const errCode = url.searchParams.get('error_code') ?? url.searchParams.get('error')
  if (errCode) {
    return NextResponse.redirect(
      new URL(`/auth/error?reason=${encodeURIComponent(errCode)}&next=${encodeURIComponent(next)}`, url.origin),
    )
  }

  if (code) {
    const sb = await serverClient()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/error?reason=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`, url.origin),
      )
    }
  }

  // `next` must be a same-origin path to prevent open-redirect
  const safeNext = next.startsWith('/') ? next : '/'
  return NextResponse.redirect(new URL(safeNext, url.origin))
}
