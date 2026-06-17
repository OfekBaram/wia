'use client'

import type { PresenceProfile } from '@/lib/types'
import { Users, Sparkles, UserCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface VibeBarProps {
  presence: PresenceProfile[]
}

export function VibeBar({ presence }: VibeBarProps) {
  const { t } = useI18n()
  const total       = presence.length
  const justArrived = presence.filter(p => p.isNew).length
  const ages        = presence.map(p => p.age)
  const avgAge      = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0
  const minAge      = ages.length ? Math.min(...ages) : 0
  const maxAge      = ages.length ? Math.max(...ages) : 0

  const genderCounts = presence.reduce<Record<string, number>>((acc, p) => {
    acc[p.gender] = (acc[p.gender] ?? 0) + 1
    return acc
  }, {})

  const STATS = [
    {
      icon:  Users,
      label: t('vibe.hereNow'),
      value: total,
      sub:   justArrived > 0 ? t('vibe.justArrived', { count: justArrived }) : t('vibe.steady'),
      color: 'text-wia-green',
    },
    {
      icon:  Sparkles,
      label: t('vibe.ageRange'),
      value: `${minAge}–${maxAge}`,
      sub:   t('vibe.avg', { age: avgAge }),
      color: 'text-wia-purple',
    },
    {
      icon:  UserCircle,
      label: t('vibe.mix'),
      value:
        `${genderCounts.woman ?? 0}${t('vibe.w')} · ${genderCounts.man ?? 0}${t('vibe.m')}${
          genderCounts['non-binary']
            ? ` · ${genderCounts['non-binary']}${t('vibe.nb')}`
            : ''
        }`,
      sub: t('vibe.genderMix'),
      color: 'text-wia-pink',
    },
  ]

  return (
    <div className="glass rounded-2xl px-3 sm:px-5 py-3 grid grid-cols-3 gap-2 sm:gap-4">
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col items-center text-center gap-1.5 sm:flex-row sm:items-center sm:text-start sm:gap-3 min-w-0">
          <div className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}>
            <s.icon size={16} />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] uppercase tracking-wider text-wia-ink/55 leading-tight">
              {s.label}
            </div>
            <div className="font-display font-bold text-wia-ink text-sm sm:text-lg leading-tight truncate">
              {s.value}
            </div>
            <div className="text-[10px] text-wia-ink/60 truncate">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
