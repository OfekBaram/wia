// Transactional email via Resend's REST API (no SDK dependency).
// Best-effort: never throws — a failed alert must never break the request
// that triggered it. No-ops with a warning if RESEND_API_KEY isn't set.

const RESEND_API_KEY = process.env.RESEND_API_KEY
// Resend's shared sender works without domain verification (to the address the
// Resend account was created with). Set RESEND_FROM once a domain is verified.
const FROM = process.env.RESEND_FROM ?? 'WIA Alerts <onboarding@resend.dev>'

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', opts.to)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) {
      console.error('[email] send failed', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('[email] error', e)
    return false
  }
}
