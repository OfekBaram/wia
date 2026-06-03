'use client'

import Link from 'next/link'
import { QrCode, MapPin, Camera, Users, Sparkles, ArrowRight } from 'lucide-react'
import type { Location, PresenceProfile } from '@/lib/types'
import { VibeBar } from './VibeBar'

interface LockedPreviewProps {
  location: Location
  presence: PresenceProfile[]
  // For anon viewers, RLS hides the presence rows but we still want to show
  // the real count. `location.liveCount` carries it from the server.
}

const REQUIREMENTS = [
  { icon: QrCode,   label: 'Scan the WIA QR at the venue',  color: 'text-wia-purple' },
  { icon: MapPin,   label: 'Be physically within 50m',      color: 'text-wia-cyan' },
  { icon: Camera,   label: 'Take a live selfie',             color: 'text-wia-pink' },
]

export function LockedPreview({ location, presence }: LockedPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Aggregate vibe — no identity revealed */}
      <VibeBar presence={presence} />

      {/* Locked panel */}
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-wia-purple/20">
        {/* Background blurred avatar mosaic */}
        <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 gap-0 opacity-30 blur-2xl pointer-events-none">
          {presence.slice(0, 24).map((p) => (
            <div
              key={p.id}
              className="aspect-square bg-cover bg-center"
              style={{ backgroundImage: `url(${p.selfieUrl})` }}
            />
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-wia-bg/40 via-wia-bg/80 to-wia-bg" />

        {/* Content */}
        <div className="relative px-6 py-12 sm:py-16 text-center space-y-6">
          {/* QR icon */}
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30">
              <QrCode size={28} className="text-wia-ink" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-wia-purple/30 animate-ping-slow" />
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink">
              <span className="gradient-text">{location.liveCount} {location.liveCount === 1 ? 'person is' : 'people are'}</span> here.
            </h2>
            <p className="text-wia-ink/50 text-base sm:text-lg max-w-md mx-auto">
              To see who&apos;s here, scan the WIA QR code on a table at{' '}
              <strong className="text-wia-ink">{location.name}</strong>. Presence is earned, not browsed.
            </p>
          </div>

          {/* Live stats teaser (no identities) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <Users size={14} className="text-wia-green" />
              <span className="text-wia-ink/70">{location.liveCount} live</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <Sparkles size={14} className="text-wia-purple" />
              <span className="text-wia-ink/70">
                {presence.filter(p => p.isNew).length} just arrived
              </span>
            </div>
          </div>

          {/* Requirements */}
          <div className="pt-4 space-y-3 max-w-sm mx-auto">
            <div className="text-xs uppercase tracking-wider text-wia-ink/55">
              To unlock this room
            </div>
            <div className="space-y-2">
              {REQUIREMENTS.map((req, i) => (
                <div
                  key={req.label}
                  className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 text-left"
                >
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center ${req.color}`}>
                    <req.icon size={14} />
                  </div>
                  <span className="text-sm text-wia-ink/70">{req.label}</span>
                  <span className="ml-auto text-[10px] text-wia-ink/55 font-mono">0{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/30"
          >
            <QrCode size={18} />
            Open scanner
            <ArrowRight size={16} />
          </Link>

          <p className="text-xs text-wia-ink/55 max-w-xs mx-auto">
            Already at the venue? Look for the WIA QR code on tables or at the entrance.
          </p>
        </div>
      </div>

      {/* Silhouette grid preview — abstract, no identities */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 opacity-40 pointer-events-none select-none">
        {presence.slice(0, 12).map((p) => (
          <div
            key={p.id}
            className="aspect-[3/4] rounded-2xl overflow-hidden relative glass"
          >
            <div
              className="absolute inset-0 bg-cover bg-center blur-xl scale-110"
              style={{ backgroundImage: `url(${p.selfieUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wia-bg/80 via-wia-bg/40 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[9px] text-wia-ink/60">live</span>
              </div>
              <span className="text-[10px] font-semibold text-wia-ink/60">{p.age}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
