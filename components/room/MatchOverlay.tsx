'use client'

import Image from 'next/image'
import { Heart, MessageCircle, X } from 'lucide-react'
import type { PresenceProfile } from '@/lib/types'

interface MatchOverlayProps {
  match:      PresenceProfile
  myselfieUrl: string
  onChat:     () => void
  onDismiss:  () => void
}

export function MatchOverlay({ match, myselfieUrl, onChat, onDismiss }: MatchOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      {/* Dismiss on backdrop click */}
      <div className="absolute inset-0" onClick={onDismiss} />

      <div className="relative w-full max-w-sm glass-strong rounded-3xl border border-wia-ink/15 p-8 flex flex-col items-center gap-6 shadow-2xl">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-wia-ink/40 hover:text-wia-ink/70 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Headline */}
        <div className="text-center space-y-1">
          <div className="text-4xl">🎉</div>
          <h2 className="font-display text-3xl font-bold gradient-text">It&apos;s a match!</h2>
          <p className="text-sm text-wia-ink/60">
            You and <strong className="text-wia-ink">{match.name}</strong> liked each other
          </p>
        </div>

        {/* Photos */}
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-wia-purple/50 shadow-lg">
            <Image src={myselfieUrl} alt="You" fill className="object-cover" unoptimized />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wia-pink to-wia-purple flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Heart size={18} fill="white" strokeWidth={0} className="text-white" />
            </div>
          </div>
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-wia-pink/50 shadow-lg">
            <Image src={match.selfieUrl} alt={match.name} fill className="object-cover" unoptimized />
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button
            onClick={onChat}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/20"
          >
            <MessageCircle size={18} />
            Send a message
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-2xl glass border border-wia-ink/15 text-wia-ink/60 text-sm font-medium hover:text-wia-ink transition-colors"
          >
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  )
}
