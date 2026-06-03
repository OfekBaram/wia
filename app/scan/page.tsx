'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, X, Loader, CheckCircle, AlertCircle, ScanLine } from 'lucide-react'
import { getVenueBySlug } from '@/lib/api/venues'

type ScanState =
  | { status: 'idle' }
  | { status: 'requesting-camera' }
  | { status: 'scanning' }
  | { status: 'detected'; slug: string; venueName: string }
  | { status: 'invalid' }
  | { status: 'denied'; error: string }

// In production the QR encodes a signed JWT containing { slug, scanId, ts }.
// The server verifies the JWT, ensures the scan is fresh (< 5 min), and issues
// a short-lived presence-grant token that's required by POST /api/presence/:slug.
interface ScanPayload {
  slug:   string
  scanId: string
  ts:     number
}

function parseScanPayload(raw: string): ScanPayload | null {
  try {
    // Try to extract slug from a wia.com URL
    const url = new URL(raw)
    const m = url.pathname.match(/^\/([a-z0-9-]+)/i)
    if (!m) return null
    const slug = m[1]
    const scanId = url.searchParams.get('scan') ?? `demo_${Date.now()}`
    return { slug, scanId, ts: Date.now() }
  } catch {
    // Maybe it's a raw slug encoded directly
    if (/^[a-z0-9-]+$/i.test(raw.trim())) {
      return { slug: raw.trim(), scanId: `demo_${Date.now()}`, ts: Date.now() }
    }
    return null
  }
}

export default function ScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<unknown>(null)
  const scanFrameRef = useRef<number | null>(null)

  const stopScan = useCallback(() => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const handleDetected = useCallback(async (raw: string) => {
    const payload = parseScanPayload(raw)
    if (!payload) {
      setState({ status: 'invalid' })
      return
    }

    const venue = await getVenueBySlug(payload.slug).catch(() => null)
    if (!venue) {
      setState({ status: 'invalid' })
      return
    }

    // Persist the scan grant — required to proceed to the join flow
    try {
      sessionStorage.setItem(
        `wia:scan:${payload.slug}`,
        JSON.stringify({ ...payload, expiresAt: Date.now() + 5 * 60_000 }),
      )
    } catch { /* ignore */ }

    setState({ status: 'detected', slug: payload.slug, venueName: venue.name })
    stopScan()

    setTimeout(() => router.push(`/${payload.slug}/join?scan=${payload.scanId}`), 1500)
  }, [router, stopScan])

  const tick = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return
    if (videoRef.current.readyState < 2) {
      scanFrameRef.current = requestAnimationFrame(tick)
      return
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const codes = await (detectorRef.current as any).detect(videoRef.current)
      if (codes.length > 0) {
        handleDetected(codes[0].rawValue)
        return
      }
    } catch { /* swallow per-frame errors */ }
    scanFrameRef.current = requestAnimationFrame(tick)
  }, [handleDetected])

  const startScan = useCallback(async () => {
    setState({ status: 'requesting-camera' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = (window as any).BarcodeDetector
    if (!Detector) {
      setState({
        status: 'denied',
        error: 'QR scanning is not supported on this browser. Use Chrome on Android or a modern desktop browser.',
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      detectorRef.current = new Detector({ formats: ['qr_code'] })
      setState({ status: 'scanning' })
      scanFrameRef.current = requestAnimationFrame(tick)
    } catch (e) {
      setState({
        status: 'denied',
        error: e instanceof Error ? e.message : 'Camera access denied',
      })
    }
  }, [tick])

  useEffect(() => () => stopScan(), [stopScan])

  /* Demo simulator removed — real venues come from the admin DB now. */

  return (
    <div className="min-h-screen bg-wia-bg flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-48 -left-48 animate-glow" />
        <div className="orb orb-pink   w-[400px] h-[400px] bottom-0 -right-32 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-wia-ink/50 hover:text-wia-ink transition-colors">
            <X size={20} />
          </Link>
          <span className="font-display text-lg font-bold gradient-text">Scan to enter</span>
          <div className="w-5" />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-8 pb-12">
          <div className="w-full max-w-md text-center space-y-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink mb-3">
                Point at the venue QR
              </h1>
              <p className="text-wia-ink/50 text-sm">
                Every WIA-enabled venue has QR codes on its tables, walls, and entrance.
                Scanning one is the only way to enter that room.
              </p>
            </div>

            {/* Scanner viewfinder */}
            <div className="relative mx-auto w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden bg-black/40">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-wia-purple rounded-tl-lg z-20" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-wia-purple rounded-tr-lg z-20" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-wia-purple rounded-bl-lg z-20" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-wia-purple rounded-br-lg z-20" />

              {/* Idle state */}
              {state.status === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-wia-ink/60">
                  <QrCode size={56} />
                  <button
                    onClick={startScan}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                  >
                    Open camera
                  </button>
                </div>
              )}

              {state.status === 'requesting-camera' && (
                <div className="absolute inset-0 flex items-center justify-center text-wia-ink/60">
                  <Loader size={32} className="animate-spin" />
                </div>
              )}

              {(state.status === 'scanning' || state.status === 'detected' || state.status === 'invalid') && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Scan line animation */}
              {state.status === 'scanning' && (
                <div className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-r from-transparent via-wia-purple to-transparent animate-pulse z-10">
                  <ScanLine className="absolute -top-3 left-1/2 -translate-x-1/2 text-wia-purple/0" />
                </div>
              )}

              {state.status === 'detected' && (
                <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto flex items-center justify-center glow-green">
                      <CheckCircle size={32} className="text-wia-ink" />
                    </div>
                    <div>
                      <div className="text-wia-ink font-semibold">{state.venueName}</div>
                      <div className="text-wia-ink/70 text-xs">Verified · entering…</div>
                    </div>
                  </div>
                </div>
              )}

              {state.status === 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-300 px-6 text-center">
                  <AlertCircle size={40} />
                  <p className="text-sm">{state.error}</p>
                </div>
              )}
            </div>

            {/* Status text */}
            {state.status === 'scanning' && (
              <p className="text-sm text-wia-purple flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wia-purple opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-wia-purple" />
                </span>
                Looking for a WIA QR code...
              </p>
            )}

            {state.status === 'invalid' && (
              <p className="text-sm text-red-300">
                That QR doesn&apos;t belong to a WIA venue.{' '}
                <button onClick={() => setState({ status: 'scanning' })} className="underline">Try again</button>
              </p>
            )}

            {state.status === 'denied' && (
              <button
                onClick={startScan}
                className="px-5 py-2.5 rounded-xl bg-wia-purple/20 border border-wia-purple/40 text-wia-purple text-sm hover:bg-wia-purple/30 transition-all"
              >
                Try again
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
