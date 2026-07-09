"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Shield,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/user"
import { useToast } from "@/components/ui/Toast"

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Password input ───────────────────────────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative w-full max-w-xs">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 px-3 pr-9 w-full bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}

// ─── SecurityPanel ────────────────────────────────────────────────────────────

interface SecurityPanelProps {
  profile: Profile
}

export function SecurityPanel({ profile }: SecurityPanelProps) {
  const { toast } = useToast()
  
  // Password change
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwResult, setPwResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Sign out other sessions
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [signOutDone, setSignOutDone] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw) return
    if (newPw !== confirmPw) {
      setPwResult({ ok: false, msg: "Passwords do not match" })
      return
    }
    setPwSaving(true)
    setPwResult(null)

    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPw, confirmPassword: confirmPw }),
    })
    const data = await res.json() as { message?: string; error?: string }
    setPwSaving(false)
    setPwResult({ ok: res.ok, msg: data.message ?? data.error ?? "Unknown error" })
    
    if (res.ok) {
      toast("Password updated successfully.", "success")
      setNewPw("")
      setConfirmPw("")
    } else {
      toast(data.error ?? "Failed to update password", "error")
    }
  }

  const handleSignOutOthers = async () => {
    setSignOutLoading(true)
    setSignOutError(null)
    const res = await fetch("/api/profile/sessions", { method: "DELETE" })
    const data = await res.json() as { message?: string; error?: string }
    setSignOutLoading(false)
    if (res.ok) {
      toast("Successfully signed out of all other sessions.", "success")
      setSignOutDone(true)
      setTimeout(() => setSignOutDone(false), 3000)
    } else {
      toast(data.error ?? "Failed to sign out other sessions", "error")
      setSignOutError(data.error ?? "Failed")
    }
  }

  const lastSeen = profile.last_sign_in_at
    ? new Date(profile.last_sign_in_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A"

  const isEmailProvider = profile.provider === "email"

  return (
    <div className="space-y-4">
      {/* Change password — only if email/password user */}
      {isEmailProvider ? (
        <Section title="Change Password">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs text-zinc-500">
                New password
              </label>
              <PasswordInput
                id="new-password"
                value={newPw}
                onChange={setNewPw}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-xs text-zinc-500">
                Confirm new password
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repeat password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !newPw || !confirmPw}
              className={cn(
                "inline-flex items-center gap-2 h-9 px-5 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50",
                pwResult?.ok
                  ? "bg-green-400/20 border border-green-800 text-green-400"
                  : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
              )}
            >
              {pwSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {pwResult?.ok && <Check className="h-3.5 w-3.5" />}
              {pwSaving ? "Updating…" : pwResult?.ok ? "Updated!" : "Update password"}
            </button>

            {pwResult && (
              <div
                className={cn(
                  "flex items-start gap-2 text-xs px-3 py-2 rounded-[4px] border",
                  pwResult.ok
                    ? "bg-green-950/30 border-green-900/50 text-green-400"
                    : "bg-red-950/30 border-red-900/50 text-red-400"
                )}
              >
                {pwResult.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                )}
                {pwResult.msg}
              </div>
            )}
          </div>
        </Section>
      ) : (
        <Section title="Password">
          <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-800 px-3 py-2.5 rounded-[4px]">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>
              You signed in with <strong className="text-zinc-300">{profile.provider}</strong>. Password changes are managed through your {profile.provider} account.
            </span>
          </div>
        </Section>
      )}

      {/* 2FA placeholder */}
      <Section title="Two-Factor Authentication">
        <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-800 px-3 py-2.5 rounded-[4px]">
          <Shield className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-zinc-400" strokeWidth={1.5} />
          <div>
            <p className="text-zinc-300 font-medium mb-0.5">Email OTP is enabled</p>
            <p>Each sign-in sends a one-time code to <strong className="text-zinc-300">{profile.email}</strong>. TOTP app-based 2FA coming soon.</p>
          </div>
        </div>
      </Section>

      {/* Login history / sessions */}
      <Section title="Login & Sessions">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Last sign-in</span>
            <span className="text-zinc-300 font-mono text-xs">{lastSeen}</span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Auth provider</span>
            <span className="text-zinc-300 capitalize font-mono text-xs">{profile.provider}</span>
          </div>
          <div className="border-t border-zinc-800" />
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-zinc-200">Sign out other sessions</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Revokes all other active logins while keeping this one
              </p>
            </div>
            <button
              onClick={handleSignOutOthers}
              disabled={signOutLoading || signOutDone}
              className={cn(
                "inline-flex items-center gap-2 h-8 px-3 rounded-[4px] border text-xs transition-colors duration-150 disabled:opacity-50",
                signOutDone
                  ? "bg-green-950/30 border-green-900 text-green-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600"
              )}
            >
              {signOutLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : signOutDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <LogOut className="h-3 w-3" strokeWidth={1.5} />
              )}
              {signOutDone ? "Done" : "Sign out others"}
            </button>
          </div>
          {signOutError && (
            <p className="text-xs text-red-400">{signOutError}</p>
          )}
        </div>
      </Section>
    </div>
  )
}
