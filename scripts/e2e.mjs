#!/usr/bin/env node
// WIA happy-flow E2E tests — exercises the real API endpoints end to end.
//
// Usage:
//   node scripts/e2e.mjs                          # against production
//   BASE_URL=http://localhost:3000 node scripts/e2e.mjs
//   VENUE_SLUG=my-venue node scripts/e2e.mjs
//
// Creates two throwaway guests (e2e+<rand>@wia-test.dev), runs them through
// join → room → like → match → chat → unread → leave, then verifies cleanup.
// All data is soft-deleted by the leave step; test emails are clearly marked.

const BASE  = process.env.BASE_URL   ?? 'https://wia-orcin.vercel.app'
const SLUG  = process.env.VENUE_SLUG ?? 'ofeks-house'

// 1x1 transparent PNG
const SELFIE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const rand = () => Math.random().toString(36).slice(2, 8)

// ── Tiny cookie-jar fetch client (one per simulated user) ──────────────────
function makeClient() {
  const jar = new Map()
  function store(res) {
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [pair] = sc.split(';')
      const i = pair.indexOf('=')
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1))
    }
  }
  function header() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
  return async function request(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(jar.size ? { Cookie: header() } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    })
    store(res)
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    return { status: res.status, json }
  }
}

// ── Test harness ────────────────────────────────────────────────────────────
let passed = 0, failed = 0
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`) }
  else      { failed++; console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`) }
}
const section = (t) => console.log(`\n━━ ${t}`)

async function joinGuest(client, profile) {
  return client('POST', '/api/join', {
    email:         profile.email,
    name:          profile.name,
    age:           profile.age,
    gender:        profile.gender,
    statusText:    'E2E test run — ignore me',
    selfieDataUrl: SELFIE,
    venueSlug:     SLUG,
  })
}

async function main() {
  console.log(`WIA E2E — ${BASE} / venue "${SLUG}"`)

  const alice = makeClient()
  const bob   = makeClient()
  const aliceEmail = `e2e+alice-${rand()}@wia-test.dev`
  const bobEmail   = `e2e+bob-${rand()}@wia-test.dev`
  let aliceId, bobId, venueId

  // ── Scenario 0: venue exists & public count works ─────────────────────────
  section('Scenario 0 — venue is live')
  {
    const r = await makeClient()('GET', `/api/room/${SLUG}`)
    check('GET /api/room returns 200', r.status === 200, `status ${r.status}`)
    check('venue payload present', !!r.json?.venue?.id)
    venueId = r.json?.venue?.id
    check('anonymous caller is not a member', r.json?.isMember === false)
  }

  // ── Scenario 1: guest joins and appears in the room ───────────────────────
  section('Scenario 1 — guest join (Alice)')
  {
    const r = await joinGuest(alice, { email: aliceEmail, name: 'E2E Alice', age: 27, gender: 'woman' })
    check('join returns 200', r.status === 200, JSON.stringify(r.json))
    check('join returns userId', !!r.json?.userId)
    aliceId = r.json?.userId

    const room = await alice('GET', `/api/room/${SLUG}`)
    check('Alice is a room member', room.json?.isMember === true)
    check('Alice appears in presence', room.json?.presence?.some(p => p.user_id === aliceId))
  }

  // ── Scenario 2: second guest joins, sees the first ────────────────────────
  section('Scenario 2 — second guest (Bob) sees Alice')
  {
    const r = await joinGuest(bob, { email: bobEmail, name: 'E2E Bob', age: 30, gender: 'man' })
    check('join returns 200', r.status === 200, JSON.stringify(r.json))
    bobId = r.json?.userId

    const room = await bob('GET', `/api/room/${SLUG}`)
    check('Bob sees Alice in the room', room.json?.presence?.some(p => p.user_id === aliceId))
  }

  // ── Scenario 3: like → mutual like → match ───────────────────────────────
  section('Scenario 3 — like and match')
  {
    const l1 = await alice('POST', '/api/likes', { venueSlug: SLUG, toUserId: bobId })
    check('Alice likes Bob (200)', l1.status === 200, JSON.stringify(l1.json))
    check('not yet a match', l1.json?.matched !== true)

    const bobRoom = await bob('GET', `/api/room/${SLUG}`)
    check('Bob sees the incoming like', bobRoom.json?.likesReceived?.includes(aliceId))

    const l2 = await bob('POST', '/api/likes', { venueSlug: SLUG, toUserId: aliceId })
    check('Bob likes Alice back (200)', l2.status === 200, JSON.stringify(l2.json))

    const aliceRoom = await alice('GET', `/api/room/${SLUG}`)
    const mutual = aliceRoom.json?.likesSent?.includes(bobId) && aliceRoom.json?.likesReceived?.includes(bobId)
    check('mutual like visible to Alice', mutual)

    const self = await alice('POST', '/api/likes', { venueSlug: SLUG, toUserId: aliceId })
    check('self-like rejected (400)', self.status === 400)
  }

  // ── Scenario 4: chat unlocked by match ───────────────────────────────────
  section('Scenario 4 — chat')
  {
    const msg = await alice('POST', `/api/chat/${SLUG}/${bobId}`, { text: 'Hi Bob! (e2e)' })
    check('Alice can send a message', msg.status === 200, JSON.stringify(msg.json))

    const reply = await bob('POST', `/api/chat/${SLUG}/${aliceId}`, { text: 'Hey Alice! (e2e)' })
    check('Bob can reply', reply.status === 200)

    const hist = await alice('GET', `/api/chat/${SLUG}/${bobId}`)
    check('history has both messages', (hist.json?.messages?.length ?? 0) >= 2)
    const ordered = hist.json?.messages?.at(-1)?.text === 'Hey Alice! (e2e)'
    check('messages ordered oldest→newest', ordered)

    const unread = await alice('GET', `/api/chat/${SLUG}/unread`)
    check('unread endpoint returns latest per match', !!unread.json?.latest?.[bobId])

    const empty = await alice('POST', `/api/chat/${SLUG}/${bobId}`, { text: '   ' })
    check('empty message rejected (400)', empty.status === 400)
  }

  // ── Scenario 5: chat is locked without a match ───────────────────────────
  section('Scenario 5 — chat locked without match')
  {
    const carol = makeClient()
    const r = await joinGuest(carol, { email: `e2e+carol-${rand()}@wia-test.dev`, name: 'E2E Carol', age: 25, gender: 'woman' })
    check('Carol joins (200)', r.status === 200)

    const blocked = await carol('POST', `/api/chat/${SLUG}/${aliceId}`, { text: 'should be blocked' })
    check('chat blocked without mutual like (403)', blocked.status === 403, `status ${blocked.status}`)

    await carol('POST', '/api/leave', { venueId })
  }

  // ── Scenario 6: leave → gone from room ───────────────────────────────────
  section('Scenario 6 — leave')
  {
    const l = await alice('POST', '/api/leave', { venueId })
    check('Alice leaves (200)', l.status === 200)

    const room = await bob('GET', `/api/room/${SLUG}`)
    check('Alice no longer in presence', !room.json?.presence?.some(p => p.user_id === aliceId))

    const aliceView = await alice('GET', `/api/room/${SLUG}`)
    check('Alice is no longer a member', aliceView.json?.isMember === false)

    await bob('POST', '/api/leave', { venueId })
    const after = await makeClient()('GET', `/api/room/${SLUG}`)
    check('room presence cleaned up', !after.json?.presence?.some(p => [aliceId, bobId].includes(p.user_id)))
  }

  // ── Scenario 7: auth guards ──────────────────────────────────────────────
  section('Scenario 7 — auth guards')
  {
    const anon = makeClient()
    const like  = await anon('POST', '/api/likes', { venueSlug: SLUG, toUserId: bobId })
    check('anonymous like rejected (401)', like.status === 401)
    const leave = await anon('POST', '/api/leave', { venueId })
    check('anonymous leave rejected (401)', leave.status === 401)
    const badJoin = await anon('POST', '/api/join', { email: 'not-an-email', name: 'x', age: 20, gender: 'man', statusText: 'x', selfieDataUrl: SELFIE, venueSlug: SLUG })
    check('invalid email rejected (400)', badJoin.status === 400)
  }

  console.log(`\n${'═'.repeat(40)}\n${failed === 0 ? '🟢' : '🔴'} ${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(e => { console.error('E2E crashed:', e); process.exit(1) })
