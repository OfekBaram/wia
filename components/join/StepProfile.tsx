'use client'

import { useState, useMemo, useRef } from 'react'
import { ArrowRight, Minus, Plus, Mail, Shield, AlertCircle } from 'lucide-react'
import type { Gender } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { GoogleSignInButton, GOOGLE_ENABLED } from './GoogleSignInButton'

interface StepProfileProps {
  selfieUrl: string
  /** Pre-populated when the user already has a master account (= a live session). */
  existingMaster?: {
    email: string
    name?: string
    age?: number
    gender?: Gender
  }
  onComplete: (profile: {
    name:        string
    age:         number
    gender:      Gender
    statusText:  string
    /** Present only when entering via the email fallback (first-time users). */
    email?:       string
    /** Google ID token + raw nonce, exchanged for a session server-side. */
    googleToken?: string
    googleNonce?: string
  }) => void
}

const GENDERS: { value: Gender; labelKey: string; icon: string }[] = [
  { value: 'woman',        labelKey: 'profile.gWoman',       icon: '♀' },
  { value: 'man',          labelKey: 'profile.gMan',         icon: '♂' },
  { value: 'non-binary',   labelKey: 'profile.gNonBinary',   icon: '⚧' },
  { value: 'unspecified',  labelKey: 'profile.gUnspecified', icon: '·' },
]

const MIN_AGE     = 18
const MAX_AGE     = 99
const MAX_WORDS   = 10

const SUGGESTION_KEYS = ['profile.sug1', 'profile.sug2', 'profile.sug3', 'profile.sug4', 'profile.sug5', 'profile.sug6']

function countWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function StepProfile({ selfieUrl, existingMaster, onComplete }: StepProfileProps) {
  const { t } = useI18n()
  // A returning user reaches this step with a live session already (bootstrap
  // only returns a master profile when authenticated) — no re-auth needed.
  const isAuthed = !!existingMaster

  const [name,       setName]       = useState(existingMaster?.name  ?? '')
  const [age,        setAge]        = useState<number>(existingMaster?.age ?? 25)
  const [gender,     setGender]     = useState<Gender>(existingMaster?.gender ?? 'woman')
  const [statusText, setStatusText] = useState('')
  const [email,      setEmail]      = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  // First-time users default to Google; flip to the email fallback on demand
  // (or automatically when Google isn't configured / fails).
  const [emailMode,  setEmailMode]  = useState(!GOOGLE_ENABLED)
  const [googleErr,  setGoogleErr]  = useState<string | null>(null)

  const wordCount = useMemo(() => countWords(statusText), [statusText])

  const profileValid =
    name.trim().length >= 2 &&
    age >= MIN_AGE && age <= MAX_AGE &&
    wordCount <= MAX_WORDS

  // Latest profile fields, read at Google-callback time (fires after an async
  // popup) so we never submit a stale closure.
  const latest = useRef({ name, age, gender, statusText })
  latest.current = { name: name.trim(), age, gender, statusText: statusText.trim() }

  function submitEmail() {
    if (!profileValid || !isValidEmail(email)) return
    onComplete({ ...latest.current, email: email.trim().toLowerCase() })
  }

  function submitAuthed() {
    if (!profileValid) return
    onComplete({ ...latest.current })
  }

  function handleGoogleCredential(token: string, nonce: string) {
    onComplete({ ...latest.current, googleToken: token, googleNonce: nonce })
  }

  function bumpAge(delta: number) {
    setAge(a => Math.min(MAX_AGE, Math.max(MIN_AGE, a + delta)))
  }

  // If the user types more than 10 words, just truncate on the fly
  function handleStatusChange(value: string) {
    const words = value.trim().split(/\s+/)
    if (words.length > MAX_WORDS) {
      setStatusText(words.slice(0, MAX_WORDS).join(' '))
    } else {
      setStatusText(value)
    }
  }

  return (
    <div className="space-y-7">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-wia-ink mb-2">
          {t('profile.title')}
        </h2>
        <p className="text-wia-ink/50 text-sm">
          {t('profile.sub')}
        </p>
      </div>

      {/* Selfie preview */}
      <div className="flex justify-center">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selfieUrl}
            alt={t('selfie.alt')}
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-wia-purple/40"
          />
          <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-wia-bg flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-wia-ink/60 mb-2">
          {t('profile.name')}
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('profile.namePh')}
          maxLength={24}
          className="w-full glass-strong rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
        />
      </div>

      {/* Age */}
      <div>
        <label className="block text-sm font-medium text-wia-ink/60 mb-2">
          {t('profile.age')}
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => bumpAge(-1)}
            className="w-11 h-11 rounded-xl glass border-wia-ink/15 hover:bg-white/10 text-wia-ink/60 hover:text-wia-ink flex items-center justify-center transition-all"
          >
            <Minus size={16} />
          </button>
          <div className="flex-1 glass-strong rounded-xl px-4 py-3 flex items-center justify-center gap-2">
            <input
              type="number"
              value={age}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setAge(Math.min(MAX_AGE, Math.max(MIN_AGE, v)))
              }}
              min={MIN_AGE}
              max={MAX_AGE}
              className="w-16 bg-transparent text-center font-display font-bold text-2xl text-wia-ink outline-none"
            />
            <span className="text-xs text-wia-ink/55">{t('profile.years')}</span>
          </div>
          <button
            onClick={() => bumpAge(1)}
            className="w-11 h-11 rounded-xl glass border-wia-ink/15 hover:bg-white/10 text-wia-ink/60 hover:text-wia-ink flex items-center justify-center transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-wia-ink/60 mb-2">
          {t('profile.gender')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map(g => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={cn(
                'px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                gender === g.value
                  ? 'bg-wia-purple/20 border-wia-purple/50 text-wia-ink'
                  : 'glass border-wia-ink/15 text-wia-ink/50 hover:text-wia-ink/80',
              )}
            >
              <span className="text-base text-wia-ink/60">{g.icon}</span>
              <span className="truncate">{t(g.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-wia-ink/60">
            {t('profile.statusLabel')} <span className="text-wia-ink/40">{t('profile.optional')}</span>
          </label>
          <span
            className={cn(
              'text-xs font-mono transition-colors',
              wordCount === 0 ? 'text-wia-ink/50'
              : wordCount > MAX_WORDS ? 'text-red-400'
              : wordCount >= MAX_WORDS - 2 ? 'text-amber-400'
              : 'text-wia-ink/60',
            )}
          >
            {t('profile.words', { count: wordCount, max: MAX_WORDS })}
          </span>
        </div>
        <textarea
          value={statusText}
          onChange={e => handleStatusChange(e.target.value)}
          placeholder={t('profile.statusPh')}
          rows={2}
          className="w-full glass-strong rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all resize-none"
        />

        {/* Suggestions */}
        {statusText.length === 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTION_KEYS.map(key => {
              const s = t(key)
              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(s)}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] text-wia-ink/60 glass hover:text-wia-ink/80 hover:border-wia-purple/30 transition-all"
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Enter the room ─────────────────────────────────────────────────
          Three cases:
          1. Authed (returning user): single "Enter the room" — rides session.
          2. First-time + Google: One Tap button + "use email instead".
          3. First-time + email fallback: email field + "Enter the room". */}
      <div className="pt-2 space-y-3">
        {isAuthed ? (
          <button
            onClick={submitAuthed}
            disabled={!profileValid}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-lg transition-all',
              profileValid
                ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white hover:opacity-90 shadow-xl shadow-purple-500/20'
                : 'glass text-wia-ink/50 cursor-not-allowed',
            )}
          >
            {t('profile.enterRoom')}
            <ArrowRight size={20} className="rtl-mirror" />
          </button>
        ) : !emailMode ? (
          <>
            {profileValid ? (
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={() => { setGoogleErr(t('profile.googleFailed')); setEmailMode(true) }}
              />
            ) : (
              <button
                disabled
                className="w-full py-4 rounded-2xl font-semibold text-lg glass text-wia-ink/50 cursor-not-allowed"
              >
                {t('profile.completeProfile')}
              </button>
            )}
            <button
              onClick={() => setEmailMode(true)}
              className="w-full text-center text-xs text-wia-ink/55 underline hover:text-wia-ink transition-colors"
            >
              {t('profile.useEmailInstead')}
            </button>
          </>
        ) : (
          <>
            {/* Email fallback */}
            <div className="pt-1">
              <label className="block text-sm font-medium text-wia-ink/60 mb-2">
                {t('profile.email')}
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className={cn(
                    'absolute start-4 top-1/2 -translate-y-1/2 transition-colors',
                    emailFocused ? 'text-wia-purple' : 'text-wia-ink/55',
                  )}
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={()  => setEmailFocused(false)}
                  placeholder="you@email.com"
                  className="w-full glass-strong rounded-xl ps-11 pe-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
                />
              </div>

              {googleErr && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle size={12} />
                  {googleErr}
                </div>
              )}
              {email.length > 0 && !isValidEmail(email) && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle size={12} />
                  {t('profile.emailBad')}
                </div>
              )}

              <p className="mt-2 text-[11px] text-wia-ink/55 leading-relaxed flex items-center gap-1">
                <Shield size={11} className="text-wia-purple/70" />
                {t('profile.emailNote')}
              </p>
            </div>

            <button
              onClick={submitEmail}
              disabled={!profileValid || !isValidEmail(email)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-lg transition-all',
                profileValid && isValidEmail(email)
                  ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white hover:opacity-90 shadow-xl shadow-purple-500/20'
                  : 'glass text-wia-ink/50 cursor-not-allowed',
              )}
            >
              {t('profile.enterRoom')}
              <ArrowRight size={20} className="rtl-mirror" />
            </button>

            {GOOGLE_ENABLED && (
              <button
                onClick={() => { setEmailMode(false); setGoogleErr(null) }}
                className="w-full text-center text-xs text-wia-ink/55 underline hover:text-wia-ink transition-colors"
              >
                {t('profile.useGoogleInstead')}
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs text-wia-ink/50">
        {t('profile.footNote')}
      </p>
    </div>
  )
}
