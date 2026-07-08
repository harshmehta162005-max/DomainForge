"use client"

import { useState, useEffect } from "react"
import { User, Bell, Shield, Download, Trash2, Save, Check, LogOut, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClassicLoader } from "@/components/ui/ClassicLoader"
import { ProUpgradeDialog } from "@/components/ui/ProUpgradeDialog"

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-shrink-0">
        <p className="text-sm text-zinc-200">{label}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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
      <span className={cn(
        "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-zinc-950 shadow transition-transform duration-200",
        checked && "translate-x-4"
      )} />
    </button>
  )
}

function DeleteAccountModal({ isOpen, onClose, onConfirm, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, isDeleting: boolean }) {
  if (!isOpen) return null;
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
            Are you absolutely sure you want to permanently delete your account and all associated data? This will immediately wipe your watchlist, shortlists, history, and preferences.
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
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Deleting...
              </>
            ) : "Yes, delete my account"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [plan, setPlan] = useState("free")
  const [loading, setLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [proDialogOpen, setProDialogOpen] = useState(false)
  const [proDialogFeature, setProDialogFeature] = useState("")

  const showProDialog = (featureName: string) => {
    setProDialogFeature(featureName)
    setProDialogOpen(true)
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const { settings } = await res.json();
          if (settings) {
            setPlan(settings.plan || "free");
            setNotifAvailable(settings.notif_available ?? true);
            setNotifExpiry(settings.notif_expiry ?? true);
            setNotifPrice(settings.notif_price ?? false);
            setNotifWeekly(settings.weekly_digest ?? true);
            setDefaultTlds(settings.default_tlds || ".com,.io,.ai");
            setAutoCheck(settings.auto_check ?? false);
            setCheckInterval(settings.check_interval || "6h");
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [])

  // Notification prefs
  const [notifAvailable, setNotifAvailable] = useState(true)
  const [notifExpiry, setNotifExpiry] = useState(true)
  const [notifPrice, setNotifPrice] = useState(false)
  const [notifWeekly, setNotifWeekly] = useState(true)

  // Availability defaults
  const [defaultTlds, setDefaultTlds] = useState(".com,.io,.ai")
  const [autoCheck, setAutoCheck] = useState(true)
  const [checkInterval, setCheckInterval] = useState("6h")

  const handleSave = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notif_available: notifAvailable,
          notif_expiry: notifExpiry,
          notif_price: notifPrice,
          weekly_digest: notifWeekly,
          default_tlds: defaultTlds,
          auto_check: autoCheck,
          check_interval: checkInterval
        })
      });

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        alert(`Failed to save settings: ${data.error}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to save settings");
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleExport = () => {
    window.location.href = "/api/export-account"
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        handleSignOut();
      } else {
        alert("Failed to delete account. Please try again or contact support.");
        setIsDeleting(false)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to delete account.");
      setIsDeleting(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98]",
            saved
              ? "bg-green-400/20 border border-green-800 text-green-400"
              : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
          )}
        >
          {saved ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Save className="h-4 w-4" strokeWidth={1.5} />}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <ClassicLoader />
        </div>
      ) : (
        <>
          {/* Account */}
          <Section title="Account">
        <Field label="Account type" sub="Your current plan">
          <div className="flex items-center gap-3">
            <span className={cn("text-xs px-2 py-1 rounded-[2px] font-mono border", plan === "pro" ? "bg-cyan-950 border-cyan-800 text-cyan-400" : "bg-zinc-800 border-zinc-700 text-zinc-300")}>
              {plan === "pro" ? "Pro tier" : "Free tier"}
            </span>
            {plan === "free" && (
              <Link href="/dashboard/billing" className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Upgrade to Pro
              </Link>
            )}
          </div>
        </Field>
        <div className="border-t border-zinc-800" />
        <Field label="Sign out" sub="Sign out of your account on this device">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-red-400 hover:border-red-900 transition-colors duration-150"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </Field>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Field label="Domain becomes available" sub="Alert when a watched domain's status changes to available">
          <Toggle checked={notifAvailable} onChange={setNotifAvailable} />
        </Field>
        <Field label="Expiry alerts" sub="Notify 7 days before a domain expires from your watchlist">
          <Toggle checked={notifExpiry} onChange={setNotifExpiry} />
        </Field>
        <Field label="Price changes" sub="Notify when a domain's price estimate changes">
          <Toggle checked={notifPrice} onChange={setNotifPrice} />
        </Field>
        <Field label="Weekly digest" sub="Weekly summary of your watchlist status">
          <Toggle checked={notifWeekly} onChange={setNotifWeekly} />
        </Field>
      </Section>

      {/* Availability checks */}
      <Section title="Availability checks">
        <Field label="Default TLDs" sub="Comma-separated list used in new generations">
          <input
            type="text"
            value={defaultTlds}
            onChange={e => setDefaultTlds(e.target.value)}
            className="h-8 px-2.5 w-48 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </Field>
        <Field label="Auto-check watchlist" sub={plan === "pro" ? "Automatically re-check availability on a schedule" : "Automatically re-check availability on a schedule (Pro only)"}>
          <div className="flex items-center gap-2">
            {plan === "free" && <span className="text-xs text-amber-500 bg-amber-950/30 px-1.5 py-0.5 rounded font-mono border border-amber-900/50">PRO</span>}
            <Toggle checked={plan === "pro" ? autoCheck : false} onChange={plan === "pro" ? setAutoCheck : () => showProDialog("Auto-check watchlist")} />
          </div>
        </Field>
        {autoCheck && (
          <Field label="Check interval" sub="How often to check availability">
            <select
              value={checkInterval}
              onChange={e => setCheckInterval(e.target.value)}
              className="h-8 px-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
            >
              <option value="1h">Every hour</option>
              <option value="6h">Every 6 hours</option>
              <option value="24h">Once daily</option>
              <option value="48h">Every 2 days</option>
            </select>
          </Field>
        )}
      </Section>

      {/* Data & privacy */}
      <Section title="Data & privacy">
        <Field label="Export your data" sub="Download a JSON export of your watchlist and settings">
          <button
            onClick={plan === "pro" ? handleExport : () => showProDialog("Data export")}
            className={cn(
              "inline-flex items-center gap-2 h-8 px-3 rounded-[4px] border text-sm transition-colors duration-150",
              plan === "pro"
                ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
                : "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export
          </button>
        </Field>
        <div className="border-t border-zinc-800" />
        <Field
          label="Delete account"
          sub="Permanently delete your account and all data. This cannot be undone."
        >
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-950 border border-red-900 text-sm text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-colors duration-150"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Delete account
          </button>
        </Field>
      </Section>
      </>
      )}

      {/* About */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-700">
        <span>DomainForge v0.1.0</span>
        <div className="flex items-center gap-3">
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Support</a>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <ProUpgradeDialog
        open={proDialogOpen}
        onOpenChange={setProDialogOpen}
        featureName={proDialogFeature}
      />
    </div>
  )
}
