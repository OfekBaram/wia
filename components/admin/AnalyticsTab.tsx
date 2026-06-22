'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { Users, Clock, Heart, MessageCircle, QrCode, TrendingUp, BarChart2, Repeat } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useI18n } from '@/lib/i18n/I18nProvider'

type Range = 'today' | '7d' | '30d' | '90d'

interface AnalyticsData {
  range:       Range
  granularity: 'hour' | 'day' | 'week'
  kpis: {
    visitors: number; avgSessionMin: number | null; avgAge: number | null
    totalLikes: number; totalMessages: number; returningRate: number
    peakCount: number; scanCount: number
  }
  series:       { label: string; count: number }[]
  hourly:       { hour: number; label: string; count: number }[]
  ageBuckets:   { label: string; count: number }[]
  genderCounts: Record<string, number>
}

interface Props { venueSlug: string }

const PURPLE = '#8B5CF6', PINK = '#EC4899', CYAN = '#06B6D4', INK = '#1A1430', AXIS = '#9A93AD', GRID = '#EDEAF4'
const GENDER_COLOR: Record<string, string> = { woman: PINK, man: CYAN, 'non-binary': PURPLE, unspecified: '#BCB2AC' }
const GENDER_KEY: Record<string, string> = { woman: 'tab.gWomen', man: 'tab.gMen', 'non-binary': 'tab.gNonBinary', unspecified: 'tab.gUnspecified' }

function Stat({ icon: Icon, label, value, sub, color = 'text-wia-purple' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold text-wia-ink leading-tight">{value}</div>
        <div className="text-xs font-medium text-wia-ink/70">{label}</div>
        {sub && <div className="text-[11px] text-wia-ink/45 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ChartCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display font-semibold text-wia-ink">{title}</h3>
        {hint && <span className="text-[11px] text-wia-ink/45">{hint}</span>}
      </div>
      {children}
    </GlassCard>
  )
}

const tooltipStyle = {
  background: '#FFFFFF', border: '1px solid #EDEAF4', borderRadius: 12,
  fontSize: 12, color: INK, boxShadow: '0 8px 24px rgba(26,20,48,0.12)',
}

export function AnalyticsTab({ venueSlug }: Props) {
  const { t } = useI18n()
  const [range,   setRange]   = useState<Range>('30d')
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/venues/${encodeURIComponent(venueSlug)}/analytics?range=${range}`, {
      credentials: 'include', cache: 'no-store',
    })
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [venueSlug, range])

  const RANGES: { key: Range; label: string }[] = [
    { key: 'today', label: t('tab.rToday') },
    { key: '7d',    label: t('tab.r7d') },
    { key: '30d',   label: t('tab.r30d') },
    { key: '90d',   label: t('tab.r90d') },
  ]
  const granLabel = data ? t(data.granularity === 'hour' ? 'tab.perHour' : data.granularity === 'week' ? 'tab.perWeek' : 'tab.perDay') : ''

  return (
    <div className="space-y-5">
      {/* Timeframe control */}
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              range === r.key ? 'bg-white shadow text-wia-ink' : 'text-wia-ink/50 hover:text-wia-ink'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
        </div>
      )}

      {!loading && !data && (
        <div className="py-12 text-center text-wia-ink/50 text-sm">{t('tab.cantLoad')}</div>
      )}

      {!loading && data && (() => {
        const k = data.kpis
        const genderRows = Object.entries(data.genderCounts)
          .map(([g, value]) => ({ key: g, name: t(GENDER_KEY[g] ?? 'tab.gUnspecified'), value, color: GENDER_COLOR[g] ?? '#BCB2AC' }))
          .filter(r => r.value > 0)
        const noData = k.visitors === 0

        return (
          <div className="space-y-5">
            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat icon={Users}          label={t('tab.visitors')}      value={k.visitors}                                              color="text-wia-purple" />
              <Stat icon={Clock}          label={t('tab.avgSession')}    value={k.avgSessionMin !== null ? `${k.avgSessionMin}m` : '—'}  color="text-wia-cyan"   sub={k.avgSessionMin === null ? t('tab.noSessions') : undefined} />
              <Stat icon={Heart}          label={t('tab.totalLikes')}    value={k.totalLikes}                                            color="text-wia-pink"   />
              <Stat icon={MessageCircle}  label={t('tab.messagesSent')}  value={k.totalMessages}                                         color="text-wia-purple" />
              <Stat icon={Repeat}         label={t('tab.returningRate')} value={`${k.returningRate}%`}  sub={t('tab.allTime')}            color="text-wia-green"  />
              <Stat icon={TrendingUp}     label={t('tab.peakCount')}     value={k.peakCount}           sub={t('tab.allTime')}             color="text-wia-purple" />
              <Stat icon={QrCode}         label={t('tab.totalScans')}    value={k.scanCount}           sub={t('tab.allTime')}             color="text-wia-pink"   />
              <Stat icon={BarChart2}      label={t('tab.avgAge')}        value={k.avgAge ?? '—'}                                         color="text-wia-cyan"   />
            </div>

            {noData ? (
              <div className="py-12 text-center text-wia-ink/50 text-sm">{t('tab.noData')}</div>
            ) : (
              <>
                {/* Visitors over time */}
                <ChartCard title={t('tab.visitorsOverTime')} hint={granLabel}>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                      <AreaChart data={data.series} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={PURPLE} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={PURPLE} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                        <YAxis allowDecimals={false} stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={36} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: PURPLE, strokeOpacity: 0.2 }} />
                        <Area type="monotone" dataKey="count" name={t('tab.visitors')} stroke={PURPLE} strokeWidth={2.5} fill="url(#vGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Busiest hours */}
                <ChartCard title={t('tab.busiestHours')} hint={t('tab.byHourHint')}>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={data.hourly} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" stroke={AXIS} tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={1} />
                        <YAxis allowDecimals={false} stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={36} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: PURPLE, fillOpacity: 0.06 }} />
                        <Bar dataKey="count" name={t('tab.visitors')} fill={CYAN} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Age + Gender */}
                <div className="grid md:grid-cols-2 gap-5">
                  <ChartCard title={t('tab.ageDist')}>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <BarChart data={data.ageBuckets} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                          <CartesianGrid stroke={GRID} vertical={false} />
                          <XAxis dataKey="label" stroke={AXIS} tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
                          <YAxis allowDecimals={false} stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={36} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: PURPLE, fillOpacity: 0.06 }} />
                          <Bar dataKey="count" name={t('tab.visitors')} fill={PURPLE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <ChartCard title={t('tab.genderBreakdown')}>
                    <div style={{ width: '100%', height: 200 }} className="flex items-center">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={genderRows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {genderRows.map(r => <Cell key={r.key} fill={r.color} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 justify-center">
                      {genderRows.map(r => (
                        <span key={r.key} className="inline-flex items-center gap-1.5 text-xs text-wia-ink/60">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                          {r.name} · {r.value}
                        </span>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}
