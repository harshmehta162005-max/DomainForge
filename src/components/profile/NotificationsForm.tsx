"use client"

import { useState } from "react"
import { Check, Loader2, BellOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/user"

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors duration-200",
        checked ? "bg-cyan-400" : "bg-zinc-700"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-zinc-950 shadow transition-transform duration-200",
          checked && "translate-x-4"
        )}
      />
    </button>
  )
}

function Field({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-zinc-200">{label}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── NotificationsForm ────────────────────────────────────────────────────────

interface NotificationsFormProps {
  profile: Profile
}

export function NotificationsForm({ profile }: NotificationsFormProps) {
  const [notifAvailable, setNotifAvailable] = useState(profile.notif_available)
  const [notifExpiry, setNotifExpiry] = useState(profile.notif_expiry)
  const [notifPrice, setNotifPrice] = useState(profile.notif_price)
  const [notifWeekly, setNotifWeekly] = useState(profile.weekly_digest)
  const [frequency, setFrequency] = useState<"immediate" | "daily" | "weekly">("immediate")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubDone, setUnsubDone] = useState(false)

  const savePrefs = async (overrides?: {
    notif_available?: boolean
    notif_expiry?: boolean
    notif_price?: boolean
    weekly_digest?: boolean
  }) => {
    setSaving(true)
    setError(null)
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notif_available: overrides?.notif_available ?? notifAvailable,
        notif_expiry: overrides?.notif_expiry ?? notifExpiry,
        notif_price: overrides?.notif_price ?? notifPrice,
        weekly_digest: overrides?.weekly_digest ?? notifWeekly,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json() as { error?: string }
      setError(d.error ?? "Failed to save")
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleUnsubscribeAll = async () => {
    setUnsubscribing(true)
    setNotifAvailable(false)
    setNotifExpiry(false)
    setNotifPrice(false)
    setNotifWeekly(false)
    await savePrefs({
      notif_available: false,
      notif_expiry: false,
      notif_price: false,
      weekly_digest: false,
    })
    setUnsubscribing(false)
    setUnsubDone(true)
    setTimeout(() => setUnsubDone(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Section title="Alert Types">
        <Field
          label="Domain becomes available"
          sub="Alert when a watched domain's status changes to available"
        >
          <Toggle checked={notifAvailable} onChange={setNotifAvailable} />
        </Field>
        <div className="border-t border-zinc-800" />
        <Field
          label="Price drop"
          sub="Notify when a domain's price estimate decreases"
        >
          <Toggle checked={notifPrice} onChange={setNotifPrice} />
        </Field>
        <div className="border-t border-zinc-800" />
        <Field
          label="Expiring soon"
          sub="Notify 7 days before a domain expires from your watchlist"
        >
          <Toggle checked={notifExpiry} onChange={setNotifExpiry} />
        </Field>
        <div className="border-t border-zinc-800" />
        <Field
          label="Weekly digest"
          sub="Weekly summary email of your watchlist status"
        >
          <Toggle checked={notifWeekly} onChange={setNotifWeekly} />
        </Field>
      </Section>

      <Section title="Global Frequency">
        <p className="text-xs text-zinc-600">
          How often you receive non-critical notifications (individual alerts remain immediate)
        </p>
        <div className="flex items-center gap-2">
          {(["immediate", "daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={cn(
                "h-8 px-4 rounded-[4px] text-xs capitalize font-medium border transition-colors duration-150",
                frequency === f
                  ? "bg-cyan-400 text-zinc-950 border-cyan-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </Section>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-4">
        {/* Save */}
        <button
          onClick={() => savePrefs()}
          disabled={saving || saved}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-5 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-60",
            saved
              ? "bg-green-400/20 border border-green-800 text-green-400"
              : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
          )}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Saved!" : saving ? "Saving…" : "Save preferences"}
        </button>

        {/* Unsubscribe all */}
        <button
          onClick={handleUnsubscribeAll}
          disabled={unsubscribing || unsubDone}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors duration-150 disabled:opacity-50"
        >
          {unsubDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          ) : unsubscribing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BellOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {unsubDone ? "Done" : "Unsubscribe from all"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-[4px]">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
