"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Zap, Trash2, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/user"

// ─── UsageBar ─────────────────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const pct = Math.min((used / limit) * 100, 100)
  const isNearLimit = pct >= 80

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className={cn("font-mono", isNearLimit ? "text-amber-400" : "text-zinc-500")}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 95
              ? "bg-red-500"
              : pct >= 80
              ? "bg-amber-400"
              : "bg-cyan-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-100">Delete Account</h3>
            <p className="text-sm text-zinc-500 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-300">
            Are you absolutely sure? This will permanently delete your account, watchlist,
            shortlists, history, and all preferences.
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 rounded-[4px] text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-4 rounded-[4px] bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Yes, delete my account"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BillingPanel ─────────────────────────────────────────────────────────────

interface BillingPanelProps {
  profile: Profile
}

// Plan limits
const LIMITS = {
  free: { watchlist: 15, shortlist: 10, generations: 50 },
  pro: { watchlist: 500, shortlist: 200, generations: 9999 },
}

export function BillingPanel({ profile }: BillingPanelProps) {
  const router = useRouter()
  const plan = profile.plan === "pro" ? "pro" : "free"
  const limits = LIMITS[plan]

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await fetch("/api/account", { method: "DELETE" })
    if (res.ok) {
      router.push("/")
      router.refresh()
    } else {
      alert("Failed to delete account. Please try again or contact support.")
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">Current Plan</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                  plan === "pro"
                    ? "bg-cyan-950 border border-cyan-800"
                    : "bg-zinc-800 border border-zinc-700"
                )}
              >
                {plan === "pro" ? (
                  <Crown className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
                ) : (
                  <Zap className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  {plan === "pro" ? "DomainForge Pro" : "Free Plan"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {plan === "pro"
                    ? "Full access to all Pro features"
                    : "Limited watchlist, shortlist, and generations"}
                </p>
              </div>
            </div>

            {plan === "free" && (
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98] flex-shrink-0"
              >
                <Crown className="h-3.5 w-3.5" strokeWidth={2} />
                Upgrade to Pro
              </Link>
            )}
          </div>

          {plan === "pro" && (
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-800 px-3 py-2 rounded-[4px]">
              Billing history and invoice management coming soon with Stripe integration.
            </div>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">Usage</h2>
        </div>
        <div className="px-5 py-5 space-y-5">
          <UsageBar
            label="Watchlist"
            used={profile.watchlist_count}
            limit={limits.watchlist}
          />
          <UsageBar
            label="Shortlist"
            used={profile.shortlist_count}
            limit={limits.shortlist}
          />
          <UsageBar
            label="Generations (all time)"
            used={profile.generation_count}
            limit={plan === "pro" ? 9999 : 50}
          />
        </div>
      </div>

      {/* Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">Export</h2>
        </div>
        <div className="px-5 py-5 flex items-center gap-3">
          <a
            href="/api/export-csv"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Export CSV
          </a>
          <a
            href="/api/export-account"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Export account JSON
          </a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-zinc-900 border border-red-900/30 rounded-[4px] overflow-hidden">
        <div className="px-5 py-3 border-b border-red-900/30">
          <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
        </div>
        <div className="px-5 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-200">Delete account</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Permanently delete your account and all associated data
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-950 border border-red-900 text-sm text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-colors duration-150"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Delete account
          </button>
        </div>
      </div>

      <DeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
