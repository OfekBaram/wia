import { redirect } from 'next/navigation'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Single server-side entry point for the venue-admin / "for business" CTAs.
// Resolves the session + role in ONE request and redirects straight to the
// right destination — no client-side login → admin → venue redirect chain:
//   - guest (no session / not an admin) → /admin/login
//   - super_admin                       → /admin (all-venues dashboard)
//   - venue_owner with a venue          → /admin/venues/{slug}
//   - venue_owner with no venue yet     → /admin (create-venue prompt)
export default async function AdminEntry() {
  const ssr = await serverClient()
  const { data } = await ssr.auth.getUser()
  if (!data.user) redirect('/admin/login')

  const admin = adminClient()
  const { data: role } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (!role) redirect('/admin/login')
  if (role.role === 'super_admin') redirect('/admin')

  const { data: venue } = await admin
    .from('venues')
    .select('slug')
    .eq('owner_id', data.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  redirect(venue ? `/admin/venues/${venue.slug}` : '/admin')
}
