'use client'

import { useState, useMemo, useEffect } from 'react'
import { Filter, Heart } from 'lucide-react'
import type { PresenceProfile } from '@/lib/types'
import { PersonCard } from './PersonCard'
import { VibeBar } from './VibeBar'
import { ChatPanel } from './ChatPanel'
import { ChatLauncher } from './ChatLauncher'
import { ChatList } from './ChatList'

export const LIKE_LIMIT_PER_ROOM = 5

interface PresenceGridProps {
  presence:       PresenceProfile[]
  currentUserId?: string
  venueId:        string
  venueSlug:      string
  likesSent:      Set<string>
  likesReceived:  Set<string>
  onLikesChanged: () => void   // parent triggers /api/room refresh
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Just arrived' },
  { value: 'random', label: 'Shuffle' },
] as const
type SortOption = (typeof SORT_OPTIONS)[number]['value']

const FILTERS = [
  { value: 'all',     label: 'All' },
  { value: 'matches', label: 'Matches' },
  { value: 'liked-me', label: 'Likes you' },
  { value: 'new',     label: 'Just arrived' },
  { value: 'woman',   label: 'Women' },
  { value: 'man',     label: 'Men' },
  { value: 'nb',      label: 'Non-binary' },
] as const
type FilterValue = (typeof FILTERS)[number]['value']

export function PresenceGrid({
  presence, currentUserId, venueId, venueSlug,
  likesSent, likesReceived, onLikesChanged,
}: PresenceGridProps) {
  const [sort,    setSort]    = useState<SortOption>('newest')
  const [filter,  setFilter]  = useState<FilterValue>('all')
  const [chatWith,    setChatWith]    = useState<PresenceProfile | null>(null)
  const [showList,    setShowList]    = useState(false)
  const [hasChatted,  setHasChatted]  = useState(false)
  const [busy,    setBusy]    = useState<Set<string>>(new Set())

  // Once the user opens any chat in this venue, the floating launcher sticks
  // around for the rest of the session. The flag is per-venue so different
  // rooms don't share state.
  const chatFlagKey = `wia:hasChatted:${venueSlug}`
  useEffect(() => {
    try { setHasChatted(sessionStorage.getItem(chatFlagKey) === '1') } catch { /* ignore */ }
  }, [chatFlagKey])

  function openChat(person: PresenceProfile) {
    setShowList(false)
    setChatWith(person)
    if (!hasChatted) {
      setHasChatted(true)
      try { sessionStorage.setItem(chatFlagKey, '1') } catch { /* ignore */ }
    }
  }

  // Matches = mutual-like between current user and another presence row
  const matches = useMemo(
    () => presence.filter(p => likesSent.has(p.userId) && likesReceived.has(p.userId)),
    [presence, likesSent, likesReceived],
  )

  const likesRemaining = LIKE_LIMIT_PER_ROOM - likesSent.size

  async function handleLike(toUserId: string) {
    if (busy.has(toUserId)) return
    setBusy(prev => new Set(prev).add(toUserId))
    try {
      const res = await fetch('/api/likes', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ venueSlug, toUserId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }))
        alert(err.error ?? 'Could not send the like')
      }
      onLikesChanged()
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(toUserId); return n })
    }
  }

  async function handleUnlike(toUserId: string) {
    if (busy.has(toUserId)) return
    setBusy(prev => new Set(prev).add(toUserId))
    try {
      await fetch('/api/likes', {
        method:      'DELETE',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ venueSlug, toUserId }),
      })
      onLikesChanged()
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(toUserId); return n })
    }
  }

  const displayed = useMemo(() => {
    let list = [...presence]
    if (filter === 'matches')  list = list.filter(p => likesSent.has(p.userId) && likesReceived.has(p.userId))
    if (filter === 'liked-me') list = list.filter(p => likesReceived.has(p.userId))
    if (filter === 'new')      list = list.filter(p => p.isNew)
    if (filter === 'woman')    list = list.filter(p => p.gender === 'woman')
    if (filter === 'man')      list = list.filter(p => p.gender === 'man')
    if (filter === 'nb')       list = list.filter(p => p.gender === 'non-binary')

    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.arrivedAt).getTime() - new Date(a.arrivedAt).getTime())
    } else if (sort === 'random') {
      list.sort(() => Math.random() - 0.5)
    }
    return list
  }, [presence, sort, filter, likesSent, likesReceived])

  const availableFilters = FILTERS.filter(f => {
    if (f.value === 'all')      return true
    if (f.value === 'matches')  return presence.some(p => likesSent.has(p.userId) && likesReceived.has(p.userId))
    if (f.value === 'liked-me') return likesReceived.size > 0
    if (f.value === 'new')      return presence.some(p => p.isNew)
    if (f.value === 'woman')    return presence.some(p => p.gender === 'woman')
    if (f.value === 'man')      return presence.some(p => p.gender === 'man')
    if (f.value === 'nb')       return presence.some(p => p.gender === 'non-binary')
    return false
  })

  return (
    <div className="space-y-6">
      <VibeBar presence={presence} />

      {/* Likes-remaining counter */}
      <div className="glass rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-wia-ink/60">
          <Heart size={14} className="text-wia-pink" fill={likesRemaining < LIKE_LIMIT_PER_ROOM ? 'currentColor' : 'none'} />
          <span><strong className="text-wia-ink">{likesRemaining}</strong> of {LIKE_LIMIT_PER_ROOM} likes left in this room</span>
        </div>
        {likesReceived.size > 0 && (
          <div className="text-xs text-wia-pink flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wia-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-wia-pink" />
            </span>
            {likesReceived.size} {likesReceived.size === 1 ? 'person likes' : 'people like'} you
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-wia-ink/55 shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {availableFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filter === f.value
                    ? 'bg-wia-purple text-wia-ink'
                    : 'glass text-wia-ink/50 hover:text-wia-ink'
                }`}
              >
                {f.label}
                {f.value === 'all' && ` (${presence.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[10px] uppercase tracking-wider text-wia-ink/55 sm:hidden">Sort by</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                  sort === opt.value
                    ? 'glass-strong text-wia-ink border-wia-purple/30'
                    : 'text-wia-ink/55 hover:text-wia-ink/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {displayed.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            isCurrentUser={person.userId === currentUserId}
            iLiked={likesSent.has(person.userId)}
            likedMe={likesReceived.has(person.userId)}
            likesRemaining={likesRemaining}
            onLike={()    => handleLike(person.userId)}
            onUnlike={()  => handleUnlike(person.userId)}
            onOpenChat={() => openChat(person)}
          />
        ))}
      </div>

      {displayed.length === 0 && (
        <div className="py-20 text-center text-wia-ink/55">
          No one matches this filter right now.
        </div>
      )}

      {/* Floating chat launcher — appears once they've opened a chat in this room */}
      {hasChatted && !chatWith && !showList && (
        <ChatLauncher
          matchCount={matches.length}
          onClick={() => setShowList(true)}
        />
      )}

      {/* Chat list overlay */}
      {showList && (
        <ChatList
          matches={matches}
          onPick={openChat}
          onClose={() => setShowList(false)}
        />
      )}

      {/* Active 1:1 chat overlay */}
      {chatWith && currentUserId && (
        <ChatPanel
          venueSlug={venueSlug}
          venueId={venueId}
          other={chatWith}
          currentUserId={currentUserId}
          onClose={() => setChatWith(null)}
        />
      )}
    </div>
  )
}
