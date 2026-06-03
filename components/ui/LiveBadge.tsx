'use client'

import { cn } from '@/lib/cn'

interface LiveBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LiveBadge({ count, size = 'md', className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base',
        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      {count} live
    </span>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2.5 w-2.5', className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
    </span>
  )
}
