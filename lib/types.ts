// ─── Domain Types ────────────────────────────────────────────────────────────

export type Gender = 'woman' | 'man' | 'non-binary' | 'unspecified'

export type VenueCategory =
  | 'bar'
  | 'club'
  | 'cafe'
  | 'festival'
  | 'campus'
  | 'gym'
  | 'coworking'
  | 'hotel'
  | 'airport'
  | 'beach'
  | 'event'

// ─── User / Presence ─────────────────────────────────────────────────────────

export interface MasterAccount {
  id: string
  email: string
  phoneVerified: boolean
  createdAt: Date
  reputation: number
  isBanned: boolean
}

export interface PresenceProfile {
  id: string
  userId: string
  locationSlug: string
  name: string
  age: number
  gender: Gender
  selfieUrl: string
  statusText: string                  // free text, max 10 words — "what you're up to"
  isGhostMode: boolean
  isVisible: boolean
  arrivedAt: Date
  lastSeenAt: Date
  isNew: boolean
  waveCount: number
  hasWavedAt?: string[]
}

// ─── Venue / Location ─────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number
  lng: number
}

export interface Location {
  id: string
  slug: string
  name: string
  tagline: string
  category: VenueCategory
  coordinates: Coordinates
  radiusMeters: number
  coverImageUrl?: string
  isActive: boolean
  liveCount: number
  peakCount?: number
  createdAt: Date
  businessOwnerId?: string
  isPremium: boolean
}

// ─── Interaction ──────────────────────────────────────────────────────────────

export interface Wave {
  id: string
  fromPresenceId: string
  toPresenceId: string
  locationSlug: string
  sentAt: Date
  isReturned: boolean
}

export interface ChatMessage {
  id: string
  locationSlug: string
  fromPresenceId: string
  toPresenceId?: string // null = public room message
  text: string
  sentAt: Date
  isAnonymous: boolean
}

export interface Reaction {
  id: string
  emoji: string
  fromPresenceId: string
  toPresenceId: string
  locationSlug: string
  sentAt: Date
}

// ─── Real-time Events ─────────────────────────────────────────────────────────

export type RoomEventType =
  | 'user:joined'
  | 'user:left'
  | 'wave:sent'
  | 'wave:returned'
  | 'reaction:sent'
  | 'vibe:updated'
  | 'room:updated'

export interface RoomEvent {
  type: RoomEventType
  locationSlug: string
  payload: unknown
  timestamp: Date
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface LocationResponse {
  location: Location
  presence: PresenceProfile[]
  currentUserPresence?: PresenceProfile
}

export interface JoinLocationRequest {
  locationSlug: string
  name: string
  age: number
  gender: Gender
  statusText: string
  selfieDataUrl: string
  userLat: number
  userLng: number
}

export interface JoinLocationResponse {
  success: boolean
  presenceProfile?: PresenceProfile
  error?: 'too_far' | 'location_not_found' | 'already_present' | 'unknown'
  distanceMeters?: number
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface GeolocationState {
  status: 'idle' | 'checking' | 'granted' | 'denied' | 'verified' | 'too_far'
  coords?: Coordinates
  distanceMeters?: number
  error?: string
}

export interface CameraState {
  status: 'idle' | 'requesting' | 'active' | 'captured' | 'denied'
  stream?: MediaStream
  capturedDataUrl?: string
  error?: string
}

export type JoinStep = 'welcome' | 'selfie' | 'profile' | 'entering'
