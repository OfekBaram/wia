'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PresenceProfile, RoomEvent } from '../types'

interface UsePresenceOptions {
  slug: string
  enabled?: boolean
  pollingIntervalMs?: number
}

interface PresenceState {
  profiles: PresenceProfile[]
  liveCount: number
  lastUpdated: Date | null
  isConnected: boolean
}

// In production this hook connects to Socket.io for real-time updates.
// In mock/demo mode it polls the REST API and simulates live joins.
export function usePresence({ slug, enabled = true, pollingIntervalMs = 10_000 }: UsePresenceOptions) {
  const [state, setState] = useState<PresenceState>({
    profiles: [],
    liveCount: 0,
    lastUpdated: null,
    isConnected: false,
  })

  const socketRef = useRef<{ disconnect: () => void } | null>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence/${slug}`)
      if (!res.ok) return
      const data = await res.json()
      setState(prev => ({
        ...prev,
        profiles:    data.presence,
        liveCount:   data.liveCount,
        lastUpdated: new Date(),
      }))
    } catch { /* network error — keep last state */ }
  }, [slug])

  const connectSocket = useCallback(() => {
    // TODO: Replace polling with Socket.io connection:
    //
    // import { io } from 'socket.io-client'
    // const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    //   query: { slug },
    //   auth: { token: getSessionToken() },
    // })
    //
    // socket.on('connect', () => setState(s => ({ ...s, isConnected: true })))
    // socket.on('disconnect', () => setState(s => ({ ...s, isConnected: false })))
    //
    // socket.on('room:snapshot', (snapshot: { presence: PresenceProfile[], liveCount: number }) => {
    //   setState(s => ({ ...s, profiles: snapshot.presence, liveCount: snapshot.liveCount }))
    // })
    //
    // socket.on('user:joined', (profile: PresenceProfile) => {
    //   setState(s => ({ ...s, profiles: [...s.profiles, profile], liveCount: s.liveCount + 1 }))
    // })
    //
    // socket.on('user:left', ({ presenceId }: { presenceId: string }) => {
    //   setState(s => ({
    //     ...s,
    //     profiles:  s.profiles.filter(p => p.id !== presenceId),
    //     liveCount: Math.max(0, s.liveCount - 1),
    //   }))
    // })
    //
    // socketRef.current = socket

    // Mock: poll REST API
    setState(s => ({ ...s, isConnected: true }))
    fetchPresence()
    pollRef.current = setInterval(fetchPresence, pollingIntervalMs)
  }, [fetchPresence, pollingIntervalMs])

  useEffect(() => {
    if (!enabled) return
    connectSocket()
    return () => {
      socketRef.current?.disconnect()
      if (pollRef.current) clearInterval(pollRef.current)
      setState(s => ({ ...s, isConnected: false }))
    }
  }, [enabled, connectSocket])

  const sendEvent = useCallback((event: Omit<RoomEvent, 'locationSlug' | 'timestamp'>) => {
    // TODO: socket.emit(event.type, event.payload)
    console.log('[WIA] room event:', event)
  }, [])

  return { ...state, sendEvent, refresh: fetchPresence }
}
