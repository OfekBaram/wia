# WIA – Who Is Around · Architecture

## Tech Stack

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| Framework        | Next.js 15 (App Router)                       |
| Language         | TypeScript                                    |
| Styling          | Tailwind CSS v3 + custom CSS (glass, orbs)    |
| Animation        | Framer Motion (ready to wire in)              |
| Real-time        | Socket.io (stubbed → REST polling in mock)    |
| Geolocation      | Browser Geolocation API                       |
| Camera           | WebRTC / MediaDevices                         |
| Icons            | Lucide React                                  |

## Infrastructure (production-ready stubs)

| Concern          | Approach                                       |
|------------------|------------------------------------------------|
| Presence store   | Redis sorted sets with TTL expiry              |
| Database         | PostgreSQL + PostGIS (spatial queries)         |
| Selfie storage   | S3 / Cloudflare R2                             |
| Auth             | Session tokens (phone/email verification)      |
| Real-time events | Socket.io rooms per location slug              |
| CDN              | Cloudflare                                     |

## Key Files

```
app/
  page.tsx                    Landing page
  [slug]/page.tsx             Location room (public viewer)
  [slug]/join/page.tsx        Join flow (location → selfie → profile)
  api/locations/route.ts      Venue CRUD
  api/presence/[slug]/route.ts  Presence join/leave/list
  api/users/route.ts          Account registration

lib/
  types.ts                    All domain types (Location, PresenceProfile, etc.)
  mock-data.ts                12 mock users, 5 venues, hero cards
  hooks/useGeolocation.ts     GPS check + distance to venue
  hooks/useCamera.ts          WebRTC selfie capture
  hooks/usePresence.ts        Polling → Socket.io drop-in

components/
  landing/                    Hero, HowItWorks, LiveVenues, ForVenues, Footer
  room/                       RoomHeader, PresenceGrid, PersonCard, VibeBar
  join/                       StepGeolocation, StepSelfie, StepProfile
  ui/                         GlassCard, LiveBadge, VibeTag
```

## Real-time Architecture (production)

```
Client ──── Socket.io ──── Presence Server ──── Redis
                │                                  │
                │          room:{slug} channel      │
                └── events:                         │
                    user:joined  ←── broadcast ─────┘
                    user:left                       │
                    wave:sent                       │
                    vibe:updated                    │
```

## Presence Lifecycle

1. User visits `wia.com/{slug}` → sees live grid (read-only)
2. Clicks "Join" → `/[slug]/join`
3. Step 1: GPS verified within `location.radiusMeters`
4. Step 2: Live selfie captured via WebRTC
5. Step 3: Nickname, mood, vibe tags, intention
6. POST `/api/presence/{slug}` → creates Redis key with TTL
7. Socket.io broadcasts `user:joined` to room
8. User is visible in grid; session expires after inactivity

## Mock Data Locations

| URL                          | Category  | Live Count |
|------------------------------|-----------|------------|
| /beach-bar-tel-aviv          | bar       | 14         |
| /summer-festival-2026        | festival  | 47         |
| /campus-central              | campus    | 8          |
| /rooftop-party-nyc           | club      | 22         |
| /gym-downtown                | gym       | 6          |

## Next Steps (production roadmap)

- [ ] Supabase Auth (phone verification)
- [ ] Redis Upstash for presence store
- [ ] Socket.io server on Render/Railway
- [ ] Cloudflare R2 for selfie storage
- [ ] PostGIS geo-queries for location discovery
- [ ] Push notifications (web push API)
- [ ] Venue dashboard (analytics, QR codes)
- [ ] Moderation system (report/block)
- [ ] Premium visibility boosts
