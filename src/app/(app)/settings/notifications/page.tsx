"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bell, Shield, Mail, RefreshCw } from "lucide-react"

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    marketing_emails: false,
    weekly_digest: true,
    security_alerts: true,
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/notifications")
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setSettings({
              marketing_emails: data.settings.marketing_emails,
              weekly_digest: data.settings.weekly_digest,
              security_alerts: data.settings.security_alerts,
            })
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        // Optional: show a toast notification here
      }
    } catch (err) {
      console.error("Failed to save settings", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-[800px] mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Bell className="h-6 w-6 text-cyan-400" />
          Notification Settings
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Manage how and when DomainForge communicates with you.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            
            {/* Global Weekly Digest */}
            <div className="p-6 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="h-10 w-10 rounded-full bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-zinc-100">Weekly Digest</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Receive a summary email every Sunday rounding up all activity, new availables, and expiring domains across your watchlist.
                </p>
              </div>
              <div className="ml-4 flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.weekly_digest}
                    onChange={(e) => setSettings({ ...settings, weekly_digest: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="p-6 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="h-10 w-10 rounded-full bg-orange-950/50 border border-orange-900/50 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-zinc-100">Security & Account</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Crucial notices about new logins, password changes, and account recovery. (Cannot be fully disabled at the provider level).
                </p>
              </div>
              <div className="ml-4 flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer opacity-70">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.security_alerts}
                    disabled
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            {/* Marketing / Product Updates */}
            <div className="p-6 flex items-start gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-zinc-100">Product Updates & Tips</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Occasional updates about new DomainForge features, domain investing strategies, and promotional offers.
                </p>
              </div>
              <div className="ml-4 flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.marketing_emails}
                    onChange={(e) => setSettings({ ...settings, marketing_emails: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

          </div>
        )}
        
        <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            disabled={saving || loading}
            className="h-10 px-5 rounded-md text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-10 px-6 rounded-md text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 shadow-sm shadow-cyan-900/50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save Preferences"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-zinc-500">
        To configure <strong className="text-zinc-400">per-domain</strong> notification alerts (such as Price Drops or Availability changes), use the bell icon in your Watchlist dashboard.
      </div>
    </div>
  )
}
