#!/usr/bin/env node
// i18n integrity check — guards the two biggest risks of a bilingual deploy:
//   1. A key present in one locale but missing in the other → users see the raw
//      key string (e.g. "joinWelcome.ctaJoin") instead of text.
//   2. A {placeholder} that differs between en/he → broken interpolation
//      (e.g. {name} missing in Hebrew means the name never shows).
// Transpiles dictionary.ts in-memory (it has no runtime imports) and diffs.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')

const src = readFileSync(new URL('../lib/i18n/dictionary.ts', import.meta.url), 'utf8')
const js  = ts.transpileModule(src, { compilerOptions: { module: 'CommonJS', target: 'ES2020' } }).outputText
const mod = { exports: {} }
new Function('exports', 'module', 'require', js)(mod.exports, mod, require)
const { dict } = mod.exports

let problems = 0
const fail = (m) => { problems++; console.log(`  ❌ ${m}`) }

// Flatten nested tree → { 'ns.key': 'value' }
function flatten(tree, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flatten(v, key, out)
    else out[key] = v
  }
  return out
}

const en = flatten(dict.en)
const he = flatten(dict.he)
const enKeys = new Set(Object.keys(en))
const heKeys = new Set(Object.keys(he))

console.log(`i18n check — ${enKeys.size} en keys, ${heKeys.size} he keys`)

// 1. Key parity
console.log('\n━━ Key parity (en ↔ he)')
const missingInHe = [...enKeys].filter(k => !heKeys.has(k))
const missingInEn = [...heKeys].filter(k => !enKeys.has(k))
if (missingInHe.length) fail(`Missing in he: ${missingInHe.join(', ')}`)
if (missingInEn.length) fail(`Missing in en: ${missingInEn.join(', ')}`)
if (!missingInHe.length && !missingInEn.length) console.log('  ✅ every key exists in both locales')

// 2. Placeholder parity
console.log('\n━━ Placeholder parity ({var})')
const ph = (s) => new Set((String(s).match(/\{(\w+)\}/g) ?? []))
let phOk = true
for (const k of enKeys) {
  if (!heKeys.has(k)) continue
  const a = ph(en[k]), b = ph(he[k])
  const aOnly = [...a].filter(x => !b.has(x))
  const bOnly = [...b].filter(x => !a.has(x))
  if (aOnly.length || bOnly.length) {
    phOk = false
    fail(`${k}: en has ${[...a].join(',') || '∅'} / he has ${[...b].join(',') || '∅'}`)
  }
}
if (phOk) console.log('  ✅ placeholders match in every shared key')

// 3. Empty values
console.log('\n━━ Non-empty values')
const empties = [...enKeys, ...heKeys].filter(k => {
  const v = enKeys.has(k) ? en[k] : he[k]
  return typeof v !== 'string' || v.trim() === ''
})
if (empties.length) fail(`Empty/non-string values: ${[...new Set(empties)].join(', ')}`)
else console.log('  ✅ no empty values')

// 4. Untranslated leftovers — he value identical to en (excluding brand/url/format-only)
console.log('\n━━ Suspicious untranslated (he === en)')
const ALLOW = /^[\s\d\/.:+\-–—%·•(){}\[\]]*$|WIA|wia\.com|@|http|^[A-Za-z]{2,4}$|gershayim/
const sameButShouldDiffer = [...enKeys].filter(k => heKeys.has(k)
  && en[k] === he[k]
  && /[A-Za-z]{4,}/.test(en[k])           // has real English words
  && !/^[A-Z]{2,5}$/.test(en[k].trim())   // not an acronym
)
if (sameButShouldDiffer.length) {
  console.log(`  ⚠️  ${sameButShouldDiffer.length} key(s) identical in both — review (may be intentional brand/format):`)
  sameButShouldDiffer.forEach(k => console.log(`     ${k} = ${JSON.stringify(en[k])}`))
} else console.log('  ✅ no suspicious identical strings')

console.log(`\n${'═'.repeat(48)}\n${problems === 0 ? '🟢' : '🔴'} ${problems} problem(s)`)
process.exit(problems === 0 ? 0 : 1)
