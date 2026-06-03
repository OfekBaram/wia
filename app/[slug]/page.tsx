'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, ArrowRight } from 'lucide-react'
import type { Location, PresenceProfile, Gender } from '@/lib/types'
import { RoomHeader } from '@/components/room/RoomHeader'
import { RoomGate } from '@/components/room/RoomGate'
import { MatchOverlay } from '@/components/room/MatchOverlay'
import { useGeofence } from '@/lib/hooks/useGeofence'

interface Props {
  params: Promise<{ slug: string }>
}

interface RoomData {
  venue:         Location
  liveCount:     number
  userId:        string | null
  isMember:      boolean
  myPresenceId:  string | null
  presence:      PresenceProfile[]
  likesSent:     Set<string>
  likesReceived: Set<string>
}

// Map server JSON (snake_case timestamps) → client `PresenceProfile`
function shapePresence(rows: unknown[]): PresenceProfile[] {
  return (rows as Array<{
    id: string; user_id: string; name: string; age: number; gender: string;
    status_text: string; selfie_url: string; joined_at: string;
    is_visible: boolean; is_ghost_mode: boolean
  }>).map(r => ({
    id:           r.id,
    userId:       r.user_id,
    locationSlug: '',
    name:         r.name,
    age:          r.age,
    gender:       r.gender as Gender,
    selfieUrl:    r.selfie_url,
    statusText:   r.status_text,
    isGhostMode:  r.is_ghost_mode,
    isVisible:    r.is_visible,
    arrivedAt:    new Date(r.joined_at),
    lastSeenAt:   new Date(r.joined_at),
    isNew:        Date.now() - new Date(r.joined_at).getTime() < 10 * 60_000,
    waveCount:    0,
  }))
}

export default function RoomPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data,       setData]       = useState<RoomData | null>(null)
  const [ready,      setReady]      = useState(false)
  const [forwarding, setForwarding] = useState(false)
  const [notFound,   setNotFound]   = useState(false)
  const [geofenced,  setGeofenced]  = useState(false)
  const [matchQueue, setMatchQueue] = useState<PresenceProfile[]>([])
  const prevMatchIds = useRef<Set<string>>(new Set())
  const isFirstPoll  = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(slug)}`, {
        credentials: 'include',
        cache:       'no-store',
      })
      if (res.status === 404) { setNotFound(true); setReady(true); return }
      if (!res.ok) { setReady(true); return }
      const json = await res.json()
      const newPresence    = shapePresence(json.presence ?? [])
      const newLikesSent   = new Set<string>(json.likesSent     ?? [])
      const newLikesRecvd  = new Set<string>(json.likesReceived ?? [])

      setData({
        venue:         { ...json.venue, coverImageUrl: json.venue.imageUrl ?? undefined },
        liveCount:     json.liveCount,
        userId:        json.userId,
        isMember:      json.isMember,
        myPresenceId:  json.myPresenceId,
        presence:      newPresence,
        likesSent:     newLikesSent,
        likesReceived: newLikesRecvd,
      })

      // Detect new mutual matches since the last poll
      if (!isFirstPoll.current && json.isMember) {
        const newMatches = newPresence.filter(
          p => newLikesSent.has(p.userId) && newLikesRecvd.has(p.userId) && !prevMatchIds.current.has(p.userId)
        )
        if (newMatches.length > 0) {
          setMatchQueue(q => [...q, ...newMatches])
        }
      }
      // Update the known match set for next poll
      prevMatchIds.current = new Set(
        newPresence.filter(p => newLikesSent.has(p.userId) && newLikesRecvd.has(p.userId)).map(p => p.userId)
      )
      isFirstPoll.current = false

      setReady(true)
    } catch (e) {
      console.error('room load failed', e)
      setReady(true)
    }
  }, [slug])

  // Initial load
  useEffect(() => {
    refresh()
    if (typeof window !== 'undefined') {
      const v = data?.venue
      if (v) document.title = `${v.name} — WIA Live`
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // QR-scan: forward to join when ?scan= is present and we're NOT already a member
  useEffect(() => {
    if (!data || forwarding) return
    const scanId = searchParams.get('scan')
    if (!scanId) return
    if (data.isMember) return
    try {
      sessionStorage.setItem(
        `wia:scan:${slug}`,
        JSON.stringify({ slug, scanId, ts: Date.now(), expiresAt: Date.now() + 5 * 60_000 }),
      )
    } catch { /* ignore */ }
    setForwarding(true)
    router.replace(`/${slug}/join?scan=${scanId}`)
  }, [data, searchParams, slug, router, forwarding])

  // Poll for live updates (cheap, simple, no realtime client required).
  // 3s gives responsive like/match notifications without hammering the API.
  useEffect(() => {
    if (!ready || notFound) return
    const id = setInterval(refresh, 3_000)
    return () => clearInterval(id)
  }, [ready, notFound, refresh])

  // Geofence — auto-leave when user moves outside venue radius
  useGeofence({
    enabled:      !!data?.isMember && !!data?.venue,
    venue:        data?.venue.coordinates ?? { lat: 0, lng: 0 },
    radiusMeters: data?.venue.radiusMeters ?? 50,
    onExit:       async () => {
      if (!data?.venue) return
      await fetch('/api/leave', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId: data.venue.id }),
      }).catch(() => {})
      setGeofenced(true)
      refresh()
    },
  })

  // ─── Render states ────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  if (forwarding && data) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink mx-auto flex items-center justify-center shadow-xl shadow-purple-500/30">
            <ArrowRight size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="text-wia-ink/50 text-sm uppercase tracking-[0.2em] mb-1">Entering</div>
            <div className="font-display text-2xl font-bold gradient-text">{data.venue.name}</div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-wia-purple/10 border border-wia-purple/30 flex items-center justify-center mx-auto">
            <MapPin size={28} className="text-wia-purple" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">Venue not found</h1>
          <p className="text-wia-ink/70">
            <code className="font-mono text-wia-ink">/{slug}</code> isn&apos;t a WIA venue yet.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all"
          >
            Back to WIA
          </Link>
        </div>
      </div>
    )
  }

  const { venue, liveCount, isMember, presence, userId, likesSent, likesReceived } = data
  const venueWithCount = { ...venue, liveCount }
  const mySelfieUrl    = presence.find(p => p.userId === userId)?.selfieUrl ?? ''
  const currentMatch   = matchQueue[0] ?? null

  return (
    <div className="min-h-screen bg-wia-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-32 -left-32 animate-glow opacity-50" />
        <div className="orb orb-pink w-[400px] h-[400px] bottom-0 right-0 animate-glow opacity-40" style={{ animationDelay: '1.5s' }} />
      </div>

      <RoomHeader
        location={venueWithCount}
        isMember={isMember}
        onLeave={() => refresh()}
      />

      {geofenced && (
        <div className="relative z-20 mx-auto max-w-6xl px-4 sm:px-6 pt-4">
          <div className="glass-strong rounded-2xl px-4 py-3 border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200">
            You stepped outside <strong>{venue.name}</strong> — disconnected from the room. Scan the QR again to rejoin.
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <RoomGate
          location={venueWithCount}
          presence={presence}
          isMember={isMember}
          currentUserId={userId ?? undefined}
          likesSent={likesSent}
          likesReceived={likesReceived}
          onLikesChanged={refresh}
        />
      </main>

      {currentMatch && mySelfieUrl && (
        <MatchOverlay
          match={currentMatch}
          myselfieUrl={mySelfieUrl}
          onDismiss={() => setMatchQueue(q => q.slice(1))}
          onChat={() => {
            setMatchQueue(q => q.slice(1))
            // Scroll to PersonCard — open chat via a custom event the PresenceGrid listens to
            window.dispatchEvent(new CustomEvent('wia:open-chat', { detail: { userId: currentMatch.userId } }))
          }}
        />
      )}
    </div>
  )
}
