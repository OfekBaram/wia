'use client'

import { usePathname } from 'next/navigation'
import { AdminGate } from '@/components/admin/AdminGate'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Login page is public — no gate, no nav.
  if (pathname === '/admin/login') return <>{children}</>

  return (
    <AdminGate>
      <div className="min-h-screen bg-wia-bg">
        <AdminNav />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </AdminGate>
  )
}
