/**
 * Landing page Server Component wrapper.
 * Renders the auth-aware LandingNav (server) then passes the
 * client-side HomePage as a child — this is the correct Next.js App Router
 * pattern for mixing Server + Client components.
 */
import { LandingNav } from "@/components/layout/LandingNav"
import HomePageClient from "@/app/(public)/HomePageClient"

export default function LandingPage() {
  return (
    <div className="bg-[#0D0D0D] min-h-screen font-sans text-white overflow-hidden">
      <LandingNav />
      <HomePageClient />
    </div>
  )
}
