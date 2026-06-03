import { QrCode, MapPin, Camera, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

const STEPS = [
  {
    number: '01',
    icon: QrCode,
    title: 'Scan the QR at your table',
    description: 'Every bar, festival, gym, or event has WIA QR codes on its tables, walls, and entrance. The QR is the only way in.',
    example: '◼︎ Scan to enter this room',
    color: 'text-wia-purple',
    border: 'border-wia-purple/20',
    bg: 'bg-wia-purple/10',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'You must physically be there',
    description: 'Location is verified in real time. You can only join if you\'re within 50 meters of the venue. No fake presence.',
    example: '✓ You\'re 23m from Beach Bar Tel Aviv',
    color: 'text-wia-cyan',
    border: 'border-wia-cyan/20',
    bg: 'bg-wia-cyan/10',
  },
  {
    number: '03',
    icon: Camera,
    title: 'Take a live selfie to appear',
    description: 'Capture your real-time selfie right now, at this moment. No gallery uploads. This creates authentic, live identity.',
    example: '📸 Taken just now at 23:14',
    color: 'text-wia-pink',
    border: 'border-wia-pink/20',
    bg: 'bg-wia-pink/10',
  },
  {
    number: '04',
    icon: Users,
    title: 'See who\'s around right now',
    description: 'Discover the live social layer. See everyone present, what they\'re up to, and connect. Send waves. Make moments.',
    example: '14 people here right now →',
    color: 'text-wia-green',
    border: 'border-wia-green/20',
    bg: 'bg-wia-green/10',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wia-surface/50 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wia-ink/15 bg-white/5 text-wia-ink/50 text-sm mb-6">
            How it works
          </div>
          <h2 className="font-display text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-wia-ink">Simple rules.</span>
            <br />
            <span className="gradient-text">Powerful social energy.</span>
          </h2>
          <p className="text-wia-ink/50 text-xl max-w-2xl mx-auto">
            Four steps to transform any physical place into a live social experience.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <GlassCard
              key={step.number}
              className="p-6 space-y-4 group hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Number + icon */}
              <div className="flex items-start justify-between">
                <span className={`text-5xl font-display font-bold opacity-20 ${step.color}`}>
                  {step.number}
                </span>
                <div className={`p-3 rounded-xl ${step.bg} border ${step.border}`}>
                  <step.icon size={20} className={step.color} />
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-display font-semibold text-lg text-wia-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-wia-ink/50 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Example */}
              <div className={`px-3 py-2 rounded-lg ${step.bg} border ${step.border}`}>
                <span className={`text-xs font-mono ${step.color}`}>{step.example}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Connector line (desktop only) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
