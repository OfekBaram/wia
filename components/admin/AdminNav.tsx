'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, LogOut, BarChart2 } from 'lucide-react'
import { useAdminRole } from '@/lib/hooks/useAdminRole'
import { signOut } from '@/lib/auth'

const BASE_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
]

export function AdminNav() {
  const pathname = usePathname()
  const { me } = useAdminRole()
  const superAdmin = me?.role === 'super_admin'

  const links = [
    ...BASE_LINKS,
    ...(superAdmin ? [{ href: '/admin/venues/new', label: 'New venue',  icon: Plus      }] : []),
    ...(superAdmin ? [{ href: '/admin/analytics',  label: 'Analytics',  icon: BarChart2 }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-wia-ink/10 glass-strong">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2 group shrink-0">
          <span className="text-lg font-display font-bold tracking-tight gradient-text">WIA</span>
          <span className="text-wia-ink/55 text-xs uppercase tracking-wider hidden sm:inline">{superAdmin ? 'admin' : 'venue'}</span>
        </Link>

        <nav className="flex items-center gap-1 ml-2">
          {links.map(link => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-wia-ink'
                    : 'text-wia-ink/50 hover:text-wia-ink hover:bg-white/5'
                }`}
              >
                <link.icon size={14} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-wia-ink/60 hover:text-wia-ink/70 transition-colors hidden sm:inline"
          >
            View public site →
          </Link>
          {me && (
            <div className="flex items-center gap-2 pl-3 border-l border-wia-ink/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-wia-ink truncate max-w-[160px]">{me.email}</div>
                <div className="text-[10px] uppercase tracking-wider text-wia-purple">{superAdmin ? 'Admin' : 'Venue owner'}</div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-wia-ink/60 hover:text-wia-ink hover:bg-white/5 transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
