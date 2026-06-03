# WIA – Who Is Around

The live social layer on top of every place.

WIA turns physical venues into real-time social rooms. Guests scan a QR code at the venue, get verified by GPS, take a live selfie, and instantly see who else is around — *right now*. Presence is temporary, scoped to the venue, and disappears when you leave.

> "Who is **here** right now?" — not who's nearby, not who matched with me. Just the real people in the same physical space at the same moment.

## ✨ Live demo flow

1. **Sign in** with Google (master/foundation account)
2. Open the **scanner** → simulate scanning a venue's QR
3. Get verified by GPS (auto-passes within 50m)
4. Take a live selfie via WebRTC
5. Set your **name / age / gender / what you're up to** (10 words)
6. Enter the room → see everyone else here, send waves, react

## 🛡️ Admin backoffice

Email magic-link sign-in (`admin@wia.com` works in demo). Create venues, set the geofence, and get a printable QR poster per venue.

→ `/admin/login`

## 🧱 Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) + Turbopack |
| Language | TypeScript |
| Styling | Tailwind CSS + custom glassmorphism |
| Real-time | Socket.io (stubbed → REST polling in mock) |
| Camera | WebRTC / MediaDevices |
| Geolocation | Browser Geolocation API |
| QR | `qrcode.react` |
| Icons | Lucide React |

## 🚦 Auth model

- **Master account** — Google OAuth, one identity per person.
- **Per-venue presence** — temporary identity created when you join, evicted when you leave.
- **Admin** — separate email magic-link flow, role-gated routes under `/admin/*`.

## 🔒 The scan-only entry rule

You **cannot** join a room by typing its URL. The only way in is to scan the QR code physically displayed at the venue. The QR encodes a short-lived signed scan token that the join flow requires.

This is enforced in three places:
- The landing page never links directly to a room (only to `/scan`)
- The room page shows a locked preview with aggregate stats only
- The join page rejects access without a fresh scan grant

## 🗂️ Project structure

```
app/
  page.tsx              Landing
  scan/page.tsx         QR scanner (real BarcodeDetector API)
  [slug]/page.tsx       Locked room view + unlocked grid
  [slug]/join/page.tsx  GPS → selfie → profile
  admin/
    login/              Email magic-link
    page.tsx            Dashboard
    venues/new/         Create venue form
    venues/[slug]/      Venue detail with printable QR poster
  api/                  REST endpoints (mocked, ready for Redis/Postgres)

components/
  landing/   room/   join/   admin/   auth/   ui/

lib/
  auth.ts              Master + admin auth
  admin-store.ts       Venue CRUD (localStorage demo → Postgres in prod)
  mock-data.ts         12 mock users, 5 seed venues
  hooks/               useAuth, useGeolocation, useCamera, usePresence
```

## 🏗️ Production roadmap

- [ ] NextAuth.js + Google OAuth
- [ ] Postgres + PostGIS for venues + spatial queries
- [ ] Redis (Upstash) for live presence with TTL eviction
- [ ] Socket.io server for real-time room events
- [ ] Cloudflare R2 for selfie storage
- [ ] Signed JWT scan tokens with rotation
- [ ] Push notifications (web push API)
- [ ] Moderation + report/block

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for more.

## 🚀 Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 📜 License

UNLICENSED · Private demo.
