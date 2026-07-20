"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { User, Bell, Shield, CreditCard, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProfileTab = "overview" | "account" | "security" | "billing"

const TABS: { id: ProfileTab; label: string; Icon: React.ElementType }[] = [
  { id: "overview",       label: "Overview",       Icon: LayoutDashboard },
  { id: "account",        label: "Account",        Icon: User },
  { id: "security",       label: "Security",       Icon: Shield },
  { id: "billing",        label: "Billing",        Icon: CreditCard },
]

interface ProfileShellProps {
  children: React.ReactNode
  activeTab: ProfileTab
}

export function ProfileShell({ children, activeTab }: ProfileShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToTab = useCallback(
    (tab: ProfileTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === "overview") {
        params.delete("tab")
      } else {
        params.set("tab", tab)
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="px-3 sm:px-6 py-8 max-w-[900px] mx-auto space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Profile</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your identity, preferences, and account</p>
      </div>

      {/* Tab bar — grid-cols-4 so all tabs share width equally, no scroll ever */}
      <div className="grid grid-cols-4 border-b border-zinc-800">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => goToTab(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 h-10 text-sm border-b-[2px] transition-all duration-150 relative -mb-px px-1",
                isActive
                  ? "border-cyan-400 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-cyan-400" : "text-zinc-600")} strokeWidth={1.5} />
              {/* Hide label text on very small screens (< ~360px) to keep tabs from wrapping */}
              <span className="hidden min-[320px]:inline truncate text-xs sm:text-sm">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Active tab content */}
      <div>{children}</div>
    </div>
  )
}
