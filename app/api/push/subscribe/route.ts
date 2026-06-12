// Store (or remove) the caller's web-push subscription.
// POST   { subscription }  → upsert by endpoint
// DELETE { endpoint }      → remove

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { subscription } = await req.json().catch(() => ({} as { subscription?: { endpoint?: string } }))
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'subscription with endpoint required' }, { status: 400 })
  }

  const admin = adminClient()
  const { error } = await admin.from('push_subscriptions').upsert(
    { user_id: userData.user.id, endpoint: subscription.endpoint, subscription },
    { onConflict: 'endpoint' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { endpoint } = await req.json().catch(() => ({} as { endpoint?: string }))
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  await adminClient().from('push_subscriptions').delete()
    .eq('endpoint', endpoint)
    .eq('user_id', userData.user.id)
  return NextResponse.json({ ok: true })
}
