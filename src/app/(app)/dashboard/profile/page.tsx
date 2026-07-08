import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProfileShell } from "@/components/profile/ProfileShell"
import { ProfileHero } from "@/components/profile/ProfileHero"
import { AccountForm } from "@/components/profile/AccountForm"
import { NotificationsForm } from "@/components/profile/NotificationsForm"
import { SecurityPanel } from "@/components/profile/SecurityPanel"
import { BillingPanel } from "@/components/profile/BillingPanel"
import { DomainActivityPanel } from "@/components/profile/DomainActivityPanel"
import type { Profile } from "@/types/user"
import type { ProfileTab } from "@/components/profile/ProfileShell"
import { ClassicLoader } from "@/components/ui/ClassicLoader"

export const metadata: Metadata = {
  title: "Profile — DomainForge",
  description: "Manage your DomainForge identity, preferences, billing, and account security.",
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getProfileData(): Promise<{
  profile: Profile
  watchlistPreview: { id: string; domain: string; status: string; score: number }[]
  recentGenerations: { id: string; domain: string; ts: string }[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthenticated")
  }

  // Run all queries in parallel
  const [settingsRes, watchlistRes, shortlistRes, generationsRes, watchlistPreviewRes, recentGenRes] =
    await Promise.all([
      supabase
        .from("user_settings")
        .select(
          "plan, display_name, avatar_url, bio, username, notif_available, notif_expiry, notif_price, weekly_digest"
        )
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("watchlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("shortlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("activity_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_type", "domain_generated"),
      supabase
        .from("watchlist")
        .select("id, domain, status, score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("activity_history")
        .select("id, domain, created_at")
        .eq("user_id", user.id)
        .eq("event_type", "domain_generated")
        .order("created_at", { ascending: false })
        .limit(6),
    ])

  const settings = settingsRes.data

  const profile: Profile = {
    email: user.email ?? "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    provider: (user.app_metadata?.provider as string) ?? "email",
    plan: settings?.plan ?? "free",
    display_name: settings?.display_name ?? null,
    avatar_url: settings?.avatar_url ?? null,
    bio: settings?.bio ?? null,
    username: settings?.username ?? null,
    notif_available: settings?.notif_available ?? true,
    notif_expiry: settings?.notif_expiry ?? true,
    notif_price: settings?.notif_price ?? false,
    weekly_digest: settings?.weekly_digest ?? true,
    watchlist_count: watchlistRes.count ?? 0,
    shortlist_count: shortlistRes.count ?? 0,
    generation_count: generationsRes.count ?? 0,
  }

  const watchlistPreview = (watchlistPreviewRes.data ?? []).map((r) => ({
    id: r.id as string,
    domain: r.domain as string,
    status: (r.status as string) ?? "unknown",
    score: (r.score as number) ?? 0,
  }))

  const recentGenerations = (recentGenRes.data ?? []).map((r) => ({
    id: r.id as string,
    domain: r.domain as string,
    ts: r.created_at as string,
  }))

  return { profile, watchlistPreview, recentGenerations }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { tab } = await searchParams
  const activeTab = (["overview", "account", "notifications", "security", "billing"].includes(
    tab ?? ""
  )
    ? tab
    : "overview") as ProfileTab

  const { profile, watchlistPreview, recentGenerations } = await getProfileData()

  const tabContent = (() => {
    switch (activeTab) {
      case "account":
        return <AccountForm profile={profile} />
      case "notifications":
        return <NotificationsForm profile={profile} />
      case "security":
        return <SecurityPanel profile={profile} />
      case "billing":
        return <BillingPanel profile={profile} />
      default:
        // overview
        return (
          <div className="space-y-6">
            <ProfileHero profile={profile} />
            <DomainActivityPanel
              watchlistPreview={watchlistPreview}
              recentGenerations={recentGenerations}
              plan={profile.plan}
            />
          </div>
        )
    }
  })()

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <ClassicLoader />
        </div>
      }
    >
      <ProfileShell activeTab={activeTab}>{tabContent}</ProfileShell>
    </Suspense>
  )
}
