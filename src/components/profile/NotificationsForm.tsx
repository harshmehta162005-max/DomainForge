"use client"

import { useState, useEffect } from "react"
import {
  Bell, BellOff, Clock, Loader2, AlertCircle, Check,
  CheckCircle2, Mail, TrendingDown, Timer, CalendarDays, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifSettings {
  notif_master:        boolean
  notif_available:     boolean
  notif_expiry:        boolean
  notif_price:         boolean
  weekly_digest:       boolean
  notif_frequency:     "immediate" | "daily" | "weekly"
  quiet_hours_enabled: boolean
  quiet_hours_start:   string
  quiet_hours_end:     string
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0",
        checked ? "bg-cyan-400" : "bg-zinc-700",
        disabled && "opacity-40 cursor-not-allowed"
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

function NotifRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  sub,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  label: string
  sub: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={cn(
      "flex items-center gap-4 py-3 transition-opacity duration-200",
      disabled && "opacity-40 pointer-events-none"
    )}>
      <div className={cn("h-8 w-8 rounded-[4px] flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
  headerRight,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerRight?: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px]">
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className="px-5 py-4 space-y-0">{children}</div>
    </div>
  )
}

// ─── NotificationsForm ────────────────────────────────────────────────────────

const DEFAULTS: NotifSettings = {
  notif_master:        true,
  notif_available:     true,
  notif_expiry:        true,
  notif_price:         false,
  weekly_digest:       true,
  notif_frequency:     "immediate",
  quiet_hours_enabled: false,
  quiet_hours_start:   "22:00",
  quiet_hours_end:     "08:00",
}

export function NotificationsForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [s, setS] = useState<NotifSettings>(DEFAULTS)

  // ── Fetch on mount + silently record timezone ──
  useEffect(() => {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings?: Record<string, unknown> }) => {
        if (data.settings) {
          const d = data.settings
          setS({
            notif_master:        (d.notif_master        as boolean) ?? true,
            notif_available:     (d.notif_available     as boolean) ?? true,
            notif_expiry:        (d.notif_expiry        as boolean) ?? true,
            notif_price:         (d.notif_price         as boolean) ?? false,
            weekly_digest:       (d.weekly_digest       as boolean) ?? true,
            notif_frequency:     (d.notif_frequency     as "immediate" | "daily" | "weekly") ?? "immediate",
            quiet_hours_enabled: (d.quiet_hours_enabled as boolean) ?? false,
            quiet_hours_start:   (d.quiet_hours_start   as string)  ?? "22:00",
            quiet_hours_end:     (d.quiet_hours_end     as string)  ?? "08:00",
          })
          // Silently update timezone if it changed or was not set
          if (detectedTz && d.timezone !== detectedTz) {
            fetch("/api/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ timezone: detectedTz }),
            }).catch(() => {})
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Patch helper ──
  const patch = async (payload: Partial<NotifSettings>) => {
    setSaving(true)
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json() as { error?: string }
      toast(d.error ?? "Failed to save", "error")
      return false
    }
    return true
  }

  // ── Master toggle ──
  // The master toggle acts as an override. It does not modify the individual states.
  const handleMaster = async (on: boolean) => {
    setS({ ...s, notif_master: on })
    const ok = await patch({ notif_master: on })
    if (!ok) {
      setS({ ...s, notif_master: !on }) // rollback on error
    } else {
      toast(on ? "Notifications re-enabled." : "All notifications disabled.", on ? "success" : "info")
    }
  }

  // ── Individual toggle ──
  const handleToggle = async (key: keyof NotifSettings, val: boolean) => {
    const next = { ...s, [key]: val }
    setS(next)
    const ok = await patch({ [key]: val })
    if (!ok) setS({ ...s, [key]: !val }) // rollback
    else toast("Preference saved.", "success")
  }

  // ── Frequency ──
  const handleFrequency = async (f: "immediate" | "daily" | "weekly") => {
    const prev = s.notif_frequency
    setS({ ...s, notif_frequency: f })
    const ok = await patch({ notif_frequency: f })
    if (!ok) setS({ ...s, notif_frequency: prev })
    else toast(`Frequency set to ${f}.`, "success")
  }

  // ── Quiet hours ──
  const handleQuietToggle = async (on: boolean) => {
    setS({ ...s, quiet_hours_enabled: on })
    const ok = await patch({ quiet_hours_enabled: on })
    if (!ok) setS({ ...s, quiet_hours_enabled: !on })
    else toast(on ? "Quiet hours enabled." : "Quiet hours disabled.", "success")
  }

  const handleQuietSave = async () => {
    const ok = await patch({ quiet_hours_start: s.quiet_hours_start, quiet_hours_end: s.quiet_hours_end })
    if (ok) toast("Quiet hours saved.", "success")
  }

  const isMasterOff = !s.notif_master

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Alert Types — with master toggle in header */}
      <Section
        title="Alert Types"
        subtitle="Choose which events trigger email notifications"
        headerRight={
          <div className="flex items-center gap-2">
            <Toggle
              checked={s.notif_master}
              onChange={handleMaster}
              disabled={saving}
            />
          </div>
        }
      >
        {/* Dim all rows when master is off */}
        <div className={cn("divide-y divide-zinc-800/50", isMasterOff && "opacity-50 pointer-events-none")}>
          <NotifRow
            icon={Bell}
            iconColor="text-cyan-400"
            iconBg="bg-cyan-950/40"
            label="Domain becomes available"
            sub="Alert when a watched domain's status changes to available"
            checked={s.notif_available}
            onChange={(v) => handleToggle("notif_available", v)}
          />
          <NotifRow
            icon={TrendingDown}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-950/40"
            label="Price drop"
            sub="Notify when a domain's price estimate decreases"
            checked={s.notif_price}
            onChange={(v) => handleToggle("notif_price", v)}
          />
          <NotifRow
            icon={Timer}
            iconColor="text-orange-400"
            iconBg="bg-orange-950/40"
            label="Expiring soon"
            sub="Notify 7 days before a domain expires from your watchlist"
            checked={s.notif_expiry}
            onChange={(v) => handleToggle("notif_expiry", v)}
          />
          <NotifRow
            icon={CalendarDays}
            iconColor="text-purple-400"
            iconBg="bg-purple-950/40"
            label="Weekly digest"
            sub="Weekly summary email of all watchlist activity"
            checked={s.weekly_digest}
            onChange={(v) => handleToggle("weekly_digest", v)}
          />
        </div>

      </Section>

      {/* Global Frequency */}
      <Section
        title="Delivery Frequency"
        subtitle="How often enabled alerts are batched and sent to your inbox"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {(["immediate", "daily", "weekly"] as const).map((f) => {
              const Icon = f === "immediate" ? Zap : f === "daily" ? Mail : CalendarDays
              const desc = f === "immediate"
                ? "Send each alert instantly"
                : f === "daily"
                ? "One digest email per day"
                : "One digest email per week"
              return (
                <button
                  key={f}
                  onClick={() => handleFrequency(f)}
                  disabled={saving || isMasterOff}
                  className={cn(
                    "flex flex-col items-start gap-1.5 p-3 rounded-[4px] border text-left transition-all duration-150 disabled:opacity-40",
                    s.notif_frequency === f
                      ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="text-xs font-medium capitalize">{f}</span>
                    {s.notif_frequency === f && <Check className="h-3 w-3 ml-auto" strokeWidth={2.5} />}
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-snug">{desc}</p>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-zinc-700">
            Tip: &ldquo;Daily&rdquo; or &ldquo;Weekly&rdquo; prevents inbox noise when watching many domains.
          </p>
        </div>
      </Section>

      {/* Quiet Hours */}
      <Section
        title="Quiet Hours"
        subtitle="Suppress all notification emails during these hours"
        headerRight={
          <Toggle
            checked={s.quiet_hours_enabled}
            onChange={handleQuietToggle}
            disabled={saving}
          />
        }
      >
        <div className={cn(
          "space-y-4 transition-opacity duration-200",
          !s.quiet_hours_enabled && "opacity-40 pointer-events-none"
        )}>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs text-zinc-500">Start time</label>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="time"
                  value={s.quiet_hours_start}
                  onChange={(e) => setS({ ...s, quiet_hours_start: e.target.value })}
                  className="h-8 px-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="pt-5 text-zinc-600 text-xs">to</div>
            <div className="space-y-1.5 flex-1">
              <label className="text-xs text-zinc-500">End time</label>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="time"
                  value={s.quiet_hours_end}
                  onChange={(e) => setS({ ...s, quiet_hours_end: e.target.value })}
                  className="h-8 px-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-700">
            Emails triggered during quiet hours will be held and sent at the end time.
          </p>
          <button
            onClick={handleQuietSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" strokeWidth={1.5} />}
            Save quiet hours
          </button>
        </div>
      </Section>

    </div>
  )
}
