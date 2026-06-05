'use client'

import { useEffect, useState } from 'react'
import type { Coordinates } from '@/lib/types'
import { haversineMeters } from '@/lib/geo'

interface UseGeofenceOpts {
  enabled:        boolean
  venue:          Coordinates
  radiusMeters:   number
  /** Extra grace beyond the venue radius to absorb GPS drift. Default 50m. */
  gracMeters?:    number
  /** Called when user leaves the geofence (consecutive out-of-bound readings). */
  onExit?:        () => void
  /** How many consecutive out-of-bound readings before triggering exit. Default 3. */
  exitThreshold?: number
}

export type GeofenceStatus =
  | 'idle'      // not started yet
  | 'denied'    // user denied location permission
  | 'inside'    // within geofence
  | 'outside'   // outside geofence, exit will fire after threshold

/**
 * Watches the user's geolocation while they're in a venue room.
 * When they walk out of the geofence (radius + grace) for a few consecutive
 * readings, `onExit` fires — caller is expected to delete the presence row.
 *
 * iOS Safari will pause watchPosition when the tab is backgrounded. That's
 * acceptable — when they come back to the tab we get fresh readings.
 */
export function useGeofence({
  enabled,
  venue,
  radiusMeters,
  gracMeters     = 50,
  onExit,
  exitThreshold = 3,
}: UseGeofenceOpts) {
  const [status,    setStatus]    = useState<GeofenceStatus>('idle')
  const [distance,  setDistance]  = useState<number | null>(null)

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return

    let outsideCount = 0
    let firedExit    = false
    let cancelled    = false
    const limit = radiusMeters + gracMeters

    // Use getCurrentPosition polling instead of watchPosition.
    // iOS Safari treats watchPosition as a separate (more invasive) permission
    // and will re-prompt even after the user already approved getCurrentPosition
    // in the join flow. Polling every 30s reuses the already-granted permission.
    function check() {
      if (cancelled) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return
          const d = haversineMeters(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            venue,
          )
          setDistance(d)
          if (d <= limit) {
            outsideCount = 0
            setStatus('inside')
          } else {
            outsideCount += 1
            setStatus('outside')
            if (outsideCount >= exitThreshold && !firedExit) {
              firedExit = true
              onExit?.()
            }
          }
        },
        (err) => {
          if (err.code === 1) setStatus('denied')
        },
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 30_000 },
      )
    }

    check()
    const id = setInterval(check, 30_000)
    return () => { cancelled = true; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, venue.lat, venue.lng, radiusMeters, gracMeters, exitThreshold])

  return { status, distanceMeters: distance }
}
