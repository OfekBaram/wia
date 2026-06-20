'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useI18n } from '@/lib/i18n/I18nProvider'

interface Visitor {
  userId:   string
  name:     string
  age:      number | null
  gender:   string | null
  email:    string | null
  joinedAt: string
}

interface Props { venueSlug: string }

const GENDER_LABEL_KEY: Record<string, string> = {
  woman: 'profile.gWoman', man: 'profile.gMan', 'non-binary': 'profile.gNonBinary', unspecified: 'profile.gUnspecified',
}

export function VisitorsTab({ venueSlug }: Props) {
  const { t, locale } = useI18n()
  const [visitors, setVisitors] = useState<Visitor[] | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`/api/admin/venues/${encodeURIComponent(venueSlug)}/visitors`, {
      credentials: 'include', cache: 'no-store',
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setVisitors(d?.visitors ?? null))
      .finally(() => setLoading(false))
  }, [venueSlug])

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }
  if (!visitors) return <div className="py-12 text-center text-wia-ink/50 text-sm">{t('venueDetail.visCantLoad')}</div>
  if (visitors.length === 0) return <div className="py-12 text-center text-wia-ink/50 text-sm">{t('venueDetail.visEmpty')}</div>

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const cell = 'px-3 py-2.5 text-sm text-wia-ink/80 whitespace-nowrap'
  const head = 'px-3 py-2.5 text-[11px] uppercase tracking-wider text-wia-ink/50 font-medium text-start whitespace-nowrap'

  return (
    <div className="space-y-3">
      <div className="text-xs text-wia-ink/55">{t('venueDetail.visCount', { count: visitors.length })}</div>
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-wia-ink/10">
                <th className={head}>{t('venueDetail.visName')}</th>
                <th className={head}>{t('venueDetail.visDate')}</th>
                <th className={head}>{t('venueDetail.visEmail')}</th>
                <th className={head}>{t('venueDetail.visAge')}</th>
                <th className={head}>{t('venueDetail.visGender')}</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => (
                <tr key={v.userId} className="border-b border-wia-ink/5 last:border-0 hover:bg-white/40 transition-colors">
                  <td className={`${cell} font-medium text-wia-ink`}>{v.name || '—'}</td>
                  <td className={cell}>{fmtDate(v.joinedAt)}</td>
                  <td className={`${cell} font-mono text-xs`}>{v.email || '—'}</td>
                  <td className={cell}>{v.age ?? '—'}</td>
                  <td className={cell}>{v.gender && GENDER_LABEL_KEY[v.gender] ? t(GENDER_LABEL_KEY[v.gender]) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
