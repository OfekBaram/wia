'use client'

import type { PresenceProfile } from '@/lib/types'
import { Users, Sparkles, UserCircle } from 'lucide-react'

interface VibeBarProps {
  presence: PresenceProfile[]
}

export function VibeBar({ presence }: VibeBarProps) {
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
      label: 'Here now',
      value: total,
      sub:   justArrived > 0 ? `+${justArrived} just arrived` : 'steady',
      color: 'text-wia-green',
    },
    {
      icon:  Sparkles,
      label: 'Age range',
      value: `${minAge}–${maxAge}`,
      sub:   `avg ${avgAge}`,
      color: 'text-wia-purple',
    },
    {
      icon:  UserCircle,
      label: 'Mix',
      value:
        `${genderCounts.woman ?? 0}W · ${genderCounts.man ?? 0}M${
          genderCounts['non-binary']
            ? ` · ${genderCounts['non-binary']}NB`
            : ''
        }`,
      sub: 'gender mix',
      color: 'text-wia-pink',
    },
  ]

  return (
    <div className="glass rounded-2xl px-4 sm:px-5 py-3 grid grid-cols-3 gap-2 sm:gap-4">
      {STATS.map((s) => (
        <div key={s.label} className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}>
            <s.icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-wia-ink/55">
              {s.label}
            </div>
            <div className="font-display font-bold text-wia-ink text-base sm:text-lg leading-tight truncate">
              {s.value}
            </div>
            <div className="text-[10px] text-wia-ink/60 truncate">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
