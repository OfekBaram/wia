'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Send, Heart } from 'lucide-react'
import type { PresenceProfile } from '@/lib/types'

interface ChatPanelProps {
  venueSlug:      string
  venueId:        string
  other:          PresenceProfile
  currentUserId:  string
  onClose:        () => void
}

interface ChatMessage {
  id:           string
  venue_id:     string
  from_user_id: string
  to_user_id:   string
  text:         string
  created_at:   string
}

const POLL_MS = 2500

export function ChatPanel({ venueSlug, other, currentUserId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [ready,    setReady]    = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastTypingSent = useRef(0)

  const url = `/api/chat/${encodeURIComponent(venueSlug)}/${encodeURIComponent(other.userId)}`

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setMessages(json.messages ?? [])
      setPartnerTyping(!!json.partnerTyping)
    } catch { /* ignore */ } finally {
      setReady(true)
    }
  }, [url])

  // Send a typing heartbeat, throttled to once per 2.5s while actively typing.
  const pingTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSent.current < 2500) return
    lastTypingSent.current = now
    fetch(url, { method: 'PUT', credentials: 'include' }).catch(() => { /* ignore */ })
  }, [url])

  useEffect(() => { load() }, [load])

  // Poll for new messages
  useEffect(() => {
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, partnerTyping])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch(url, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ text }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as { error?: string }))
        setError(j.error ?? 'Could not send')
        return
      }
      setText('')
      load()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md glass-strong rounded-t-3xl sm:rounded-3xl border border-wia-ink/15 max-h-[85dvh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-wia-ink/10 flex items-center gap-3">
          <Image
            src={other.selfieUrl}
            alt={other.name}
            width={40} height={40}
            className="w-10 h-10 rounded-full object-cover"
            unoptimized
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-wia-ink text-sm truncate">{other.name}</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-wia-pink to-wia-purple text-white">
                <Heart size={8} fill="white" />
                match
              </span>
            </div>
            <div className="text-[10px] text-wia-ink/60 truncate">{other.statusText}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-wia-ink/60 hover:text-wia-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {!ready && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
            </div>
          )}
          {ready && messages.length === 0 && (
            <div className="text-center py-12 text-sm text-wia-ink/55">
              You matched! Say hi 👋
            </div>
          )}
          {messages.map((m) => {
            const isMine = m.from_user_id === currentUserId
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                    isMine
                      ? 'bg-gradient-to-br from-wia-purple to-wia-pink text-white rounded-br-md'
                      : 'glass text-wia-ink rounded-bl-md'
                  }`}
                >
                  {m.text}
                  <div className={`text-[9px] mt-1 ${isMine ? 'text-wia-ink/60' : 'text-wia-ink/55'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}

          {partnerTyping && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-wia-ink/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-wia-ink/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-wia-ink/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-wia-ink/10 space-y-2">
          {error && (
            <div className="text-xs text-red-300 px-2">{error}</div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => { setText(e.target.value); if (e.target.value.trim()) pingTyping() }}
              placeholder="Type a message..."
              maxLength={1000}
              disabled={sending}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-wia-ink placeholder:text-wia-ink/55 outline-none focus:ring-1 focus:ring-wia-purple/50 text-base sm:text-sm"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-wia-purple to-wia-pink text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
