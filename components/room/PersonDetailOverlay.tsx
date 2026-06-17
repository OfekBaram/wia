'use client'

import Image from 'next/image'
import { X, Heart, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import type { PresenceProfile } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface PersonDetailOverlayProps {
  person:          PresenceProfile
  isCurrentUser?:  boolean
  iLiked?:         boolean
  likedMe?:        boolean
  likesRemaining?: number
  onLike?:         () => void
  onOpenChat?:     () => void
  onClose:         () => void
}

const GENDER_LABEL_KEY: Record<string, string> = {
  woman: 'detail.gWoman', man: 'detail.gMan', 'non-binary': 'detail.gNonBinary', unspecified: '',
}

export function PersonDetailOverlay({
  person, isCurrentUser, iLiked, likedMe, likesRemaining = 5,
  onLike, onOpenChat, onClose,
}: PersonDetailOverlayProps) {
  const { t, locale } = useI18n()
  const isMatch  = iLiked && likedMe
  const timeHere = formatDistanceToNow(new Date(person.arrivedAt), { addSuffix: false, locale: locale === 'he' ? he : undefined })

  function handleHeart() {
    if (iLiked) return // likes are permanent
    onLike?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-sm glass-strong rounded-t-3xl sm:rounded-3xl border border-wia-ink/15 overflow-hidden shadow-2xl sm:max-h-[90vh] sm:overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Match badge */}
        {isMatch && (
          <div className="absolute top-4 start-4 z-10 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-wia-pink to-wia-purple text-white flex items-center gap-1.5 shadow-lg">
            <Heart size={11} fill="white" />
            {t('card.match')}
          </div>
        )}
        {likedMe && !isMatch && !isCurrentUser && (
          <div className="absolute top-4 start-4 z-10 px-3 py-1 rounded-full text-xs font-bold bg-wia-pink/90 text-white flex items-center gap-1.5 animate-pulse">
            <Heart size={11} fill="white" />
            {t('card.likesYou')}
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
          <div className="absolute bottom-0 inset-x-0 p-5 space-y-1">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white leading-tight">
                  {person.name}
                  <span className="ms-2 text-white/70 text-lg font-normal">{person.age}</span>
                </h2>
                {GENDER_LABEL_KEY[person.gender] && (
                  <p className="text-white/60 text-sm">{t(GENDER_LABEL_KEY[person.gender])}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-white/60 text-xs shrink-0">
                <Clock size={11} />
                {t('card.here', { time: timeHere })}
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
              disabled={iLiked || likesRemaining <= 0}
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
              {iLiked ? t('detail.liked') : likesRemaining <= 0 ? t('detail.noLikesLeft') : t('detail.like')}
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
              title={isMatch ? t('detail.openChat') : t('detail.likeToUnlock')}
            >
              <MessageCircle size={16} />
              {isMatch ? t('detail.message') : t('detail.chatLocked')}
            </button>
          </div>
        )}

        {isCurrentUser && (
          <div className="px-5 pb-5 pt-2 text-center text-xs text-wia-ink/50">
            {t('detail.youHint')}
          </div>
        )}
      </div>
    </div>
  )
}
