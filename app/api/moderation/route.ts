// Hide / report a person in a room.
//
// POST { venueSlug, targetUserId, action: 'hide' | 'report', reason? }
// - hide:   target disappears from the caller's room view (per venue)
// - report: stores a report row AND hides the target for the reporter

import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Where report alerts are sent. Override with REPORT_ALERT_EMAIL if needed.
const REPORT_ALERT_EMAIL = process.env.REPORT_ALERT_EMAIL ?? 'ofekbaram5@gmail.com'

export async function POST(req: Request) {
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const me = userData.user.id

  const { venueSlug, targetUserId, action, reason } = await req.json().catch(() => ({} as {
    venueSlug?: string; targetUserId?: string; action?: string; reason?: string
  }))
  if (!venueSlug || !targetUserId || !['hide', 'report'].includes(action ?? '')) {
    return NextResponse.json({ error: 'venueSlug, targetUserId and action (hide|report) required' }, { status: 400 })
  }
  if (targetUserId === me) {
    return NextResponse.json({ error: "You can't moderate yourself" }, { status: 400 })
  }

  const admin = adminClient()
  const { data: venue } = await admin.from('venues').select('id, name').eq('slug', venueSlug).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'venue not found' }, { status: 404 })

  if (action === 'report') {
    const cleanReason = (reason ?? '').slice(0, 500) || null
    const { error } = await admin.from('user_reports').insert({
      reporter_id: me,
      reported_id: targetUserId,
      venue_id:    venue.id,
      reason:      cleanReason,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email a heads-up to the operator (best-effort — never blocks the report).
    try {
      const [reportedRes, reportedPres] = await Promise.all([
        admin.auth.admin.getUserById(targetUserId),
        admin.from('presence').select('name, age, gender').eq('user_id', targetUserId).eq('venue_id', venue.id).maybeSingle(),
      ])
      const reportedEmail = reportedRes.data?.user?.email ?? '(unknown)'
      const reportedName  = reportedPres.data?.name ?? '(unknown)'
      const reporterEmail = userData.user.email ?? '(unknown)'
      const esc = (s: string) => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))
      await sendEmail({
        to: REPORT_ALERT_EMAIL,
        subject: `🚩 WIA report at ${venue.name}`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#120D0E;line-height:1.5">
            <h2 style="margin:0 0 12px">🚩 New report — ${esc(venue.name)}</h2>
            <table style="border-collapse:collapse;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;color:#968E89">Reported</td><td><strong>${esc(reportedName)}</strong> &lt;${esc(reportedEmail)}&gt;</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#968E89">Reported by</td><td>${esc(reporterEmail)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#968E89">Venue</td><td>${esc(venue.name)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#968E89;vertical-align:top">Reason</td><td>${cleanReason ? esc(cleanReason) : '<em>none given</em>'}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#968E89">Time</td><td>${new Date().toUTCString()}</td></tr>
            </table>
          </div>`,
      })
    } catch (e) {
      console.error('[moderation] report alert email failed', e)
    }
  }

  // Both actions hide the target for the caller
  const { error: hideErr } = await admin.from('user_hides').upsert(
    { user_id: me, hidden_user_id: targetUserId, venue_id: venue.id },
    { onConflict: 'user_id,hidden_user_id,venue_id', ignoreDuplicates: true },
  )
  if (hideErr) return NextResponse.json({ error: hideErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
