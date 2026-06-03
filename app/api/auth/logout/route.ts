import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const ssr = await serverClient()
  await ssr.auth.signOut()
  return NextResponse.json({ ok: true })
}
