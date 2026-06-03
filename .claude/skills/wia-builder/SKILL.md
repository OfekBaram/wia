---
name: wia-builder
description: Use this skill whenever the user mentions WIA, "Who Is Around", wia-orcin, the live social layer product, venue rooms, QR-scan presence, or the `/Users/ofekb/wia` codebase — even if they don't explicitly ask. Trigger on any request to build a feature in WIA, fix a WIA bug, deploy WIA, add an admin page, modify venue/room/chat/like behavior, work on the join flow, or change anything at https://wia-orcin.vercel.app. This skill gives you the full project context, the stack, the critical gotchas (especially the Supabase browser SDK hang), the auth model, the file layout, and the deploy recipe — so you can pick up the project instantly without re-discovering everything from scratch. Load this skill before reading any WIA file so you avoid the well-known traps.
---

# WIA Builder

You're working on **WIA — Who Is Around**, a live social discovery platform. This briefing is what you'd hear from a colleague on day one. Read it before touching any code.

## The product in 60 seconds

Physical venues (bars, clubs, festivals, gyms, cafés) print QR codes on tables. A guest scans the QR → opens `wia.com/{slug}?scan={token}` → GPS verifies they're at the venue → they take a live selfie → set their **name, age, gender, status (10 words)**, **email** (saved once for life) → enter "the room" → see everyone else physically present → send up to **5 likes** → **mutual like unlocks a 1:1 chat** → the **geofence auto-disconnects** them when they walk out of the venue.

Presence is temporary and scoped to the venue. The end user **never visits the homepage** — they always arrive via QR. The homepage is marketing + the venue-owner signup funnel.

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 App Router + TypeScript + Tailwind CSS |
| Database / Auth / Storage / Realtime | Supabase (project `oqpnbagahngwxdtgqldl`) |
| Hosting | Vercel (project `wia`, scope `ofekbarams-projects`) |
| Live URL | https://wia-orcin.vercel.app |
| Project root | `/Users/ofekb/wia` |
| Secrets | `/Users/ofekb/wia/.env.local` — read it, don't print it back to the user |
| Super admin login | `ofekbaram5@gmail.com` / `207016007` |

## ⚠️ Critical gotchas — internalize before coding

These are not stylistic preferences. They are the load-bearing decisions of the project. Breaking them produces silent hangs that look like infinite loaders.

### 1. The browser Supabase SDK hangs when an auth cookie exists

`@supabase/ssr`'s `createBrowserClient` has a bug (in our version) where any operation — `supabase().from(...).select(...)`, `supabase().auth.getUser()`, storage uploads, realtime subscriptions — **never resolves** once the Set-Cookie from a server-side sign-in is in the browser. The fetch isn't even made; the promise just hangs.

**The rule**: any DB read/write that must work for an authenticated user goes through a **server-side route handler** in `app/api/...`. The client makes a normal `fetch('/api/...', { credentials: 'include' })`, the route reads the cookie via `serverClient()` to identify the user, then uses `adminClient()` (service-role) to do the actual work, and returns JSON. This is established throughout the codebase — `app/api/room/[slug]/route.ts`, `app/api/join/route.ts`, `app/api/likes/route.ts`, `app/api/chat/...`, `app/api/admin/venues/...` are all examples.

The narrow exception: `supabase().auth.signInWithPassword(...)` from the browser works because the cookie isn't yet set during the call itself. After a server-side sign-in, **don't** try to sync via `auth.setSession(...) + polling getUser` — just `window.location.assign('/{path}')` so the new page picks up the cookie fresh.

### 2. Use polling, not realtime subscriptions on the client

Same root cause. The room polls `/api/room/:slug` every 3 seconds. The chat panel polls `/api/chat/:slug/:other` every 2.5 seconds. Don't introduce `supabase().channel(...).on(...)` calls on the client — they suffer the same hang. The polling cadence is fine for friend-testing scale.

### 3. The atomic `/api/join` endpoint does everything in one request

`POST /api/join { email, name, age, gender, statusText, selfieDataUrl, venueSlug }` performs the entire end-of-flow atomically server-side:

1. Find-or-create the auth user (paginating `admin.auth.admin.listUsers` because there's no `getUserByEmail`)
2. Reset their password to a fresh random value
3. Sign in via the SSR cookie client → emits `Set-Cookie`
4. Decode the selfie data URL → upload to Supabase Storage via the admin client (path: `{user_id}/{slug}-{ts}.jpg`)
5. Upsert `master_profiles`
6. Upsert `presence` (4-hour TTL)
7. Return `{ ok: true, slug, userId }`

Client just does `await fetch('/api/join', ...)` then `window.location.assign('/{slug}')`. **Do not split this into separate client-side calls.** The whole thing exists because every individual step hangs the browser SDK.

### 4. Use Web Crypto, not `crypto.randomUUID()`

Vercel's serverless runtime doesn't expose `crypto` as a Node built-in import. Use:

```ts
const randomHex = (bytes: number): string =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
```

This pattern appears in `app/api/auth/quick-signin/route.ts` and `app/api/join/route.ts`.

### 5. Selfie/storage uploads — server-side only

Client-side `supabase().storage.from('selfies').upload(...)` hits the same hang. Always send the data URL to the server, decode there with `Buffer.from(b64, 'base64')`, and upload via `adminClient().storage.from('selfies').upload(...)`. The `selfies` bucket is public-read with RLS restricting writes to the user's own folder, but we bypass that with the admin client anyway.

## Auth model

There are **three roles**, all driven by the `admin_users.role` column:

| Role | What they see | How they sign up |
|------|---------------|------------------|
| `super_admin` | Every venue, every guest | Manually inserted in Supabase (just `ofekbaram5@gmail.com` for now) |
| `venue_owner` | Only their own venue. Capped at 1 venue per account. | Self-service via `/admin/login` → "Sign up" tab → `POST /api/venue-owner/signup` |
| `user` (no row in `admin_users`) | Their own per-venue presence, the other guests in a room they're in | Atomic via `/api/join` — no password prompt, server generates one |

The `useAuth()` hook in `lib/hooks/useAuth.ts` returns `{ user, ready, isAuthenticated }` where `user.role` is `'super_admin' | 'venue_owner' | 'user'`. Helpers in `lib/auth.ts`: `canAccessAdmin(user)`, `isSuperAdmin(user)`. The `AdminGate` component lets both `super_admin` and `venue_owner` in; dashboards and detail pages then filter by role.

The "1 venue per owner" cap is enforced in `app/api/admin/venues/route.ts` (the create endpoint), not at the DB level — super admin can still create unlimited venues on behalf of others.

## Project map

```
/Users/ofekb/wia
├── app/
│   ├── page.tsx                       Landing (marketing + venue-owner funnel)
│   ├── scan/page.tsx                  In-app QR scanner (BarcodeDetector API)
│   ├── [slug]/
│   │   ├── page.tsx                   Room: locked preview ↔ unlocked grid.
│   │   │                              Polls /api/room/:slug every 3s.
│   │   │                              Auto-forwards to /join when ?scan= present.
│   │   └── join/page.tsx              Welcome → GPS check → selfie → profile.
│   │                                  Final submit POSTs to /api/join.
│   ├── admin/
│   │   ├── login/page.tsx             Sign in / Sign up tabs (password auth)
│   │   ├── page.tsx                   Dashboard — filters venues by role
│   │   └── venues/
│   │       ├── new/page.tsx           Create form → POST /api/admin/venues
│   │       └── [slug]/page.tsx        Detail + QR poster, gated by ownership
│   ├── auth/
│   │   ├── callback/route.ts          Magic-link redirect (rarely used now)
│   │   └── error/page.tsx
│   └── api/                           ← ALL non-trivial DB work happens here
│       ├── join/                      atomic guest signup + room join
│       ├── auth/quick-signin/         password-less signin (used by /scan)
│       ├── venue-owner/signup/        biz signs up — creates user + admin_users row
│       ├── room/[slug]/               full room state: venue, presence,
│       │                              likesSent, likesReceived, isMember
│       ├── admin/venues/              POST create venue (role + cap enforced)
│       ├── admin/venues/list/         dashboard list (filtered by role)
│       ├── admin/venues/[slug]/       GET detail (gated) + DELETE
│       ├── likes/                     POST/DELETE — like or unlike someone
│       ├── chat/[slug]/[other]/       GET history + POST send (gated by mutual like)
│       └── venues/[slug]/count/       public live count (anon-readable)
├── components/
│   ├── landing/   Hero, Nav, LiveVenues, HowItWorks, ForVenues, Footer
│   ├── room/      PresenceGrid, PersonCard, RoomGate, RoomHeader,
│   │              LockedPreview, ChatPanel, ChatLauncher, ChatList, VibeBar
│   ├── join/      StepWelcome (with GPS gate), StepSelfie, StepProfile, StepGeolocation
│   ├── admin/     AdminGate, AdminNav, QRCodePoster
│   ├── auth/      AuthGate, SignInScreen, FragmentErrorHandler
│   └── ui/        GlassCard, LiveBadge
├── lib/
│   ├── auth.ts                  Master types + role helpers
│   ├── geo.ts                   Haversine, getCurrentCoords, GPS_GRACE_METERS
│   ├── types.ts                 Domain types (PresenceProfile, Location, Gender, …)
│   ├── mock-data.ts             VENUE_EMOJI, HERO_CARDS (illustrative only)
│   ├── cn.ts                    classnames helper
│   ├── api/                     Thin client wrappers (most just call /api/* now)
│   ├── hooks/
│   │   ├── useAuth.ts           Returns { user, ready, isAuthenticated }
│   │   └── useGeofence.ts       watchPosition + onExit when out of radius
│   └── supabase/
│       ├── client.ts            createBrowserClient — use sparingly, only outside cookied-auth flows
│       ├── server.ts            serverClient (cookie-aware) + adminClient (service role)
│       └── types.ts             Hand-written DB types (DbVenue, DbPresence, …)
├── supabase/migrations/         SQL files (0001 → 0004 so far) — NOT auto-applied
├── middleware.ts                Refreshes Supabase auth cookie on every request
├── tailwind.config.ts           Theme tokens (wia-bg, wia-ink, brand colors)
└── app/globals.css              .glass / .glass-strong / .orb / .enter-N utilities
```

## Design system (light theme)

The site is **light, not dark**. Don't reflexively reach for dark backgrounds.

| Token | Value | Used for |
|-------|-------|----------|
| `bg-wia-bg` | `#FAFAFB` | Page background |
| `text-wia-ink` | `#1A1430` | Primary body text |
| `text-wia-ink/60` | tinted | Secondary text — readable on white |
| `border-wia-ink/15` | tinted | Hairline borders |
| `bg-wia-purple` / `text-wia-purple` | `#8B5CF6` | Brand accent |
| `bg-wia-pink` / `text-wia-pink` | `#EC4899` | Brand accent |
| `bg-wia-cyan` / `text-wia-cyan` | `#06B6D4` | Brand accent |
| `bg-wia-green` | `#10B981` | Live status |
| `.glass` / `.glass-strong` | white cards with subtle border + shadow | Surface containers |
| `.orb orb-purple` (etc.) | soft pastel blur in bg | Ambient color |
| `.enter-1` … `.enter-6` | slide-up-fade with stagger | Hero / step animations |

The brand identity is the **purple → pink → cyan gradient** used on the WIA wordmark, primary CTAs, accent headlines (`<span className="gradient-text">…</span>`), and step-number indicators. `text-white` is **only** used on gradient or solid-colored backgrounds (e.g., the gradient CTA buttons). Everywhere else, body text is `text-wia-ink` with opacity for hierarchy.

## Recipes

### Deploy

```bash
cd /Users/ofekb/wia
# Vercel token is in .env.local (key: VERCEL_TOKEN). If not present, ask the user.
export VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' .env.local | cut -d= -f2- 2>/dev/null)
npx vercel@latest deploy --prod --yes --scope=ofekbarams-projects
```

A clean build takes ~45 seconds. The deploy emits a preview URL but the production alias `wia-orcin.vercel.app` updates within a few seconds afterward.

### Run a SQL migration

Migrations live in `/Users/ofekb/wia/supabase/migrations/` (numbered: `0001_initial_schema.sql`, … `0004_venue_owner_signup.sql`). They are **not** auto-applied. When you need to introduce schema changes:

1. Create the next numbered file under `supabase/migrations/`
2. Output the SQL **inline in a code block** for the user to copy into Supabase SQL Editor — don't tell them to `cat` the file, they'll paste the shell command instead of the contents (this happened, multiple times)
3. Idempotent SQL only — use `if not exists`, `drop policy if exists`, `on conflict do nothing`. The user may re-run

### Add a new server endpoint

```
app/api/<feature>/route.ts
```

Skeleton:

```ts
import { NextResponse } from 'next/server'
import { adminClient, serverClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // 1. Identify the caller from the cookie
  const ssr = await serverClient()
  const { data: userData } = await ssr.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  // 2. Do the work with the admin client (bypasses RLS)
  const admin = adminClient()
  // …

  return NextResponse.json({ ok: true })
}
```

Wrap risky logic in try/catch and surface stage-labeled errors (see `app/api/join/route.ts` for the pattern) so future debugging knows which step actually failed.

### Add a new admin-only page

`app/admin/<page>/page.tsx` — the `app/admin/layout.tsx` already wraps everything in `<AdminGate>` which lets in `super_admin` + `venue_owner`. Inside, use `useAuth()` to branch on role and filter data accordingly. Talk to the server via `fetch('/api/admin/...', { credentials: 'include' })` — never the browser Supabase client.

### Test the flow locally

Camera + GPS won't work over `http://localhost:3000` from all browsers. Use Chrome on `http://localhost:3000` and accept the geo permission. The selfie input is a `<input type="file" accept="image/*" capture="user">` — on desktop it opens a file picker, on mobile it opens the front camera. The dev server's preview tab doesn't allow file picking, so for full e2e tests, drive Chrome directly.

### Clean DB for fresh testing

```bash
SVC=<service-role from .env.local>
URL=https://oqpnbagahngwxdtgqldl.supabase.co
# Wipe all auth users except super admin
curl -s "$URL/auth/v1/admin/users?per_page=200" -H "apikey: $SVC" -H "Authorization: Bearer $SVC" \
  | python3 -c "
import sys, json, urllib.request
keep = 'ofekbaram5@gmail.com'
for u in json.load(sys.stdin)['users']:
    if u['email'] == keep: continue
    urllib.request.urlopen(urllib.request.Request(
      f'$URL/auth/v1/admin/users/{u[\"id\"]}', method='DELETE',
      headers={'apikey':'$SVC', 'Authorization':'Bearer $SVC'})).read()"
```

Cascade deletes wipe their presence + likes + chat messages automatically.

## Conventions

- Always TypeScript, never plain JS. New files get `.tsx` for components, `.ts` for libs.
- Component files are PascalCase under `components/<area>/<Name>.tsx`. Default exports are fine for pages, named exports for components.
- Tailwind utility classes only — no separate CSS modules or styled-components. Reach for `glass`, `glass-strong`, `gradient-text`, `orb`, and `enter-N` from `globals.css` for project polish.
- For text colors: body text is `text-wia-ink` (or `text-wia-ink/60`, `/70` for hierarchy). `text-white` is reserved for content sitting directly on a gradient or solid-color background.
- For new SQL migrations: numbered files in `supabase/migrations/`, idempotent only.
- Server endpoints under `app/api/<path>/route.ts`. Return `NextResponse.json(...)`. Use `export const dynamic = 'force-dynamic'` on anything that reads cookies or query params (otherwise Next.js may try to statically render it).
- Don't commit secrets. `.env.local` is git-ignored.

## What NOT to do

- ❌ Don't add `supabase().from(...)` or `supabase().auth.getUser()` calls in any component that's reached after the auth cookie is set. The room page, the admin pages, the chat panel — all hit this. Build an API route instead.
- ❌ Don't add a `supabase().channel(...).on('postgres_changes', ...)` subscription on the client. Use the polling pattern.
- ❌ Don't try to set up email verification or magic links in the regular user flow. The product decision is **zero email friction** for guests — `/api/join` creates the account and signs them in atomically.
- ❌ Don't flip the theme to dark. It's deliberately light.
- ❌ Don't merge venue creation into the signup endpoint — those are separate steps for venue owners (sign up → create venue), and the `/admin/venues/new` form is the UX entry point.
- ❌ Don't print credentials back to the user in chat. They're in `.env.local`.

## When the user asks for a feature

1. **Read this skill in full first** (you're doing that now).
2. **Sketch the change** — which existing API routes / components are involved? Which gotchas apply?
3. **If it needs DB changes**, write a new numbered migration file and output the SQL inline for the user to paste.
4. **If it touches authenticated reads/writes**, build the server route first, then wire the client to call it via `fetch`.
5. **Build → deploy → ask the user to test** in incognito or with a real friend on their phone. Mention the live URL plus the venue-specific scan URL when relevant.
6. **If something hangs**, the answer is almost always "the browser Supabase client" — convert that call to a server route.

Welcome to WIA. Build something good.
