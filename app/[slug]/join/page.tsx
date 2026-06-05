'use client'

import { useState, use, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, Camera, User, Sparkles, QrCode, AlertCircle,
} from 'lucide-react'
import type { JoinStep, Gender, Location } from '@/lib/types'
import { StepWelcome } from '@/components/join/StepWelcome'
import { StepSelfie } from '@/components/join/StepSelfie'
import { StepProfile } from '@/components/join/StepProfile'
import { cn } from '@/lib/cn'

import { supabase } from '@/lib/supabase/client'
import { joinVenue } from '@/lib/api/presence'
import { uploadSelfie } from '@/lib/api/selfies'
import { upsertMasterProfile, type MasterProfile } from '@/lib/api/master-profile'

const PENDING_KEY = 'wia:pending_join'

interface PendingJoin {
  slug:       string
  name:       string
  age:        number
  gender:     Gender
  statusText: string
  selfieUrl:  string         // either data URL (pre-upload) or Storage URL
  email:      string
}

interface Props {
  params: Promise<{ slug: string }>
}

function EnteringStep({ venueName, onAbort }: { venueName: string; onAbort: () => void }) {
  const [showAbort, setShowAbort] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowAbort(true), 12_000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="text-center space-y-8 py-12">
      <div className="relative flex items-center justify-center">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-wia-purple to-wia-pink flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse-slow">
          <Sparkles size={40} className="text-wia-ink" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-3xl border border-wia-purple/20 animate-ping-slow" />
        </div>
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold gradient-text mb-3">
          You&apos;re in.
        </h2>
        <p className="text-wia-ink/50">
          Entering <strong className="text-wia-ink">{venueName}</strong>...
        </p>
      </div>
      {showAbort && (
        <div className="pt-4 border-t border-wia-ink/10 space-y-2">
          <p className="text-xs text-amber-200/70">
            Taking longer than usual. Stuck? Check the console for errors.
          </p>
          <button
            onClick={onAbort}
            className="text-xs text-wia-ink/60 underline hover:text-wia-ink"
          >
            ← Back to the form
          </button>
        </div>
      )}
    </div>
  )
}

const STEPS: { key: JoinStep; icon: typeof Camera; label: string }[] = [
  { key: 'welcome', icon: Sparkles, label: 'Welcome' },
  { key: 'selfie',  icon: Camera,   label: 'Selfie' },
  { key: 'profile', icon: User,     label: 'Profile' },
]

export default function JoinPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [venue,        setVenue]        = useState<Location | null>(null)
  const [liveCount,    setLiveCount]    = useState(0)
  const [master,       setMaster]       = useState<MasterProfile | null>(null)
  const [ready,        setReady]        = useState(false)
  const [step,         setStep]         = useState<JoinStep>('welcome')
  const [selfieData,   setSelfieData]   = useState<string>('')
  const [submitError,  setSubmitError]  = useState<string | null>(null)

  // ── Load venue, presence count, current user, and decide first step ──────
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const res = await fetch(`/api/join/bootstrap?slug=${encodeURIComponent(slug)}`, {
          credentials: 'include', cache: 'no-store',
        })
        if (cancelled) return
        if (!res.ok) { setReady(true); return }
        const json = await res.json()
        if (cancelled) return
        if (!json.venue) { setReady(true); return }

        // Shape venue to match Location type
        const v = { ...json.venue, createdAt: new Date(json.venue.createdAt) }
        setVenue(v)
        setLiveCount(json.venue.liveCount ?? 0)
        setMaster(json.masterProfile ?? null)
        setReady(true)
      } catch (e) {
        console.error('join bootstrap failed', e)
        setReady(true)
      }
    }
    bootstrap()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const finishJoin = useCallback(async (
    v: Location,
    _profile: MasterProfile | null,
    pending: PendingJoin,
  ) => {
    let stage = 'init'
    try {
      // Verify the session is actually set before doing anything that needs auth
      stage = 'auth_check'
      const { data: userData, error: userErr } = await supabase().auth.getUser()
      if (userErr || !userData?.user) {
        throw new Error(`Auth missing after sign-in: ${userErr?.message ?? 'no user'}`)
      }
      console.log('[join] authed as', userData.user.id)

      // 1. Upload selfie if needed
      let selfieUrl = pending.selfieUrl
      if (selfieUrl.startsWith('data:')) {
        stage = 'selfie_upload'
        console.log('[join] uploading selfie...')
        selfieUrl = await uploadSelfie(selfieUrl, v.slug)
        console.log('[join] selfie uploaded:', selfieUrl)
      }

      // 2. Save master profile
      stage = 'master_profile'
      console.log('[join] upserting master profile...')
      await upsertMasterProfile({
        name:   pending.name,
        age:    pending.age,
        gender: pending.gender,
      })
      console.log('[join] master profile saved')

      // 3. Create presence
      stage = 'presence_insert'
      console.log('[join] joining venue...')
      await joinVenue({
        venueId:    v.id,
        name:       pending.name,
        age:        pending.age,
        gender:     pending.gender,
        statusText: pending.statusText,
        selfieUrl,
      })
      console.log('[join] presence created')

      // 4. Navigate to the room
      stage = 'navigate'
      localStorage.removeItem(PENDING_KEY)
      router.replace(`/${v.slug}`)
    } catch (e) {
      console.error(`[join] failed at stage=${stage}`, e)
      const msg = e instanceof Error ? e.message : 'Failed to enter the room'
      setSubmitError(`[${stage}] ${msg}`)
      setStep('profile')
    }
  }, [router])

  function handleSelfie(dataUrl: string) {
    setSelfieData(dataUrl)
    setStep('profile')
  }

  async function handleProfile(profile: {
    name:       string
    age:        number
    gender:     Gender
    statusText: string
    email?:     string
  }) {
    if (!venue) return
    setSubmitError(null)
    setStep('entering')

    try {
      const email = profile.email ?? master?.email ?? ''
      if (!email) throw new Error('Email is required to enter the room')

      // Single atomic call — server creates user, signs in (sets cookie),
      // uploads selfie, writes master_profile + presence. Returns when all
      // five steps succeed. The browser then just navigates.
      console.log('[join] POST /api/join...')
      const res = await fetch('/api/join', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          name:          profile.name,
          age:           profile.age,
          gender:        profile.gender,
          statusText:    profile.statusText,
          selfieDataUrl: selfieData,
          venueSlug:     slug,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(err.error ?? `Join failed (status ${res.status})`)
      }
      console.log('[join] /api/join succeeded — navigating to room')

      localStorage.removeItem(PENDING_KEY)
      // Hard navigate so the room page loads with the freshly-set auth cookie
      window.location.assign(`/${slug}`)
    } catch (e) {
      console.error('[join] failed:', e)
      setSubmitError(e instanceof Error ? e.message : 'Failed to enter the room')
      setStep('profile')
    }
  }

  const stepIndex = STEPS.findIndex(s => s.key === step)

  if (!ready) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-wia-bg flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-display text-2xl font-bold text-wia-ink">Venue not found</h1>
          <p className="text-wia-ink/50 text-sm">
            <code className="font-mono">/{slug}</code> isn&apos;t a WIA venue yet.
          </p>
          <Link href="/" className="inline-block text-wia-purple hover:underline">← Back home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wia-bg flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] -top-48 -left-48 animate-glow" />
        <div className="orb orb-pink   w-[500px] h-[500px] -bottom-32 -right-32 animate-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top */}
        <div className="px-6 py-5 flex items-center justify-between">
          <span className="font-display text-xl font-bold gradient-text">WIA</span>
          <span className="text-xs sm:text-sm text-wia-ink/55">
            Joining <span className="text-wia-ink/60">{venue.name}</span>
          </span>
        </div>

        {/* Progress */}
        {step !== 'welcome' && step !== 'entering' && (
          <div className="px-6 pb-6">
            <div className="flex items-center max-w-sm mx-auto">
              {STEPS.map((s, i) => {
                const isCompleted = stepIndex > i
                const isCurrent   = stepIndex === i
                return (
                  <div key={s.key} className="flex items-center flex-1">
                    <div className={cn(
                      'relative flex items-center justify-center w-8 h-8 rounded-full border text-xs font-semibold transition-all duration-300',
                      isCompleted ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-400'
                      : isCurrent  ? 'bg-wia-purple/20 border-wia-purple/60 text-wia-purple'
                      :              'glass border-wia-ink/15 text-wia-ink/50',
                    )}>
                      {isCompleted ? <CheckCircle size={14} /> : <s.icon size={14} />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        'flex-1 h-px mx-1 transition-all duration-500',
                        isCompleted ? 'bg-emerald-400/40' : 'bg-white/10',
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between max-w-sm mx-auto mt-1.5 text-[10px] text-wia-ink/55">
              {STEPS.map(s => <span key={s.key}>{s.label}</span>)}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-6 pb-12">
          <div className="w-full max-w-lg glass-strong rounded-3xl p-6 sm:p-8">
            {step === 'welcome' && (
              <StepWelcome
                location={venue}
                liveCount={liveCount}
                isReturning={!!master}
                onContinue={() => setStep('selfie')}
              />
            )}

            {step === 'selfie' && (
              <StepSelfie onCaptured={handleSelfie} />
            )}

            {step === 'profile' && (
              <>
                <StepProfile
                  selfieUrl={selfieData}
                  existingMaster={master ? {
                    email:  master.email,
                    name:   master.name   ?? undefined,
                    age:    master.age    ?? undefined,
                    gender: master.gender ?? undefined,
                  } : undefined}
                  onComplete={handleProfile}
                />
                {submitError && (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}
              </>
            )}

            {step === 'entering' && (
              <EnteringStep
                venueName={venue.name}
                onAbort={() => { setStep('profile'); setSubmitError('Took too long. Try again — check your network.') }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
