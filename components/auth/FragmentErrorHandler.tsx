'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Supabase sometimes returns auth errors in the URL **fragment** (e.g.
 * `#error=access_denied&error_code=otp_expired`) instead of query params,
 * which the server never sees. This client-side component watches for that
 * pattern on every page load and redirects to /auth/error.
 *
 * Mounted once in the root layout.
 */
export function FragmentErrorHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash) return

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash

    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code') ?? params.get('error')
    if (!errorCode) return

    // Don't loop if we're already on the error page
    if (pathname.startsWith('/auth/error')) return

    router.replace(
      `/auth/error?reason=${encodeURIComponent(errorCode)}&next=${encodeURIComponent(pathname)}`,
    )
  }, [pathname, router])

  return null
}
