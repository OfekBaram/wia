import { cn } from '@/lib/cn'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  strong?: boolean
  style?: React.CSSProperties
}

export function GlassCard({ children, className, hover, strong, style }: GlassCardProps) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-2xl transition-all duration-300',
        strong ? 'glass-strong' : 'glass',
        hover && 'hover:bg-white/[0.07] hover:border-wia-ink/20 hover:scale-[1.02] cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
