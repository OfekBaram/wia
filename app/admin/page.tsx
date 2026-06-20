'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRight, QrCode, Sparkles, Trash2, Mail } from 'lucide-react'
import { VENUE_EMOJI } from '@/lib/mock-data'
import type { Location } from '@/lib/types'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAdminRole } from '@/lib/hooks/useAdminRole'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface VenueRow {
  id:           string
  slug:         string
  name:         string
  tagline:      string
  category:     Location['category']
  coordinates:  { lat: number; lng: number }
  radiusMeters: number
  isActive:     boolean
  isPremium:    boolean
  liveCount:    number
  createdAt:    string
  /** Owner's email — only sent to super admins. */
  ownerEmail?:  string | null
}

function StatTile({
  label, value, sub, color = 'text-wia-purple',
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <GlassCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-wia-ink/55 mb-1">{label}</div>
      <div className={`font-display text-3xl font-bold ${color} leading-none mb-1`}>{value}</div>
      {sub && <div className="text-xs text-wia-ink/60">{sub}</div>}
    </GlassCard>
  )
}

function Row({ venue, onDelete }: { venue: VenueRow; onDelete?: (slug: string) => void }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const emoji = VENUE_EMOJI[venue.category as keyof typeof VENUE_EMOJI] ?? '📍'
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!(await confirm({ message: t('dash.deleteConfirm', { name: venue.name }), danger: true }))) return
    setDeleting(true)
    await fetch(`/api/admin/venues/${encodeURIComponent(venue.slug)}`, {
      method: 'DELETE', credentials: 'include',
    })
    onDelete?.(venue.slug)
  }

  return (
    <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4 group">
      <Link href={`/admin/venues/${venue.slug}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-display font-semibold text-wia-ink">{venue.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-wia-ink/55 capitalize">
              {venue.category}
            </span>
          </div>
          <div className="text-xs text-wia-ink/60 font-mono truncate">wia.com/{venue.slug}</div>
          {venue.ownerEmail && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-wia-ink/55 truncate">
              <Mail size={11} className="shrink-0 text-wia-ink/40" />
              <span className="truncate">{venue.ownerEmail}</span>
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <LiveBadge count={venue.liveCount} size="sm" />
        </div>
        <ArrowRight size={16} className="text-wia-ink/55 group-hover:text-wia-ink group-hover:translate-x-0.5 transition-all" />
      </Link>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 p-2 rounded-xl text-wia-ink/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
          title={t('dash.deleteVenue')}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const { isSuperAdmin, isVenueOwner } = useAdminRole()

  const [venues,  setVenues]  = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/admin/venues/list', { credentials: 'include', cache: 'no-store' })
        if (res.status === 401) { window.location.assign('/admin/login'); return }
        if (!res.ok) {
          if (!cancelled) { setVenues([]); setLoading(false) }
          return
        }
        const { role, venues: list } = await res.json()
        // A venue owner is capped at one venue — skip this list page and send
        // them straight to it. Owners with no venue yet, and super admins, stay
        // here (create-venue prompt / full all-venues list respectively).
        if (role === 'venue_owner' && Array.isArray(list) && list.length === 1) {
          router.replace(`/admin/venues/${list[0].slug}`)
          return // leave `loading` true so the spinner holds through navigation
        }
        if (!cancelled) { setVenues(list ?? []); setLoading(false) }
      } catch {
        if (!cancelled) { setVenues([]); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [router])

  const totalLive = venues.reduce((sum, v) => sum + v.liveCount, 0)
  const hasVenue  = venues.length > 0

  // Hold a clean spinner until we've decided whether to render or redirect —
  // keeps a venue owner from ever flashing this in-between list page.
  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-wia-purple/30 border-t-wia-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-wia-ink mb-1">
            {isVenueOwner && !hasVenue ? t('dash.welcome') : t('dash.backoffice')}
          </h1>
          <p className="text-wia-ink/55 text-sm">
            {isSuperAdmin
              ? t('dash.subSuper')
              : hasVenue
                ? t('dash.subOwnerHas')
                : t('dash.subOwnerNew')}
          </p>
        </div>

        {(isSuperAdmin || (isVenueOwner && !hasVenue)) && (
          <Link
            href="/admin/venues/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus size={16} />
            {isSuperAdmin ? t('dash.addVenue') : t('dash.createMyVenue')}
          </Link>
        )}
      </div>

      {(isSuperAdmin || hasVenue) && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile
            label={isSuperAdmin ? t('dash.activeVenues') : t('dash.yourVenue')}
            value={venues.length}
            sub={isSuperAdmin ? t('dash.platformWide') : t('dash.liveAccepting')}
            color="text-wia-purple"
          />
          <StatTile label={t('dash.peopleLiveNow')} value={totalLive} sub={t('dash.acrossVenues')} color="text-wia-green" />
          {isSuperAdmin && <StatTile label={t('dash.status')} value="OK" sub={t('dash.supaConnected')} color="text-wia-cyan" />}
        </div>
      )}

      <div>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-wia-ink">
            {isSuperAdmin ? t('dash.allVenues') : t('dash.yourVenue')}
          </h2>
          {venues.length > 0 && (
            <span className="text-xs text-wia-ink/60">{t('dash.total', { count: venues.length })}</span>
          )}
        </div>

        {!hasVenue && (
          <GlassCard className="p-8 text-center border-dashed border-wia-ink/15">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-wia-purple/10 border border-wia-purple/30 mb-3 items-center justify-center">
              {isVenueOwner ? <Sparkles size={20} className="text-wia-purple" /> : <QrCode size={20} className="text-wia-purple" />}
            </div>
            <h3 className="font-display font-semibold text-wia-ink mb-1">
              {isVenueOwner ? t('dash.setupVenue') : t('dash.createFirst')}
            </h3>
            <p className="text-sm text-wia-ink/55 mb-4 max-w-sm mx-auto">
              {isVenueOwner ? t('dash.emptyOwner') : t('dash.emptyAdmin')}
            </p>
            <Link
              href="/admin/venues/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wia-purple/20 border border-wia-purple/40 text-wia-purple text-sm font-medium hover:bg-wia-purple/30 transition-all"
            >
              <Plus size={14} />
              {isVenueOwner ? t('dash.createMyVenue') : t('dash.newVenue')}
            </Link>
          </GlassCard>
        )}

        {hasVenue && (
          <div className="space-y-2">
            {venues.map(v => (
              <Row
                key={v.id}
                venue={v}
                onDelete={isSuperAdmin ? slug => setVenues(vs => vs.filter(x => x.slug !== slug)) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
