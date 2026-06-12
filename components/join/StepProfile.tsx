'use client'

import { useState, useMemo, useEffect } from 'react'
import { ArrowRight, Minus, Plus, Mail, Shield, AlertCircle } from 'lucide-react'
import type { Gender } from '@/lib/types'
import { cn } from '@/lib/cn'

interface StepProfileProps {
  selfieUrl: string
  /** Pre-populated when the user already has a master account. */
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
    /** Only present for first-time users. */
    email?:      string
  }) => void
}

const GENDERS: { value: Gender; label: string; icon: string }[] = [
  { value: 'woman',        label: 'Woman',             icon: '♀' },
  { value: 'man',          label: 'Man',               icon: '♂' },
  { value: 'non-binary',   label: 'Non-binary',        icon: '⚧' },
  { value: 'unspecified',  label: 'Prefer not to say', icon: '·' },
]

const MIN_AGE     = 18
const MAX_AGE     = 99
const MAX_WORDS   = 10

const STATUS_SUGGESTIONS = [
  'Looking for someone fun to talk to',
  'Just here with friends, open to meeting people',
  'Solo traveler exploring the night',
  'Dance mood, who is joining the floor',
  'Networking — looking for founders',
  'Chill vibes, drinks and good company',
]

function countWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function StepProfile({ selfieUrl, existingMaster, onComplete }: StepProfileProps) {
  const isFirstTime = !existingMaster

  const [name,       setName]       = useState(existingMaster?.name  ?? '')
  const [age,        setAge]        = useState<number>(existingMaster?.age ?? 25)
  const [gender,     setGender]     = useState<Gender>(existingMaster?.gender ?? 'woman')
  const [statusText, setStatusText] = useState('')
  const [email,      setEmail]      = useState('')
  const [emailFocused, setEmailFocused] = useState(false)

  const wordCount = useMemo(() => countWords(statusText), [statusText])

  const isValid =
    name.trim().length >= 2 &&
    age >= MIN_AGE && age <= MAX_AGE &&
    wordCount <= MAX_WORDS &&
    (!isFirstTime || isValidEmail(email))

  function submit() {
    if (!isValid) return
    onComplete({
      name:       name.trim(),
      age,
      gender,
      statusText: statusText.trim(),
      email:      isFirstTime ? email.trim().toLowerCase() : undefined,
    })
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
          Set your presence
        </h2>
        <p className="text-wia-ink/50 text-sm">
          This is your temporary identity here. It disappears when you leave.
        </p>
      </div>

      {/* Selfie preview */}
      <div className="flex justify-center">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selfieUrl}
            alt="Your selfie"
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-wia-purple/40"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-wia-bg flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-wia-ink/60 mb-2">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Maya, Kai, Zara..."
          maxLength={24}
          className="w-full glass-strong rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
        />
      </div>

      {/* Age */}
      <div>
        <label className="block text-sm font-medium text-wia-ink/60 mb-2">
          Age
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
            <span className="text-xs text-wia-ink/55">years</span>
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
          Gender
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
              <span className="truncate">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-wia-ink/60">
            What are you up to here? <span className="text-wia-ink/40">(optional)</span>
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
            {wordCount}/{MAX_WORDS} words
          </span>
        </div>
        <textarea
          value={statusText}
          onChange={e => handleStatusChange(e.target.value)}
          placeholder="A short line about what you're doing tonight..."
          rows={2}
          className="w-full glass-strong rounded-xl px-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all resize-none"
        />

        {/* Suggestions */}
        {statusText.length === 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] text-wia-ink/60 glass hover:text-wia-ink/80 hover:border-wia-purple/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Email — only shown to first-time users. Saved as their identifier;
          no verification, no magic link, no tokenization. */}
      {isFirstTime && (
        <div className="pt-2 border-t border-wia-ink/10">
          <label className="block text-sm font-medium text-wia-ink/60 mb-2">
            Your email
          </label>
          <div className="relative">
            <Mail
              size={15}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 transition-colors',
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
              className="w-full glass-strong rounded-xl pl-11 pr-4 py-3 text-wia-ink placeholder:text-wia-ink/50 outline-none focus:ring-1 focus:ring-wia-purple/50 transition-all"
            />
          </div>

          {email.length > 0 && !isValidEmail(email) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/80">
              <AlertCircle size={12} />
              That doesn&apos;t look like a valid email
            </div>
          )}

          <p className="mt-2 text-[11px] text-wia-ink/55 leading-relaxed flex items-center gap-1">
            <Shield size={11} className="text-wia-purple/70" />
            Saved as your WIA identity across every venue. Never shared, never spam.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!isValid}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-lg transition-all',
          isValid
            ? 'bg-gradient-to-r from-wia-purple to-wia-pink text-white hover:opacity-90 shadow-xl shadow-purple-500/20'
            : 'glass text-wia-ink/50 cursor-not-allowed',
        )}
      >
        Enter the room
        <ArrowRight size={20} />
      </button>

      <p className="text-center text-xs text-wia-ink/50">
        Your presence at this venue expires when you leave. No permanent social media — just this moment.
      </p>
    </div>
  )
}
