"use client"

import { cn } from "@/lib/utils"
import { Crown, Calendar, Clock, AtSign } from "lucide-react"
import type { Profile } from "@/types/user"

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  avatarUrl,
  displayName,
  email,
  size = "lg",
}: {
  avatarUrl: string | null
  displayName: string | null
  email: string
  size?: "lg" | "sm"
}) {
  const initials = (() => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/)
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : displayName.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  })()

  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm"

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName ?? email}
        className={cn("rounded-full object-cover flex-shrink-0 ring-2 ring-zinc-700", dim)}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 font-semibold font-mono tracking-tight",
        "bg-zinc-800 border border-zinc-700 text-zinc-300 ring-2 ring-zinc-700",
        dim
      )}
    >
      {initials}
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "relative overflow-hidden flex flex-col items-center gap-1.5 px-5 py-4 border rounded-[6px] min-w-[110px] transition-all flex-1",
      highlight 
        ? "bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
    )}>
      <span
        className={cn(
          "text-xl font-bold font-mono tracking-tight",
          highlight ? "text-cyan-400" : "text-zinc-100"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-zinc-500 whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── ProfileHero ──────────────────────────────────────────────────────────────

interface ProfileHeroProps {
  profile: Profile
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  const displayName = profile.display_name ?? profile.email.split("@")[0]

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const lastSeen = profile.last_sign_in_at
    ? new Date(profile.last_sign_in_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      {/* Top strip */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-500/60 via-cyan-400/30 to-transparent" />

      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <Avatar
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            email={profile.email}
            size="lg"
          />

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-zinc-100 truncate">{displayName}</h2>
              {/* Plan Badge */}
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border",
                profile.plan === "pro" 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
              )}>
                {profile.plan === "pro" && <Crown className="h-3 w-3 -ml-0.5" strokeWidth={2.5} />}
                {profile.plan === "pro" ? "PRO" : "FREE"}
              </span>
            </div>

            {/* Username */}
            {profile.username && (
              <div className="flex items-center gap-1 mt-0.5">
                <AtSign className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
                <span className="text-sm text-zinc-400 font-mono">{profile.username}</span>
              </div>
            )}

            {/* Email */}
            <p className="text-sm text-zinc-500 mt-1.5 flex items-center gap-2.5">
              {profile.email}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                Joined {joinDate}
              </span>
              {lastSeen && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  Last seen {lastSeen}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-6 w-full">
          <StatChip label="Watched" value={profile.watchlist_count} />
          <StatChip label="Shortlisted" value={profile.shortlist_count} />
          <StatChip label="Generated" value={profile.generation_count} />
        </div>
      </div>
    </div>
  )
}
