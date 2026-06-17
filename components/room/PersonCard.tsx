'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, MoreVertical, EyeOff, Flag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import type { PresenceProfile } from '@/lib/types'
import { LiveDot } from '@/components/ui/LiveBadge'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface PersonCardProps {
  person:           PresenceProfile
  isCurrentUser?:   boolean
  iLiked?:          boolean
  likedMe?:         boolean
  likesRemaining?:  number
  onLike?:          () => void
  onOpenChat?:      () => void
  onClick?:         () => void
  onHide?:          () => void
  onReport?:        () => void
}

const GENDER_ICON: Record<string, string> = {
  woman:        '♀',
  man:          '♂',
  'non-binary': '⚧',
  unspecified:  '·',
}

export function PersonCard({
  person, isCurrentUser, iLiked, likedMe, likesRemaining = 5,
  onLike, onOpenChat, onClick, onHide, onReport,
}: PersonCardProps) {
  const { t, locale } = useI18n()
  const [pending,        setPending]        = useState(false)
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null)
  const [menuOpen,       setMenuOpen]       = useState(false)

  const effectiveLiked = optimisticLike !== null ? optimisticLike : (iLiked ?? false)
  const isMatch  = effectiveLiked && likedMe
  const timeHere = formatDistanceToNow(new Date(person.arrivedAt), { addSuffix: false, locale: locale === 'he' ? he : undefined })

  async function handleHeart() {
    if (isCurrentUser || pending || effectiveLiked) return // likes are permanent
    setPending(true)
    setOptimisticLike(true)
    try {
      await onLike?.()
    } catch {
      setOptimisticLike(false) // revert on error
    } finally {
      setOptimisticLike(null) // let parent state take over
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
        <div className="absolute top-2 start-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-wia-pink to-wia-purple text-white flex items-center gap-1">
          <Heart size={10} fill="white" />
          {t('card.match')}
        </div>
      )}
      {!isMatch && person.isNew && !isCurrentUser && (
        <div className="absolute top-2 start-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white">
          {t('card.justArrived')}
        </div>
      )}
      {isCurrentUser && (
        <div className="absolute top-2 start-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-wia-purple/90 text-white">
          {t('card.you')}
        </div>
      )}

      {/* Photo — click to open detail */}
      <div className="relative overflow-hidden cursor-pointer" onClick={onClick}>
        <Image
          src={person.selfieUrl}
          alt={person.name}
          width={300}
          height={300}
          className="w-full h-48 object-cover"
          unoptimized // Selfies come from Supabase Storage — Next/Image proxy not needed
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />

        {/* 3-dot menu — hide / report (not on own card) */}
        {!isCurrentUser && (onHide || onReport) && (
          <div className="absolute top-2 end-2 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
              className="w-7 h-7 rounded-full bg-black/35 text-white/90 hover:bg-black/55 flex items-center justify-center transition-colors"
              title={t('card.moreOptions')}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                {/* click-away backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
                />
                <div className="absolute end-0 top-8 z-20 w-40 rounded-xl glass-strong border border-wia-ink/15 shadow-xl overflow-hidden text-start">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onHide?.() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-wia-ink/80 hover:bg-wia-ink/5 transition-colors"
                  >
                    <EyeOff size={13} className="text-wia-ink/50" />
                    {t('card.hide')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onReport?.() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-500/5 transition-colors border-t border-wia-ink/10"
                  >
                    <Flag size={13} />
                    {t('card.report')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Age + gender chip */}
        <div className={cn(
          'absolute top-2 px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium text-wia-ink flex items-center gap-1',
          !isCurrentUser && (onHide || onReport) ? 'end-11' : 'end-2',
        )}>
          <span className="text-wia-ink/60">{GENDER_ICON[person.gender]}</span>
          {person.age}
        </div>

        {/* Liked-me hint */}
        {likedMe && !isMatch && !isCurrentUser && (
          <div className="absolute top-10 end-2 px-2 py-0.5 rounded-full bg-wia-pink/80 text-white text-[9px] font-semibold flex items-center gap-1 animate-pulse">
            <Heart size={9} fill="white" />
            {t('card.likesYou')}
          </div>
        )}

        {/* Live indicator */}
        <div className="absolute bottom-2 start-2 flex items-center gap-1.5">
          <LiveDot />
          <span className="text-[11px] text-wia-ink/80">{t('card.here', { time: timeHere })}</span>
        </div>

        {/* Bottom action bar — visible on hover/touch */}
        {!isCurrentUser && (
          <div className="absolute bottom-2 end-2 flex items-center gap-1.5">
            {/* Chat button — enabled only on match */}
            <button
              onClick={(e) => { e.stopPropagation(); isMatch && onOpenChat?.() }}
              disabled={!isMatch}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                isMatch
                  ? 'bg-white text-wia-purple hover:scale-110 shadow-lg'
                  : 'bg-black/40 text-wia-ink/55 cursor-not-allowed',
              )}
              title={isMatch ? t('card.openChat') : t('card.chatLocked')}
            >
              <MessageCircle size={16} />
            </button>

            {/* Heart button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleHeart() }}
              disabled={pending || effectiveLiked || (!effectiveLiked && likesRemaining <= 0)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                effectiveLiked
                  ? 'bg-gradient-to-br from-wia-pink to-wia-purple text-white shadow-lg shadow-pink-500/40 scale-110'
                  : likesRemaining <= 0
                    ? 'bg-black/40 text-wia-ink/55 cursor-not-allowed'
                    : 'bg-white/90 text-wia-pink hover:scale-110 shadow-lg',
              )}
              title={
                effectiveLiked ? t('card.liked')
                : likesRemaining <= 0 ? t('card.noLikesLeft')
                : t('card.sendLike')
              }
            >
              <Heart size={16} fill={effectiveLiked ? 'currentColor' : 'none'} />
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
