import Link from 'next/link'
import { TrendingUp, Users, Repeat, Star, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

const BENEFITS = [
  {
    icon: Users,
    title: 'Live social energy',
    description: 'Transform your venue into a live social hub. Guests discover each other organically.',
    color: 'text-wia-purple',
    bg: 'bg-wia-purple/10',
    border: 'border-wia-purple/20',
  },
  {
    icon: Repeat,
    title: 'Repeat visits',
    description: 'People come back because the social experience is different every time.',
    color: 'text-wia-pink',
    bg: 'bg-wia-pink/10',
    border: 'border-wia-pink/20',
  },
  {
    icon: TrendingUp,
    title: 'Real-time insights',
    description: 'See peak hours, social engagement, and vibe metrics for your venue.',
    color: 'text-wia-cyan',
    bg: 'bg-wia-cyan/10',
    border: 'border-wia-cyan/20',
  },
  {
    icon: Star,
    title: 'Premium branding',
    description: 'Your venue becomes known as the place where real social connections happen.',
    color: 'text-wia-amber',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

const VENUE_TYPES = [
  'Bars & Clubs', 'Festivals', 'Universities', 'Coworking',
  'Hotels', 'Airports', 'Gyms', 'Cafes', 'Conferences', 'Beaches',
]

export function ForVenues() {
  return (
    <section id="venues" className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wia-surface/40 to-transparent" />
      <div className="orb orb-purple w-[600px] h-[600px] -bottom-32 -right-32 animate-glow" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wia-ink/15 bg-white/5 text-wia-ink/50 text-sm mb-6">
              For venues & businesses
            </div>
            <h2 className="font-display text-5xl font-bold text-wia-ink mb-6 leading-tight">
              Make your place{' '}
              <span className="gradient-text">socially alive.</span>
            </h2>
            <p className="text-wia-ink/50 text-lg leading-relaxed mb-8">
              WIA turns your venue into a digital-physical social hub.
              Get a unique URL, display it at your entrance, and watch your guests discover each other.
            </p>

            {/* Venue types */}
            <div className="flex flex-wrap gap-2 mb-10">
              {VENUE_TYPES.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 rounded-full text-sm glass border-wia-ink/15 text-wia-ink/50"
                >
                  {type}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href="mailto:venues@wia.com"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-purple-500/20"
              >
                Get your venue on WIA
                <ArrowRight size={16} />
              </a>
              <span className="text-wia-ink/55 text-sm">Free to start</span>
            </div>
          </div>

          {/* Right — benefits grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((benefit) => (
              <GlassCard key={benefit.title} className="p-6 space-y-3">
                <div className={`w-10 h-10 rounded-xl ${benefit.bg} border ${benefit.border} flex items-center justify-center`}>
                  <benefit.icon size={20} className={benefit.color} />
                </div>
                <h3 className="font-display font-semibold text-wia-ink">{benefit.title}</h3>
                <p className="text-sm text-wia-ink/50 leading-relaxed">{benefit.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
