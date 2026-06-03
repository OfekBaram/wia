'use client'

import type { Location, PresenceProfile } from '@/lib/types'
import { PresenceGrid } from './PresenceGrid'
import { LockedPreview } from './LockedPreview'

interface RoomGateProps {
  location:        Location
  presence:        PresenceProfile[]
  isMember:        boolean
  currentUserId?:  string
  likesSent:       Set<string>
  likesReceived:   Set<string>
  onLikesChanged:  () => void
}

export function RoomGate({
  location, presence, isMember, currentUserId,
  likesSent, likesReceived, onLikesChanged,
}: RoomGateProps) {
  if (!isMember) return <LockedPreview location={location} presence={presence} />
  return (
    <PresenceGrid
      presence={presence}
      currentUserId={currentUserId}
      venueId={location.id}
      venueSlug={location.slug}
      likesSent={likesSent}
      likesReceived={likesReceived}
      onLikesChanged={onLikesChanged}
    />
  )
}
