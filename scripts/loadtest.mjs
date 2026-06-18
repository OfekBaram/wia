#!/usr/bin/env node
// WIA load test — how many concurrent users can share a room and chat?
//
// Usage:
//   node scripts/loadtest.mjs                 # default: 25 users, 60s
//   USERS=100 DURATION=90 node scripts/loadtest.mjs
//   BASE_URL=... VENUE_SLUG=... node scripts/loadtest.mjs
//
// Each simulated user:
//   1. joins via the real atomic /api/join
//   2. polls /api/room/:slug every 3s (same cadence as the real client)
//   3. is paired with a neighbour — mutual like → match
//   4. sends a chat message every ~5s and polls chat every 2.5s
// At the end everyone leaves. Reports success rates + latency percentiles.

const BASE     = process.env.BASE_URL   ?? 'https://wia-orcin.vercel.app'
const SLUG     = process.env.VENUE_SLUG ?? 'beeri'
const USERS    = Number(process.env.USERS    ?? 25)
const DURATION = Number(process.env.DURATION ?? 60) // seconds of steady-state
const JOIN_CONCURRENCY = Number(process.env.JOIN_CONCURRENCY ?? 10)

const SELFIE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const rand = () => Math.random().toString(36).slice(2, 8)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── metrics ────────────────────────────────────────────────────────────────
const metrics = {} // name -> { ok, fail, latencies: [] }
function record(name, ok, ms) {
  const m = (metrics[name] ??= { ok: 0, fail: 0, latencies: [] })
  ok ? m.ok++ : m.fail++
  m.latencies.push(ms)
}
function pct(arr, p) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))])
}

// ── per-user client with cookie jar + timing ───────────────────────────────
function makeClient() {
  const jar = new Map()
  return async function request(name, method, path, body) {
    const t0 = performance.now()
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(jar.size ? { Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(30_000),
      })
      for (const sc of res.headers.getSetCookie?.() ?? []) {
        const [pair] = sc.split(';')
        const i = pair.indexOf('=')
        jar.set(pair.slice(0, i).trim(), pair.slice(i + 1))
      }
      const ms = performance.now() - t0
      let json = null
      try { json = await res.json() } catch { /* ignore */ }
      record(name, res.ok, ms)
      return { status: res.status, json }
    } catch (e) {
      record(name, false, performance.now() - t0)
      return { status: 0, json: null, error: e.message }
    }
  }
}

async function main() {
  console.log(`WIA load test — ${BASE} / "${SLUG}"`)
  console.log(`${USERS} users, ${DURATION}s steady-state, join concurrency ${JOIN_CONCURRENCY}\n`)

  // venue id for leave
  const probe = await makeClient()('probe', 'GET', `/api/room/${SLUG}`)
  const venueId = probe.json?.venue?.id
  if (!venueId) { console.error('Venue not found — aborting'); process.exit(1) }

  // ── Phase 1: ramp users in ────────────────────────────────────────────────
  console.log('Phase 1 — joining users...')
  const users = [] // { client, userId, idx }
  let joined = 0
  const t0 = performance.now()
  for (let batch = 0; batch < USERS; batch += JOIN_CONCURRENCY) {
    const n = Math.min(JOIN_CONCURRENCY, USERS - batch)
    const results = await Promise.all(Array.from({ length: n }, async (_, i) => {
      const idx = batch + i
      const client = makeClient()
      const r = await client('join', 'POST', '/api/join', {
        email:         `e2e+load-${idx}-${rand()}@wia-test.dev`,
        name:          `Load ${idx}`,
        age:           20 + (idx % 30),
        gender:        idx % 2 ? 'man' : 'woman',
        statusText:    'load test — ignore',
        selfieDataUrl: SELFIE,
        venueSlug:     SLUG,
      })
      return r.status === 200 && r.json?.userId ? { client, userId: r.json.userId, idx } : null
    }))
    users.push(...results.filter(Boolean))
    joined = users.length
    process.stdout.write(`  joined ${joined}/${USERS}\r`)
  }
  const joinSecs = ((performance.now() - t0) / 1000).toFixed(1)
  console.log(`\n  ${joined}/${USERS} joined in ${joinSecs}s`)
  if (joined < 2) { console.error('Not enough users joined — aborting'); process.exit(1) }

  // ── Phase 2: pair up + mutual like ────────────────────────────────────────
  console.log('Phase 2 — matching pairs...')
  const pairs = []
  for (let i = 0; i + 1 < users.length; i += 2) pairs.push([users[i], users[i + 1]])
  await Promise.all(pairs.map(async ([a, b]) => {
    await a.client('like', 'POST', '/api/likes', { venueSlug: SLUG, toUserId: b.userId })
    await b.client('like', 'POST', '/api/likes', { venueSlug: SLUG, toUserId: a.userId })
  }))
  console.log(`  ${pairs.length} matched pairs`)

  // ── Phase 3: steady-state — poll room + chat like real clients ───────────
  console.log(`Phase 3 — steady state for ${DURATION}s (room poll 3s, chat poll 2.5s, msg ~5s)...`)
  const stopAt = Date.now() + DURATION * 1000
  let liveErrors = 0

  const loops = users.map(async (u, i) => {
    const partner = i % 2 === 0 ? users[i + 1] : users[i - 1]
    // de-sync users like reality
    await sleep(Math.random() * 3000)
    let lastMsg = 0
    while (Date.now() < stopAt) {
      const room = await u.client('room-poll', 'GET', `/api/room/${SLUG}`)
      if (room.status !== 200) liveErrors++
      if (partner) {
        await u.client('chat-poll', 'GET', `/api/chat/${SLUG}/${partner.userId}`)
        if (Date.now() - lastMsg > 5000) {
          lastMsg = Date.now()
          await u.client('chat-send', 'POST', `/api/chat/${SLUG}/${partner.userId}`,
            { text: `msg ${new Date().toISOString()} from ${u.idx}` })
        }
      }
      await sleep(3000)
    }
  })
  await Promise.all(loops)

  // ── Phase 4: everyone leaves ──────────────────────────────────────────────
  console.log('Phase 4 — leaving...')
  for (let i = 0; i < users.length; i += JOIN_CONCURRENCY) {
    await Promise.all(users.slice(i, i + JOIN_CONCURRENCY).map(u =>
      u.client('leave', 'POST', '/api/leave', { venueId })))
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`)
  console.log(`RESULTS — ${joined} users, room "${SLUG}"`)
  console.log(`${'─'.repeat(64)}`)
  console.log('endpoint     |   ok  | fail | err% |  p50ms |  p95ms |  p99ms')
  console.log(`${'─'.repeat(64)}`)
  for (const [name, m] of Object.entries(metrics)) {
    if (name === 'probe') continue
    const total = m.ok + m.fail
    const errPct = ((m.fail / total) * 100).toFixed(1)
    console.log(
      `${name.padEnd(12)} | ${String(m.ok).padStart(5)} | ${String(m.fail).padStart(4)} | ${errPct.padStart(4)} | ${String(pct(m.latencies, 50)).padStart(6)} | ${String(pct(m.latencies, 95)).padStart(6)} | ${String(pct(m.latencies, 99)).padStart(6)}`,
    )
  }
  console.log(`${'═'.repeat(64)}`)
  const totalReq = Object.values(metrics).reduce((s, m) => s + m.ok + m.fail, 0)
  const totalFail = Object.values(metrics).reduce((s, m) => s + m.fail, 0)
  console.log(`total requests: ${totalReq}, failures: ${totalFail} (${((totalFail / totalReq) * 100).toFixed(2)}%)`)
}

main().catch(e => { console.error('load test crashed:', e); process.exit(1) })
