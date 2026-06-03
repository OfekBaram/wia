import Link from 'next/link'
import { LiveDot } from '@/components/ui/LiveBadge'

export function Footer() {
  return (
    <footer className="border-t border-wia-ink/10 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold gradient-text">WIA</span>
            <span className="text-wia-ink/50">·</span>
            <div className="flex items-center gap-2 text-sm text-wia-ink/60">
              <LiveDot />
              91 people live right now
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-wia-ink/55">
            <Link href="#" className="hover:text-wia-ink/60 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-wia-ink/60 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-wia-ink/60 transition-colors">Safety</Link>
            <Link href="/admin/login" className="hover:text-wia-ink/60 transition-colors">Venue admin</Link>
          </div>

          <div className="text-xs text-wia-ink/50">
            © 2026 WIA Platform · Who Is Around
          </div>
        </div>
      </div>
    </footer>
  )
}
