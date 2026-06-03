'use client'

import { MessageCircle } from 'lucide-react'

interface ChatLauncherProps {
  matchCount: number
  onClick:    () => void
}

/**
 * Floating chat button that lives in the bottom-right of the room view.
 * Renders only after the user has opened at least one chat in this venue's
 * session — gives them a one-tap way back to the chat list without
 * scrolling through the presence grid to find the person again.
 */
export function ChatLauncher({ matchCount, onClick }: ChatLauncherProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open your chats"
      className="fixed z-40 bottom-5 right-5 sm:bottom-8 sm:right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink text-white flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle size={24} fill="currentColor" strokeWidth={0} />
      {matchCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-white text-wia-purple text-[10px] font-bold flex items-center justify-center border-2 border-wia-bg">
          {matchCount > 9 ? '9+' : matchCount}
        </span>
      )}
    </button>
  )
}
