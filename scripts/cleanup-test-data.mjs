#!/usr/bin/env node
// Removes all E2E/load-test data from production.
// Targets ONLY auth users whose email matches e2e+...@wia-test.dev, then:
//   presence, likes, chat_messages, master_profiles, selfie storage, auth user.
// Finally corrects venue scan_count (one increment per test join) and resets peak_count.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import ws from 'ws'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing Supabase env vars'); process.exit(1) }

const admin = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: ws }, // satisfies Node 20 (no native WebSocket) — realtime is unused here
})
const TEST_EMAIL = /^e2e\+.*@wia-test\.dev$/i

async function main() {
  // 1. Find test users
  const testUsers = []
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    testUsers.push(...data.users.filter(u => TEST_EMAIL.test(u.email ?? '')))
    if (data.users.length < 1000) break
    page++
  }
  console.log(`Found ${testUsers.length} test users`)
  if (!testUsers.length) { console.log('Nothing to clean.'); return }
  const ids = testUsers.map(u => u.id)

  // 2. Count joins per venue (presence rows) so we can correct scan_count
  const { data: presRows } = await admin.from('presence').select('venue_id').in('user_id', ids)
  const joinsPerVenue = {}
  for (const r of presRows ?? []) joinsPerVenue[r.venue_id] = (joinsPerVenue[r.venue_id] ?? 0) + 1

  // 3. Delete DB rows (chunked to keep query size sane)
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    for (const [table, cols] of [
      ['chat_messages',   ['from_user_id', 'to_user_id']],
      ['likes',           ['from_user_id', 'to_user_id']],
      ['presence',        ['user_id']],
      ['master_profiles', ['user_id']],
    ]) {
      for (const col of cols) {
        const { error } = await admin.from(table).delete().in(col, chunk)
        if (error) console.error(`  ${table}.${col}:`, error.message)
      }
    }
    process.stdout.write(`  db rows cleaned for ${Math.min(i + 100, ids.length)}/${ids.length} users\r`)
  }
  console.log('\nDB rows removed')

  // 4. Delete selfie storage objects (stored under <userId>/ paths)
  let removedFiles = 0
  for (const id of ids) {
    const { data: files } = await admin.storage.from('selfies').list(id)
    if (files?.length) {
      await admin.storage.from('selfies').remove(files.map(f => `${id}/${f.name}`))
      removedFiles += files.length
    }
  }
  console.log(`Storage: removed ${removedFiles} selfie files`)

  // 5. Delete auth users
  let deleted = 0
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) console.error(`  auth delete ${id}:`, error.message)
    else deleted++
    process.stdout.write(`  auth users deleted ${deleted}/${ids.length}\r`)
  }
  console.log(`\nAuth: deleted ${deleted} users`)

  // 6. Correct venue counters
  for (const [venueId, joins] of Object.entries(joinsPerVenue)) {
    const { data: v } = await admin.from('venues').select('slug, scan_count, peak_count').eq('id', venueId).maybeSingle()
    if (!v) continue
    const newScan = Math.max(0, (v.scan_count ?? 0) - joins)
    await admin.from('venues').update({ scan_count: newScan, peak_count: 0 }).eq('id', venueId)
    console.log(`Venue "${v.slug}": scan_count ${v.scan_count} → ${newScan} (-${joins} test joins), peak_count reset to 0`)
  }

  console.log('\n✅ Cleanup complete')
}

main().catch(e => { console.error('cleanup failed:', e); process.exit(1) })
