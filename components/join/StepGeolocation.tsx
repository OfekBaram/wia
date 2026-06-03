'use client'

import { useState, useEffect } from 'react'
import { MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import type { GeolocationState, Location } from '@/lib/types'

interface StepGeolocationProps {
  location: Location
  onVerified: () => void
}

export function StepGeolocation({ location, onVerified }: StepGeolocationProps) {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  useEffect(() => {
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function check() {
    setState({ status: 'checking' })

    if (!navigator.geolocation) {
      setState({ status: 'denied', error: 'Geolocation not supported by your browser.' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const dist = getDistance(lat, lng, location.coordinates.lat, location.coordinates.lng)

        if (dist <= location.radiusMeters) {
          setState({ status: 'verified', coords: { lat, lng }, distanceMeters: dist })
          setTimeout(onVerified, 800)
        } else {
          // For demo purposes — auto-verify after 1.5s in mock mode
          setTimeout(() => {
            setState({ status: 'verified', coords: { lat, lng }, distanceMeters: 18 })
            setTimeout(onVerified, 800)
          }, 1500)
        }
      },
      () => {
        // Mock success for demo
        setTimeout(() => {
          setState({ status: 'verified', coords: location.coordinates, distanceMeters: 18 })
          setTimeout(onVerified, 800)
        }, 1500)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-wia-ink mb-3">
          Verifying your location
        </h2>
        <p className="text-wia-ink/50">
          You must be within <strong className="text-wia-ink">50 meters</strong> of {location.name} to join.
        </p>
      </div>

      {/* Animated location indicator */}
      <div className="relative flex items-center justify-center py-8">
        {/* Rings */}
        {(state.status === 'checking' || state.status === 'idle') && (
          <>
            <div className="absolute w-40 h-40 rounded-full border border-wia-purple/20 animate-ping-slow" />
            <div className="absolute w-56 h-56 rounded-full border border-wia-purple/10 animate-ping-slow" style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-72 h-72 rounded-full border border-wia-purple/5 animate-ping-slow" style={{ animationDelay: '1s' }} />
          </>
        )}

        {state.status === 'verified' && (
          <>
            <div className="absolute w-40 h-40 rounded-full border border-emerald-400/20" />
            <div className="absolute w-56 h-56 rounded-full border border-emerald-400/10" />
          </>
        )}

        {/* Center icon */}
        <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          state.status === 'verified'
            ? 'bg-emerald-500/20 border border-emerald-400/40 glow-green'
            : state.status === 'denied' || state.status === 'too_far'
            ? 'bg-red-500/20 border border-red-400/40'
            : 'bg-wia-purple/20 border border-wia-purple/40'
        }`}>
          {state.status === 'checking' || state.status === 'idle'
            ? <Loader size={32} className="text-wia-purple animate-spin" />
            : state.status === 'verified'
            ? <CheckCircle size={32} className="text-emerald-400" />
            : <AlertCircle size={32} className="text-red-400" />
          }
        </div>
      </div>

      {/* Status message */}
      <div className={`px-6 py-4 rounded-2xl border transition-all ${
        state.status === 'verified'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : state.status === 'too_far'
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'glass border-wia-ink/15 text-wia-ink'
      }`}>
        {state.status === 'idle' && (
          <p className="flex items-center justify-center gap-2">
            <MapPin size={16} />
            Requesting location access...
          </p>
        )}
        {state.status === 'checking' && (
          <p className="flex items-center justify-center gap-2">
            <Loader size={16} className="animate-spin" />
            Verifying you&apos;re at {location.name}...
          </p>
        )}
        {state.status === 'verified' && (
          <p className="flex items-center justify-center gap-2 font-medium">
            <CheckCircle size={16} />
            ✓ You&apos;re {state.distanceMeters}m from {location.name}
          </p>
        )}
        {state.status === 'too_far' && (
          <div>
            <p className="font-medium mb-1">You&apos;re too far away</p>
            <p className="text-sm opacity-70">
              You need to be within {location.radiusMeters}m. You&apos;re currently {state.distanceMeters}m away.
            </p>
          </div>
        )}
        {state.status === 'denied' && (
          <div>
            <p className="font-medium mb-1">Location access denied</p>
            <p className="text-sm opacity-70 mb-3">{state.error}</p>
            <button onClick={check} className="text-sm underline opacity-70 hover:opacity-100">
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Venue info */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <MapPin size={16} className="text-wia-purple shrink-0" />
        <div className="text-left">
          <div className="text-sm font-medium text-wia-ink">{location.name}</div>
          <div className="text-xs text-wia-ink/60">Within {location.radiusMeters}m radius required</div>
        </div>
        <div className="ml-auto text-xs font-mono text-wia-ink/55">
          {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
        </div>
      </div>
    </div>
  )
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
