'use client'

// Browser-side Supabase client. Uses the anon key (safe to ship to clients).
// We avoid using it for cookie-bound reads on hot paths — server API routes
// handle those — but the singleton is still needed for realtime subscriptions
// and selfie uploads from the join page.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

let _client: ReturnType<typeof createClient> | null = null
export function supabase() {
  if (!_client) _client = createClient()
  return _client
}
