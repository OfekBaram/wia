'use client'

import { MessageCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface ChatLauncherProps {
  matchCount:  number
  unreadCount: number
  onClick:     () => void
}

export function ChatLauncher({ matchCount, unreadCount, onClick }: ChatLauncherProps) {
  const { t } = useI18n()
  return (
    <button
      onClick={onClick}
      aria-label={t('chat.openChats')}
      className="fixed z-40 bottom-5 end-5 sm:bottom-8 sm:end-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink text-white flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle size={24} fill="currentColor" strokeWidth={0} />
      {unreadCount > 0 ? (
        <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-wia-bg animate-bounce">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : matchCount > 0 && (
        <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-white text-wia-purple text-[10px] font-bold flex items-center justify-center border-2 border-wia-bg">
          {matchCount > 9 ? '9+' : matchCount}
        </span>
      )}
    </button>
  )
}
