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

/** Why a geolocation request failed — lets the UI guide the user precisely. */
export type GeoErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported'

export class GeoError extends Error {
  kind: GeoErrorKind
  constructor(kind: GeoErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

/**
 * One-shot geolocation request. Returns position or throws a GeoError.
 * Uses high-accuracy + a generous timeout to give iOS Safari time to respond.
 */
export function getCurrentCoords(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeoError('unsupported', 'Geolocation is not supported on this device'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new GeoError('denied', 'Location permission denied — enable it to continue'))
        else if (err.code === 2) reject(new GeoError('unavailable', 'We could not read your location. Try moving outside or check your GPS'))
        else if (err.code === 3) reject(new GeoError('timeout', 'Location lookup timed out. Try again'))
        else reject(new GeoError('unavailable', err.message))
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
  })
}

export type GeoPlatform = 'ios-safari' | 'ios-chrome' | 'android' | 'desktop'

/** Best-effort device/browser detection for showing the right "enable location" steps. */
export function detectGeoPlatform(): GeoPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  // iPadOS 13+ reports as Mac, so also check touch points
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (isIOS) return /CriOS/.test(ua) ? 'ios-chrome' : 'ios-safari'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}
