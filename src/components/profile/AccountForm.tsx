"use client"

import { useState, useRef, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  Check,
  Loader2,
  AtSign,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/user"

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

function SaveButton({
  saved,
  loading,
  onClick,
}: {
  saved: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || saved}
      className={cn(
        "inline-flex items-center gap-2 h-8 px-4 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-60",
        saved
          ? "bg-green-400/20 border border-green-800 text-green-400"
          : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : saved ? (
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
      ) : null}
      {saved ? "Saved!" : loading ? "Saving…" : "Save"}
    </button>
  )
}

// ─── Avatar upload section ────────────────────────────────────────────────────

function AvatarSection({
  avatarUrl,
  displayName,
  email,
  onUpload,
}: {
  avatarUrl: string | null
  displayName: string | null
  email: string
  onUpload: (url: string) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentUrl = preview ?? avatarUrl

  const initials = (() => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/)
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : displayName.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  })()

  const handleFile = async (file: File) => {
    setError(null)
    setDone(false)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    setUploading(true)
    const fd = new FormData()
    fd.append("avatar", file)

    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd })
    const data = await res.json() as { avatar_url?: string; error?: string }
    setUploading(false)

    if (!res.ok) {
      setError(data.error ?? "Upload failed")
      setPreview(null)
    } else {
      onUpload(data.avatar_url!)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div
        className="relative h-16 w-16 flex-shrink-0 rounded-full cursor-pointer group"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-cyan-500/50 transition-all duration-150"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold font-mono text-zinc-300 text-lg ring-2 ring-zinc-700 group-hover:ring-cyan-500/50 transition-all duration-150">
            {initials}
          </div>
        )}
        {/* Upload overlay */}
        <div className="absolute inset-0 rounded-full bg-zinc-950/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* Text + input */}
      <div className="flex-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        <p className="text-sm text-zinc-200">Profile Photo</p>
        <p className="text-xs text-zinc-600 mt-0.5">JPEG, PNG, WebP or GIF · max 2 MB</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex items-center gap-1.5 h-7 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
        >
          <Upload className="h-3 w-3" strokeWidth={1.5} />
          Upload photo
        </button>
        {done && (
          <span className="ml-2 text-xs text-green-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

// ─── Username field ───────────────────────────────────────────────────────────

function UsernameField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const validateAndCheck = useCallback(
    (val: string) => {
      setAvailable(null)
      if (debounceTimer) clearTimeout(debounceTimer)

      if (!val || val.length < 3 || !/^[a-zA-Z0-9_]+$/.test(val)) return

      const timer = setTimeout(async () => {
        setChecking(true)
        try {
          const res = await fetch(`/api/profile/username-check?username=${encodeURIComponent(val)}`)
          const data = await res.json() as { available: boolean }
          setAvailable(data.available)
        } catch {
          setAvailable(null)
        } finally {
          setChecking(false)
        }
      }, 500)
      setDebounceTimer(timer)
    },
    [debounceTimer]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)
    onChange(val)
    validateAndCheck(val)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm text-zinc-200">Username</label>
      <p className="text-xs text-zinc-600">Your unique @handle — 3–20 characters, letters, numbers, underscores</p>
      <div className="relative">
        <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="your_handle"
          maxLength={20}
          className="h-9 pl-8 pr-8 w-full max-w-xs bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="h-3.5 w-3.5 text-zinc-500 animate-spin" />}
          {!checking && available === true && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
          {!checking && available === false && <X className="h-3.5 w-3.5 text-red-400" />}
        </span>
      </div>
      {available === false && (
        <p className="text-xs text-red-400">Username already taken</p>
      )}
      {available === true && (
        <p className="text-xs text-green-400">Available!</p>
      )}
    </div>
  )
}

// ─── AccountForm ──────────────────────────────────────────────────────────────

interface AccountFormProps {
  profile: Profile
}

export function AccountForm({ profile }: AccountFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)

  // Display name
  const [displayName, setDisplayName] = useState(profile.display_name ?? "")
  const [nameSaved, setNameSaved] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Username
  const [username, setUsername] = useState(profile.username ?? "")
  const [usernameSaved, setUsernameSaved] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Bio
  const [bio, setBio] = useState(profile.bio ?? "")
  const [bioSaved, setBioSaved] = useState(false)
  const [bioSaving, setBioSaving] = useState(false)

  // Email change
  const [newEmail, setNewEmail] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const patchProfile = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return res.json() as Promise<{ error?: string }>
  }

  // ── Handlers ──

  const handleSaveName = async () => {
    setNameSaving(true)
    setNameError(null)
    const data = await patchProfile({ display_name: displayName.trim() || null })
    setNameSaving(false)
    if (data.error) {
      setNameError(data.error)
    } else {
      setNameSaved(true)
      setTimeout(() => { setNameSaved(false); startTransition(() => router.refresh()) }, 1500)
    }
  }

  const handleSaveUsername = async () => {
    setUsernameSaving(true)
    setUsernameError(null)
    const data = await patchProfile({ username: username.trim() || null })
    setUsernameSaving(false)
    if (data.error) {
      setUsernameError(data.error)
    } else {
      setUsernameSaved(true)
      setTimeout(() => { setUsernameSaved(false); startTransition(() => router.refresh()) }, 1500)
    }
  }

  const handleSaveBio = async () => {
    setBioSaving(true)
    const data = await patchProfile({ bio: bio.trim() || null })
    setBioSaving(false)
    if (!data.error) {
      setBioSaved(true)
      setTimeout(() => setBioSaved(false), 1500)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail) return
    setEmailSending(true)
    setEmailResult(null)
    const res = await fetch("/api/profile/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    })
    const data = await res.json() as { message?: string; error?: string }
    setEmailSending(false)
    setEmailResult({ ok: res.ok, msg: data.message ?? data.error ?? "Unknown error" })
    if (res.ok) setNewEmail("")
  }

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <Section title="Profile Photo" subtitle="Shown on your profile and across the app">
        <AvatarSection
          avatarUrl={avatarUrl}
          displayName={displayName || null}
          email={profile.email}
          onUpload={(url) => setAvatarUrl(url)}
        />
      </Section>

      {/* Display name */}
      <Section title="Display Name" subtitle="How your name appears across DomainForge">
        <div className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Harsh Mehta"
            className="h-9 px-3 w-full max-w-xs bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700"
          />
          {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          <SaveButton saved={nameSaved} loading={nameSaving} onClick={handleSaveName} />
        </div>
      </Section>

      {/* Username */}
      <Section title="Username" subtitle="Your unique public @handle">
        <div className="space-y-3">
          <UsernameField value={username} onChange={setUsername} />
          {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
          <SaveButton saved={usernameSaved} loading={usernameSaving} onClick={handleSaveUsername} />
        </div>
      </Section>

      {/* Bio */}
      <Section title="Bio / Tagline" subtitle="A short description, max 160 characters">
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="e.g. Domain hunter · Startup founder · Building in public"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none placeholder:text-zinc-700"
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-zinc-700 font-mono">
              {bio.length}/160
            </span>
          </div>
          <SaveButton saved={bioSaved} loading={bioSaving} onClick={handleSaveBio} />
        </div>
      </Section>

      {/* Email change */}
      <Section
        title="Email Address"
        subtitle="Change the email associated with your account"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 font-mono">{profile.email}</span>
            <span className="text-[10px] bg-green-950/40 border border-green-900/50 text-green-500 px-1.5 py-0.5 rounded-[2px] font-mono flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />
              verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="h-9 px-3 w-full max-w-xs bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-700"
            />
            <button
              onClick={handleChangeEmail}
              disabled={emailSending || !newEmail}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {emailSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Send verification
            </button>
          </div>

          {emailResult && (
            <div
              className={cn(
                "flex items-start gap-2 text-xs px-3 py-2 rounded-[4px] border",
                emailResult.ok
                  ? "bg-green-950/30 border-green-900/50 text-green-400"
                  : "bg-red-950/30 border-red-900/50 text-red-400"
              )}
            >
              {emailResult.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              )}
              {emailResult.msg}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
