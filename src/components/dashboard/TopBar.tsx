"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Bell, User, LogOut, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface TopBarProps {
  userEmail?: string | null
}

// ─── Command Palette ──────────────────────────────────────────────────────────

const COMMANDS = [
  { id: "generate", label: "New generation", shortcut: "G", href: "/" },
  { id: "watchlist", label: "Go to watchlist", shortcut: "W", href: "/dashboard/watchlist" },
  { id: "shortlist", label: "Go to shortlist", shortcut: "S", href: "/dashboard/shortlist" },
  { id: "insights", label: "View insights", shortcut: "I", href: "/dashboard/insights" },
] as const

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = useCallback((href: string) => {
    router.push(href)
    onClose()
  }, [router, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-32"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-[6px] overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b border-zinc-800">
          <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="flex-1 h-10 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="py-1.5 max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-xs text-zinc-600 text-center">No commands found</li>
          )}
          {filtered.map(cmd => (
            <li key={cmd.id}>
              <button
                onClick={() => handleSelect(cmd.href)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors duration-100 text-left"
              >
                <span>{cmd.label}</span>
                <kbd className="text-xs font-mono text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-[2px]">
                  {cmd.shortcut}
                </kbd>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar({ userEmail }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const displayEmail = userEmail
    ? `${userEmail[0]}***@${userEmail.split("@")[1]}`
    : null

  return (
    <>
      <header className="h-14 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-30">
        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          id="global-search-trigger"
          className="flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors duration-150 w-52"
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
          <span className="text-xs flex-1 text-left">Search commands…</span>
          <kbd className="text-xs font-mono bg-zinc-800 border border-zinc-700 px-1 rounded-[2px] text-zinc-600">
            ⌘K
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            id="notification-bell"
            className="relative h-8 w-8 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
            title="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={1.5} />
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </button>

          {/* User avatar */}
          <div className="relative">
            <button
              id="user-menu-toggle"
              onClick={() => setUserMenuOpen(prev => !prev)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-[4px] transition-colors duration-150",
                userMenuOpen
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-10 w-52 bg-zinc-900 border border-zinc-700 rounded-[6px] py-1 shadow-xl z-40 animate-fade-in"
                onBlur={() => setUserMenuOpen(false)}
              >
                {displayEmail && (
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="text-xs text-zinc-500 font-mono truncate">{displayEmail}</p>
                  </div>
                )}
                <button
                  onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings") }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-100"
                >
                  <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors duration-100"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command palette portal */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  )
}
