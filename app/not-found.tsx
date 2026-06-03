import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-wia-bg flex flex-col items-center justify-center text-center px-6">
      <div className="orb orb-purple w-[400px] h-[400px] -top-32 -left-32 animate-glow fixed" />
      <div className="orb orb-pink w-[300px] h-[300px] bottom-0 right-0 animate-glow fixed" />

      <div className="relative z-10 space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-wia-purple/10 border border-wia-purple/30 flex items-center justify-center mx-auto">
          <MapPin size={36} className="text-wia-purple" />
        </div>

        <div>
          <h1 className="font-display text-5xl font-bold gradient-text mb-3">Not found.</h1>
          <p className="text-wia-ink/50 text-lg">
            This venue doesn&apos;t exist on WIA yet — or it&apos;s not active right now.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-wia-purple to-wia-pink text-white font-semibold hover:opacity-90 transition-all"
          >
            Back to WIA
          </Link>
          <Link
            href="/beach-bar-tel-aviv"
            className="px-6 py-3 rounded-xl glass border-wia-ink/15 text-wia-ink/60 hover:text-wia-ink transition-all"
          >
            Try the demo
          </Link>
        </div>
      </div>
    </div>
  )
}
