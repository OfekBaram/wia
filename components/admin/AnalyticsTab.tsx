'use client'

import { useEffect, useState } from 'react'
import { Users, Clock, Heart, MessageCircle, QrCode, TrendingUp, BarChart2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface AnalyticsData {
  totalVisitors:  number
  visitorsToday:  number
  visitorsWeek:   number
  avgSessionMin:  number | null
  avgAge:         number | null
  genderCounts:   Record<string, number>
  scanCount:      number
  peakCount:      number
  totalLikes:     number
  totalMessages:  number
  dailySeries:    [string, number][]
}

interface Props { venueSlug: string }

function Stat({ icon: Icon, label, value, sub, color = 'text-wia-purple' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-wia-ink leading-tight">{value}</div>
        <div className="text-xs font-medium text-wia-ink/70">{label}</div>
        {sub && <div className="text-[11px] text-wia-ink/45 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

const GENDER_LABEL_KEY: Record<string, string> = {
  woman: 'tab.gWomen', man: 'tab.gMen', 'non-binary': 'tab.gNonBinary', unspecified: 'tab.gUnspecified',
}
const GENDER_COLOR: Record<string, string> = {
  woman: 'bg-wia-pink', man: 'bg-wia-cyan', 'non-binary': 'bg-wia-purple', unspecified: 'bg-wia-ink/20',
}

export function AnalyticsTab({ venueSlug }: Props) {
  const { t } = useI18n()
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/venues/${encodeURIComponent(venueSlug)}/analytics`, {
      credentials: 'include', cache: 'no-store',
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [venueSlug])

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }
  if (!data) return <div className="py-12 text-center text-wia-ink/50 text-sm">{t("tab.cantLoad")}</div>

  const totalGender = Object.values(data.genderCounts).reduce((a, b) => a + b, 0)

  // Mini bar chart for daily visitors
  const maxDay = Math.max(...data.dailySeries.map(([, n]) => n), 1)

  return (
    <div className="space-y-6">
      {/* Key stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat icon={Users}       label={t("tab.totalVisitors")}   value={data.totalVisitors}  color="text-wia-purple" />
        <Stat icon={Users}       label={t("tab.today")}            value={data.visitorsToday}  color="text-wia-green"  />
        <Stat icon={Users}       label={t("tab.thisWeek")}        value={data.visitorsWeek}   color="text-wia-cyan"   />
        <Stat icon={QrCode}      label={t("tab.totalScans")}      value={data.scanCount}      color="text-wia-pink"   />
        <Stat icon={TrendingUp}  label={t("tab.peakCount")}       value={data.peakCount}      color="text-wia-purple" />
        <Stat icon={Clock}       label={t("tab.avgSession")}      value={data.avgSessionMin !== null ? `${data.avgSessionMin}m` : '—'} color="text-wia-cyan" sub={data.avgSessionMin !== null ? undefined : t("tab.noSessions")} />
        <Stat icon={Heart}       label={t("tab.totalLikes")}      value={data.totalLikes}     color="text-wia-pink"   />
        <Stat icon={MessageCircle} label={t("tab.messagesSent")}  value={data.totalMessages}  color="text-wia-purple" />
        <Stat icon={BarChart2}   label={t("tab.avgAge")}          value={data.avgAge ?? '—'}  color="text-wia-cyan"   />
      </div>

      {/* Gender breakdown */}
      {totalGender > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-display font-semibold text-wia-ink mb-4">{t("tab.genderBreakdown")}</h3>
          <div className="space-y-2.5">
            {Object.entries(data.genderCounts).sort(([,a],[,b]) => b - a).map(([gender, count]) => (
              <div key={gender} className="flex items-center gap-3">
                <div className="w-24 text-xs text-wia-ink/60 shrink-0">{GENDER_LABEL_KEY[gender] ? t(GENDER_LABEL_KEY[gender]) : gender}</div>
                <div className="flex-1 h-2 rounded-full bg-wia-ink/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${GENDER_COLOR[gender] ?? 'bg-wia-purple'}`}
                    style={{ width: `${Math.round((count / totalGender) * 100)}%` }}
                  />
                </div>
                <div className="w-12 text-xs text-wia-ink/60 text-end shrink-0">
                  {count} ({Math.round((count / totalGender) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Daily visitors chart */}
      {data.dailySeries.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-display font-semibold text-wia-ink mb-4">{t("tab.last30")}</h3>
          <div className="flex items-end gap-1 h-24">
            {data.dailySeries.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-wia-purple to-wia-pink opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.round((count / maxDay) * 100)}%`, minHeight: count > 0 ? 4 : 0 }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-wia-ink text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {day.slice(5)}: {count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-wia-ink/40 mt-1">
            <span>{data.dailySeries[0]?.[0]?.slice(5)}</span>
            <span>{data.dailySeries[data.dailySeries.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </GlassCard>
      )}

      {data.totalVisitors === 0 && (
        <div className="py-12 text-center text-wia-ink/50 text-sm">
          {t('tab.noData')}
        </div>
      )}
    </div>
  )
}
