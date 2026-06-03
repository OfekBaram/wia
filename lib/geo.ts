// Shared geo helpers used by the geofence hook and the join-flow gate.

import type { Coordinates } from './types'

const EARTH_R = 6_371_000 // meters

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sin1 = Math.sin(dLat / 2)
  const sin2 = Math.sin(dLng / 2)
  const h = sin1 * sin1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sin2 * sin2
  return 2 * EARTH_R * Math.asin(Math.sqrt(h))
}

/** Extra buffer added to a venue's radius to tolerate normal GPS drift. */
export const GPS_GRACE_METERS = 50

/**
 * One-shot geolocation request. Returns position or throws with a user-friendly message.
 * Uses high-accuracy + a generous timeout to give iOS Safari time to respond.
 */
export function getCurrentCoords(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('Location permission denied — enable it to continue'))
        else if (err.code === 2) reject(new Error('We could not read your location. Try moving outside or check your GPS'))
        else if (err.code === 3) reject(new Error('Location lookup timed out. Try again'))
        else reject(new Error(err.message))
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
  })
}
