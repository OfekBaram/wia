'use client'

import Image from 'next/image'
import { X, Heart, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PresenceProfile } from '@/lib/types'
import { cn } from '@/lib/cn'

interface PersonDetailOverlayProps {
  person:          PresenceProfile
  isCurrentUser?:  boolean
  iLiked?:         boolean
  likedMe?:        boolean
  likesRemaining?: number
  onLike?:         () => void
  onUnlike?:       () => void
  onOpenChat?:     () => void
  onClose:         () => void
}

const GENDER_LABEL: Record<string, string> = {
  woman: 'Woman', man: 'Man', 'non-binary': 'Non-binary', unspecified: '',
}

export function PersonDetailOverlay({
  person, isCurrentUser, iLiked, likedMe, likesRemaining = 5,
  onLike, onUnlike, onOpenChat, onClose,
}: PersonDetailOverlayProps) {
  const isMatch  = iLiked && likedMe
  const timeHere = formatDistanceToNow(new Date(person.arrivedAt), { addSuffix: false })

  function handleHeart() {
    if (iLiked) onUnlike?.()
    else        onLike?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm glass-strong rounded-t-3xl sm:rounded-3xl border border-wia-ink/15 overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Match badge */}
        {isMatch && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-wia-pink to-wia-purple text-white flex items-center gap-1.5 shadow-lg">
            <Heart size={11} fill="white" />
            Match
          </div>
        )}
        {likedMe && !isMatch && !isCurrentUser && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold bg-wia-pink/90 text-white flex items-center gap-1.5 animate-pulse">
            <Heart size={11} fill="white" />
            Likes you
          </div>
        )}

        {/* Full photo */}
        <div className="relative w-full aspect-[4/5]">
          <Image
            src={person.selfieUrl}
            alt={person.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white leading-tight">
                  {person.name}
                  <span className="ml-2 text-white/70 text-lg font-normal">{person.age}</span>
                </h2>
                {GENDER_LABEL[person.gender] && (
                  <p className="text-white/60 text-sm">{GENDER_LABEL[person.gender]}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-white/60 text-xs shrink-0">
                <Clock size={11} />
                {timeHere} here
              </div>
            </div>
            {person.statusText && (
              <p className="text-white/80 text-sm leading-relaxed">&ldquo;{person.statusText}&rdquo;</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isCurrentUser && (
          <div className="p-5 flex items-center gap-3">
            {/* Like / unlike */}
            <button
              onClick={handleHeart}
              disabled={!iLiked && likesRemaining <= 0}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all',
                iLiked
                  ? 'bg-gradient-to-r from-wia-pink to-wia-purple text-white shadow-lg shadow-pink-500/30'
                  : likesRemaining <= 0
                    ? 'glass border border-wia-ink/15 text-wia-ink/40 cursor-not-allowed'
                    : 'glass border border-wia-ink/15 text-wia-pink hover:bg-wia-pink/10 transition-colors',
              )}
            >
              <Heart size={16} fill={iLiked ? 'currentColor' : 'none'} />
              {iLiked ? 'Liked' : likesRemaining <= 0 ? 'No likes left' : 'Like'}
            </button>

            {/* Chat — only on match */}
            <button
              onClick={() => { onOpenChat?.(); onClose() }}
              disabled={!isMatch}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all',
                isMatch
                  ? 'bg-white border border-wia-purple/30 text-wia-purple hover:bg-wia-purple/5'
                  : 'glass border border-wia-ink/15 text-wia-ink/40 cursor-not-allowed',
              )}
              title={isMatch ? 'Open chat' : 'Like each other to unlock chat'}
            >
              <MessageCircle size={16} />
              {isMatch ? 'Message' : 'Chat locked'}
            </button>
          </div>
        )}

        {isCurrentUser && (
          <div className="px-5 pb-5 pt-2 text-center text-xs text-wia-ink/50">
            This is how others see you in the room.
          </div>
        )}
      </div>
    </div>
  )
}
