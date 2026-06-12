// Server-side web-push sender. Looks up all of a user's subscriptions and
// fires the payload at each; prunes endpoints that are gone (410/404).
// Failures are swallowed — a notification must never break the calling route.

import webpush from 'web-push'
import { adminClient } from '@/lib/supabase/server'

const PUB  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIV = process.env.VAPID_PRIVATE_KEY
const SUBJ = process.env.VAPID_SUBJECT ?? 'mailto:admin@wia.com'

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  if (!PUB || !PRIV) return false
  webpush.setVapidDetails(SUBJ, PUB, PRIV)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body:  string
  url:   string   // opened on notification click
  tag?:  string   // collapses notifications with the same tag
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return
    const admin = adminClient()
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)
    if (!subs?.length) return

    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          s.subscription as webpush.PushSubscription,
          JSON.stringify(payload),
          { TTL: 60 * 60 }, // venue presence is ephemeral — stale pushes are useless
        )
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }))
  } catch {
    // never let push errors propagate into API routes
  }
}
