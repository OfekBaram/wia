'use client'

import { useState, useCallback } from 'react'
import type { GeolocationState, Coordinates, Location } from '../types'

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371e3
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const x  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function useGeolocation(targetLocation?: Location) {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const check = useCallback(async () => {
    setState({ status: 'checking' })

    if (!navigator.geolocation) {
      setState({ status: 'denied', error: 'Geolocation not supported' })
      return
    }

    return new Promise<GeolocationState>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          let status: GeolocationState['status'] = 'granted'
          let distanceMeters: number | undefined

          if (targetLocation) {
            distanceMeters = haversineDistance(coords, targetLocation.coordinates)
            status = distanceMeters <= targetLocation.radiusMeters ? 'verified' : 'too_far'
          }

          const result: GeolocationState = { status, coords, distanceMeters }
          setState(result)
          resolve(result)
        },
        (err) => {
          const result: GeolocationState = { status: 'denied', error: err.message }
          setState(result)
          resolve(result)
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      )
    })
  }, [targetLocation])

  return { state, check }
}
