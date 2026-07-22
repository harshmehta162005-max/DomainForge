"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Wand2,
  Bookmark,
  Eye,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  userEmail?: string | null
  userAvatarUrl?: string | null
  /** Mobile-only: whether the drawer is slid in */
  mobileOpen?: boolean
  /** Mobile-only: close the drawer */
  onMobileClose?: () => void
}

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/generator",            label: "Generator",  Icon: Wand2 },
  { href: "/dashboard/shortlist",  label: "Shortlist",  Icon: Bookmark },
  { href: "/dashboard/watchlist",  label: "Watchlist",  Icon: Eye },
  { href: "/dashboard/bulk",       label: "Bulk Check", Icon: Layers },
  { href: "/dashboard/history",    label: "History",    Icon: History },
  { href: "/dashboard/insights",   label: "Insights",   Icon: BarChart3 },
] as const

// ─── Shared nav content (used by both mobile and desktop renders) ──────────────

function NavContent({
  collapsed,
  onToggle,
  onMobileClose,
  isMobile = false,
}: {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
  isMobile?: boolean
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Logo row */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-800 flex-shrink-0">
        <AnimatePresence mode="wait">
          {/* On mobile the drawer is always expanded; on desktop respect `collapsed` */}
          {(!collapsed || isMobile) && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <span className="h-2 w-2 sm:h-1.5 sm:w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span className="text-base sm:text-sm font-semibold tracking-tight text-zinc-100 whitespace-nowrap">
                Domain<span className="text-cyan-400">Forge</span>
              </span>
            </motion.div>
          )}
          {collapsed && !isMobile && (
            <motion.div
              key="dot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 block" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: close button; Desktop: collapse toggle */}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="h-11 w-11 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-6 w-6 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 flex-shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-1.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href)

            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed && !isMobile ? label : undefined}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    // min-h-11 (44px) touch target on all breakpoints for accessibility
                    "flex items-center gap-3 min-h-11 md:min-h-0 md:h-9 px-2 rounded-[4px] transition-colors duration-150 relative group",
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-cyan-400 rounded-full" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                    strokeWidth={1.5}
                  />
                  <AnimatePresence mode="wait">
                    {/* Desktop: respect collapsed; Mobile: always show label */}
                    {(!collapsed || isMobile) && (
                      <motion.span
                        key={label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="text-sm whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-zinc-800 flex-shrink-0 pb-safe">
        <Link
          href="/dashboard/settings"
          title={collapsed && !isMobile ? "Settings" : undefined}
          onClick={isMobile ? onMobileClose : undefined}
          className={cn(
            "flex items-center gap-3 min-h-11 md:min-h-0 md:h-9 px-2 rounded-[4px] transition-colors duration-150 relative group",
            pathname.startsWith("/dashboard/settings")
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
          )}
        >
          {/* Active indicator bar */}
          {pathname.startsWith("/dashboard/settings") && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-cyan-400 rounded-full" />
          )}
          <Settings
            className={cn(
              "h-4 w-4 flex-shrink-0",
              pathname.startsWith("/dashboard/settings") ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
            )}
            strokeWidth={1.5}
          />
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-sm whitespace-nowrap overflow-hidden"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop rail: inline flex column, hidden on mobile ──────────── */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-shrink-0 flex-col bg-zinc-900 border-r border-zinc-800 overflow-hidden relative z-10"
        style={{ willChange: "width" }}
      >
        <NavContent collapsed={collapsed} onToggle={onToggle} isMobile={false} />
      </motion.aside>

      {/* ── Mobile drawer: fixed, slides in from left ────────────────────── */}
      {/*
        Uses CSS transition instead of Framer Motion so it respects
        prefers-reduced-motion: reduce via the global CSS we added.
        w-64 (256px) fits comfortably on 320px viewport + 56px leftover.
      */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 overflow-hidden",
          "transform transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "motion-reduce:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <NavContent
          collapsed={false}
          onToggle={onToggle}
          onMobileClose={onMobileClose}
          isMobile={true}
        />
      </aside>
    </>
  )
}
