'use client'

import Image from 'next/image'
import { X, Heart, MessageCircle, Sparkles } from 'lucide-react'
import type { PresenceProfile } from '@/lib/types'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface ChatListProps {
  matches:  PresenceProfile[]    // people the current user has a mutual like with
  onPick:   (person: PresenceProfile) => void
  onClose:  () => void
}

/**
 * Overlay that shows all of the current user's matches in this room.
 * Tapping a row opens the chat with that person.
 */
export function ChatList({ matches, onPick, onClose }: ChatListProps) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md glass-strong rounded-t-3xl sm:rounded-3xl border border-wia-ink/15 max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-wia-ink/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wia-pink to-wia-purple flex items-center justify-center">
            <Heart size={16} fill="white" strokeWidth={0} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-wia-ink text-base leading-tight">{t('chatList.title')}</div>
            <div className="text-[11px] text-wia-ink/60">
              {matches.length === 0
                ? t('chatList.emptySub')
                : matches.length === 1 ? t('chatList.countOne', { count: matches.length }) : t('chatList.countMany', { count: matches.length })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-wia-ink/60 hover:text-wia-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-wia-purple/10 border border-wia-purple/30 items-center justify-center">
                <Sparkles size={20} className="text-wia-purple" />
              </div>
              <div>
                <div className="font-semibold text-wia-ink text-sm">{t('chatList.emptyTitle')}</div>
                <div className="text-xs text-wia-ink/60 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t('chatList.emptyBody')}
                </div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onPick(m)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-start"
                  >
                    <div className="relative shrink-0">
                      <Image
                        src={m.selfieUrl}
                        alt={m.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                        unoptimized
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-wia-pink to-wia-purple flex items-center justify-center border-2 border-wia-bg">
                        <Heart size={9} fill="white" strokeWidth={0} className="text-wia-ink" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-wia-ink text-sm truncate">{m.name}</span>
                        <span className="text-[10px] text-wia-ink/55">· {m.age}</span>
                      </div>
                      <div className="text-[11px] text-wia-ink/60 truncate mt-0.5">{m.statusText}</div>
                    </div>
                    <MessageCircle size={16} className="shrink-0 text-wia-ink/55" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
