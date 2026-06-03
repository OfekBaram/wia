import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LiveVenues } from '@/components/landing/LiveVenues'
import { ForVenues } from '@/components/landing/ForVenues'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-wia-bg">
      <Nav />
      <Hero />
      <HowItWorks />
      <LiveVenues />
      <ForVenues />
      <Footer />
    </main>
  )
}
