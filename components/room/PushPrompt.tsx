'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

// Registers the service worker and subscribes the member to web push.
// - If permission is already granted: subscribes silently on mount.
// - If permission is 'default': shows a small dismissible banner (browsers
//   require a user gesture for the permission prompt, especially iOS PWA).
// - If denied or unsupported: renders nothing.

const DISMISS_KEY = 'wia:pushDismissed'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function subscribe(): Promise<boolean> {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) return false
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    })
  }
  const res = await fetch('/api/push/subscribe', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ subscription: sub.toJSON() }),
  })
  return res.ok
}

export function PushPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      subscribe().catch(() => { /* ignore */ })
      return
    }
    if (Notification.permission === 'default') {
      try { if (sessionStorage.getItem(DISMISS_KEY) === '1') return } catch { /* ignore */ }
      setShow(true)
    }
  }, [])

  async function enable() {
    setShow(false)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') await subscribe()
    } catch { /* ignore */ }
  }

  function dismiss() {
    setShow(false)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  if (!show) return null

  return (
    <div className="glass-strong rounded-2xl px-4 py-3 border border-wia-purple/25 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-wia-purple/15 flex items-center justify-center shrink-0">
        <Bell size={16} className="text-wia-purple" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-wia-ink">Don&apos;t miss a match</div>
        <div className="text-[11px] text-wia-ink/55">Get notified when someone matches or messages you.</div>
      </div>
      <button
        onClick={enable}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-xs font-semibold hover:opacity-90 transition-all"
      >
        Enable
      </button>
      <button onClick={dismiss} className="shrink-0 p-1 text-wia-ink/40 hover:text-wia-ink/70 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
