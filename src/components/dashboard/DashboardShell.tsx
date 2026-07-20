"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { ToastProvider } from "@/components/ui/Toast"

interface DashboardShellProps {
  children: React.ReactNode
  userEmail?: string | null
  userDisplayName?: string | null
  userAvatarUrl?: string | null
}

const SIDEBAR_STORAGE_KEY = "domainforge-sidebar-collapsed"

export function DashboardShell({ children, userEmail, userDisplayName, userAvatarUrl }: DashboardShellProps) {
  // Lazy initializer reads localStorage synchronously on mount — no effect needed.
  // typeof window guard prevents SSR errors in Next.js.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })

  // Mobile drawer is separate from the desktop collapse state
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Close mobile nav on route change / resize past md
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileNavOpen(false)
    }
    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileNavOpen])

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        {/* ── Mobile backdrop overlay ─────────────────────────────────── */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-zinc-950/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar (desktop: inline rail; mobile: fixed drawer) ────── */}
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          userEmail={userEmail}
          userAvatarUrl={null}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        {/* ── Main content area ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            userEmail={userEmail}
            userDisplayName={userDisplayName}
            userAvatarUrl={userAvatarUrl}
            onHamburgerClick={() => setMobileNavOpen(prev => !prev)}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
