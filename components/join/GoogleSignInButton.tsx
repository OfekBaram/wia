'use client'

// Google One Tap / "Sign in with Google" via the Google Identity Services (GIS)
// library. This is a POPUP flow (not a redirect), so the join page keeps its
// in-memory state (the captured selfie) — that's why it can live on the final
// step. We deliberately do NOT touch the Supabase browser SDK here: GIS hands
// us a Google ID token, we pass it up, and the server exchanges it for a
// session inside /api/join (same server-side sign-in path the email flow
// already uses). That keeps all auth server-side, per the project's rule.
//
// Nonce: GIS gets the SHA-256 hash, the raw value is passed up to the server,
// and Supabase verifies they match — prevents token replay.

import { useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n/I18nProvider'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

/** True only when a Google client id is configured — gates the whole feature. */
export const GOOGLE_ENABLED = !!CLIENT_ID

function randomHex(bytes: number): string {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface Props {
  /** Fired with the Google ID token + raw nonce for server-side exchange. */
  onCredential: (token: string, nonce: string) => void
  /** Fired if GIS fails to load. */
  onError: (message: string) => void
}

export function GoogleSignInButton({ onCredential, onError }: Props) {
  const { locale } = useI18n()
  const divRef       = useRef<HTMLDivElement>(null)
  const rawNonceRef  = useRef<string>('')

  useEffect(() => {
    if (!CLIENT_ID) { onError('missing_client_id'); return }
    let cancelled = false

    async function setup() {
      if (cancelled || !window.google?.accounts?.id || !divRef.current) return

      const rawNonce    = randomHex(16)
      const hashedNonce = await sha256Hex(rawNonce)
      if (cancelled || !divRef.current) return
      rawNonceRef.current = rawNonce

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        nonce:     hashedNonce,
        callback: (response: { credential: string }) => {
          onCredential(response.credential, rawNonceRef.current)
        },
      })

      divRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(divRef.current, {
        type:           'standard',
        theme:          'outline',
        size:           'large',
        text:           'continue_with',
        shape:          'pill',
        logo_alignment: 'left',
        width:          300,
        locale:         locale === 'he' ? 'iw' : 'en',
      })
    }

    if (window.google?.accounts?.id) {
      setup()
    } else {
      const existing = document.getElementById('gsi-script') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', setup)
      } else {
        const s = document.createElement('script')
        s.id    = 'gsi-script'
        s.src   = 'https://accounts.google.com/gsi/client'
        s.async = true
        s.defer = true
        s.onload  = setup
        s.onerror = () => onError('gsi_load_failed')
        document.head.appendChild(s)
      }
    }

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  return (
    <div className="flex justify-center">
      <div ref={divRef} />
    </div>
  )
}
