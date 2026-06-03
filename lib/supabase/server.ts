// Server-side Supabase clients.
// - `serverClient()` uses the user's session cookies — RLS applies as that user.
// - `adminClient()` uses the service-role key — bypasses RLS, server-only.

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function serverClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // `setAll` was called from a Server Component — that's expected,
            // can safely ignore. Middleware handles the actual cookie set.
          }
        },
      },
    },
  )
}

/** Server-only client that bypasses RLS. NEVER import from client components. */
export function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
