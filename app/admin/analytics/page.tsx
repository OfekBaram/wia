'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { VENUE_EMOJI } from '@/lib/mock-data'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAdminRole } from '@/lib/hooks/useAdminRole'

interface VenueRow {
  id:            string
  slug:          string
  name:          string
  category:      string
  isActive:      boolean
  scanCount:     number
  peakCount:     number
  liveNow:       number
  visitorsToday: number
  totalVisitors: number
}

export default function AnalyticsDashboard() {
  const { isSuperAdmin, ready } = useAdminRole()
  const [venues,  setVenues]  = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics', { credentials: 'include', cache: 'no-store' })
      .then(r => r.json())
      .then(d => setVenues(d.venues ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (!ready) return null
  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-wia-ink/50">Super admin access required.</p>
      </div>
    )
  }

  const totals = venues.reduce((acc, v) => ({
    live:     acc.live     + v.liveNow,
    today:    acc.today    + v.visitorsToday,
    total:    acc.total    + v.totalVisitors,
    scans:    acc.scans    + v.scanCount,
  }), { live: 0, today: 0, total: 0, scans: 0 })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-wia-ink/50 hover:text-wia-ink transition-colors">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold text-wia-ink">Platform analytics</h1>
        <p className="text-wia-ink/50 text-sm mt-1">All venues across the platform.</p>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Live now',        value: totals.live,  color: 'text-wia-green'  },
          { label: 'Visitors today',  value: totals.today, color: 'text-wia-purple' },
          { label: 'Total visitors',  value: totals.total, color: 'text-wia-cyan'   },
          { label: 'Total scans',     value: totals.scans, color: 'text-wia-pink'   },
        ].map(s => (
          <GlassCard key={s.label} className="p-4 text-center">
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-wia-ink/60 mt-1">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Per-venue table */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-wia-ink/10">
          <h2 className="font-display font-semibold text-wia-ink">Venues</h2>
        </div>
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
          </div>
        ) : venues.length === 0 ? (
          <div className="py-12 text-center text-wia-ink/50 text-sm">No venues yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wia-ink/10 text-[11px] uppercase tracking-wider text-wia-ink/50">
                  <th className="px-5 py-3 text-left">Venue</th>
                  <th className="px-4 py-3 text-right">Live</th>
                  <th className="px-4 py-3 text-right">Today</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Peak</th>
                  <th className="px-4 py-3 text-right">Scans</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wia-ink/5">
                {venues.map(v => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{VENUE_EMOJI[v.category as keyof typeof VENUE_EMOJI] ?? '🏠'}</span>
                        <div>
                          <div className="font-medium text-wia-ink">{v.name}</div>
                          <div className="text-[11px] text-wia-ink/50 font-mono">{v.slug}</div>
                        </div>
                        {!v.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-wia-ink/10 text-wia-ink/50">inactive</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-semibold ${v.liveNow > 0 ? 'text-wia-green' : 'text-wia-ink/40'}`}>
                        {v.liveNow}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-wia-ink/70">{v.visitorsToday}</td>
                    <td className="px-4 py-3.5 text-right text-wia-ink/70">{v.totalVisitors}</td>
                    <td className="px-4 py-3.5 text-right text-wia-ink/70">{v.peakCount}</td>
                    <td className="px-4 py-3.5 text-right text-wia-ink/70">{v.scanCount}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/venues/${v.slug}?tab=analytics`}
                        className="inline-flex items-center gap-1 text-xs text-wia-purple/70 hover:text-wia-purple transition-colors"
                      >
                        Details <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
