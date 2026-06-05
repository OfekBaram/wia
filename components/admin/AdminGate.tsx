'use client'

// AdminGate no longer uses useAuth() — the browser Supabase SDK hangs after
// sign-in, causing the spinner to never resolve on refresh.
// Auth is enforced server-side: every /api/admin/* route returns 401 if the
// cookie is missing, and the individual pages redirect to /admin/login on 401.
// This component just renders children immediately.

interface AdminGateProps {
  children: React.ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  return <>{children}</>
}
