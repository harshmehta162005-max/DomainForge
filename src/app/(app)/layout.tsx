import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/?auth=required")
  }

  // Fetch display_name and avatar_url
  const { data: settings } = await supabase
    .from("user_settings")
    .select("display_name, avatar_url")
    .eq("user_id", user.id)
    .single()

  const firstName = user.email!.split("@")[0].split(".")[0]
  const defaultName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const displayName = settings?.display_name || defaultName
  const avatarUrl = settings?.avatar_url || null

  return (
    <DashboardShell userEmail={user.email} userDisplayName={displayName} userAvatarUrl={avatarUrl}>
      {children}
    </DashboardShell>
  )
}
