'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PresenceProfile } from '@/lib/types'
import { LiveDot } from '@/components/ui/LiveBadge'
import { cn } from '@/lib/cn'

interface PersonCardProps {
  person:           PresenceProfile
  isCurrentUser?:   boolean
  iLiked?:          boolean
  likedMe?:         boolean
  likesRemaining?:  number
  onLike?:          () => void
  onUnlike?:        () => void
  onOpenChat?:      () => void
}

const GENDER_ICON: Record<string, string> = {
  woman:        '♀',
  man:          '♂',
  'non-binary': '⚧',
  unspecified:  '·',
}

export function PersonCard({
  person, isCurrentUser, iLiked, likedMe, likesRemaining = 5,
  onLike, onUnlike, onOpenChat,
}: PersonCardProps) {
  const [pending, setPending] = useState(false)

  const isMatch  = iLiked && likedMe
  const timeHere = formatDistanceToNow(new Date(person.arrivedAt), { addSuffix: false })

  async function handleHeart() {
    if (isCurrentUser || pending) return
    setPending(true)
    try {
      if (iLiked) await onUnlike?.()
      else        await onLike?.()
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border overflow-hidden transition-all duration-300',
        'glass border-wia-ink/15 hover:scale-[1.02] hover:shadow-2xl hover:border-wia-ink/20',
        isCurrentUser && 'ring-1 ring-wia-purple/50',
        person.isNew && !isMatch && 'ring-1 ring-emerald-400/40',
        isMatch && 'ring-2 ring-wia-pink/70 shadow-pink-500/20 shadow-xl',
      )}
    >
      {/* Match badge */}
      {isMatch && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-wia-pink to-wia-purple text-white flex items-center gap-1">
          <Heart size={10} fill="white" />
          Match
        </div>
      )}
      {!isMatch && person.isNew && !isCurrentUser && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white">
          Just arrived
        </div>
      )}
      {isCurrentUser && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-wia-purple/90 text-white">
          You
        </div>
      )}

      {/* Photo */}
      <div className="relative overflow-hidden">
        <Image
          src={person.selfieUrl}
          alt={person.name}
          width={300}
          height={300}
          className="w-full h-48 object-cover"
          unoptimized // Selfies come from Supabase Storage — Next/Image proxy not needed
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />

        {/* Age + gender chip */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium text-wia-ink flex items-center gap-1">
          <span className="text-wia-ink/60">{GENDER_ICON[person.gender]}</span>
          {person.age}
        </div>

        {/* Liked-me hint */}
        {likedMe && !isMatch && !isCurrentUser && (
          <div className="absolute top-10 right-2 px-2 py-0.5 rounded-full bg-wia-pink/80 text-white text-[9px] font-semibold flex items-center gap-1 animate-pulse">
            <Heart size={9} fill="white" />
            Likes you
          </div>
        )}

        {/* Live indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <LiveDot />
          <span className="text-[11px] text-wia-ink/80">{timeHere} here</span>
        </div>

        {/* Bottom action bar — visible on hover/touch */}
        {!isCurrentUser && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            {/* Chat button — enabled only on match */}
            <button
              onClick={() => isMatch && onOpenChat?.()}
              disabled={!isMatch}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                isMatch
                  ? 'bg-white text-wia-purple hover:scale-110 shadow-lg'
                  : 'bg-black/40 text-wia-ink/55 cursor-not-allowed',
              )}
              title={isMatch ? 'Open chat' : 'Mutual like required to chat'}
            >
              <MessageCircle size={16} />
            </button>

            {/* Heart button */}
            <button
              onClick={handleHeart}
              disabled={pending || (!iLiked && likesRemaining <= 0)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                iLiked
                  ? 'bg-gradient-to-br from-wia-pink to-wia-purple text-white shadow-lg shadow-pink-500/40 scale-110'
                  : likesRemaining <= 0
                    ? 'bg-black/40 text-wia-ink/55 cursor-not-allowed'
                    : 'bg-white/90 text-wia-pink hover:scale-110 shadow-lg',
              )}
              title={
                iLiked ? 'Tap to unlike'
                : likesRemaining <= 0 ? 'No likes left in this room'
                : 'Send a like'
              }
            >
              <Heart size={16} fill={iLiked ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-wia-ink text-sm truncate">{person.name}</span>
        </div>
        <p className="text-[11px] text-wia-ink/55 leading-snug line-clamp-2">
          {person.statusText}
        </p>
      </div>
    </div>
  )
}
