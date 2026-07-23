"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Terminal, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

// ─── Terminal Demo Lines (left panel) ────────────────────────────────────────

const DEMO_LINES = [
  { prefix: "$ ", text: 'domainforge generate --desc "AI coding tool"', delay: 0 },
  { prefix: "  ", text: "→ Querying Groq LLM...", delay: 600, muted: true },
  { prefix: "  ", text: "✓ codeforge.ai        [available]", delay: 1200, green: true },
  { prefix: "  ", text: "✓ devkit.io           [available]", delay: 1600, green: true },
  { prefix: "  ", text: "✗ codelab.com         [taken]", delay: 2000, red: true },
  { prefix: "  ", text: "✓ stackkit.dev        [available]", delay: 2400, green: true },
  { prefix: "$ ", text: "domainforge save codeforge.ai", delay: 3200 },
  { prefix: "  ", text: "→ Saved to watchlist ✓", delay: 3800, muted: true },
]

function TerminalPanel() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers = DEMO_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay),
    )
    const loop = setTimeout(() => setVisibleLines(0), 6000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(loop)
    }
  }, [visibleLines])

  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-12 bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors -ml-2">
        <Image src="/logo-new.png" alt="DomainForge Logo" width={90} height={90} className="h-16 w-auto object-contain scale-110" priority />
        <span className="text-3xl font-bold tracking-tight">
          Domain<span className="text-cyan-400">Forge</span>
        </span>
      </Link>

      {/* Terminal block */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
          <Terminal className="h-3.5 w-3.5" />
          <span>domainforge v0.1 — REPL</span>
        </div>

        <div className="font-mono text-sm space-y-1.5 min-h-[200px]">
          {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="flex gap-1">
              <span className="text-zinc-600 shrink-0">{line.prefix}</span>
              <span
                className={cn(
                  "transition-opacity duration-200",
                  line.green && "text-green-400",
                  line.red && "text-red-400",
                  line.muted && "text-zinc-500",
                  !line.green && !line.red && !line.muted && "text-zinc-300",
                )}
              >
                {line.text}
              </span>
            </div>
          ))}
          {/* blinking cursor */}
          <div className="flex gap-1">
            <span className="text-zinc-600">$ </span>
            <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Footer quote */}
      <p className="text-xs text-zinc-600 font-mono max-w-xs leading-relaxed">
        "A domain name is the first impression of your brand — make it count."
      </p>
    </div>
  )
}

// ─── Auth Form ────────────────────────────────────────────────────────────────

type AuthMode = "signin" | "signup"

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      setError("Authentication failed. Please try again.")
    }
  }, [searchParams])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (mode === "signup") {
        const nextParam = searchParams.get("next")
        const redirectTo = new URL(`${window.location.origin}/auth/callback`)
        if (nextParam) redirectTo.searchParams.set("next", nextParam)
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo.toString() },
        })
        if (signUpError) throw signUpError
        
        if (data?.session) {
          // Email confirmation is disabled in Supabase, user is immediately signed in
          const nextUrl = searchParams.get("next") || "/dashboard"
          router.push(nextUrl)
          router.refresh()
        } else {
          setSuccessMsg("Check your email for a confirmation link.")
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        
        const nextUrl = searchParams.get("next") || "/dashboard"
        router.push(nextUrl)
        router.refresh()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed"
      if (msg.includes("Invalid login credentials")) {
        setError("Invalid email or password. Check your credentials and try again.")
      } else if (msg.includes("Email not confirmed")) {
        setError("Email not confirmed. Check your inbox for the confirmation link.")
      } else if (msg.includes("User already registered")) {
        setError("An account with this email already exists. Sign in instead.")
      } else if (msg.includes("Password should be at least")) {
        setError("Password must be at least 6 characters.")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    const nextParam = searchParams.get("next")
    const redirectTo = new URL(`${window.location.origin}/auth/callback`)
    if (nextParam) redirectTo.searchParams.set("next", nextParam)
    
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    })
    if (oauthError) {
      setError("Google sign-in failed. Try again.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] grid lg:grid-cols-2">
      {/* Left — terminal panel */}
      <TerminalPanel />

      {/* Right — glass card panel */}
      <div className="flex flex-col items-center justify-center px-8 py-16 bg-[#121212] relative overflow-hidden">

        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[400px] h-[400px] rounded-full bg-cyan-400/5 blur-3xl" />
        </div>

        {/* Glass card */}
        <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/10 to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-white/5">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center -mt-6 mb-2 transition-transform hover:scale-105 duration-200"
          >
            <Image src="/logo-new.png" alt="DomainForge Logo" width={140} height={140} className="h-32 w-auto object-contain scale-110" priority />
          </Link>

          {/* Title */}
          <h1 className="text-xl font-semibold text-white mb-1 text-center">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-xs text-gray-400 mb-6 text-center">
            {mode === "signin"
              ? "Sign in to access your domain watchlist."
              : "Start saving and tracking domain names."}
          </p>

          {/* Error / Success */}
          {error && (
            <div className="w-full flex items-start gap-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-900 text-red-400 text-xs mb-4">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="w-full px-3 py-2 rounded-xl bg-green-950/60 border border-green-900 text-green-400 text-xs mb-4">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col w-full gap-3 mb-4">
            <input
              id="auth-email"
              placeholder="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
            />
            <div className="relative">
              <input
                id="auth-password"
                placeholder={mode === "signup" ? "Password (min. 6 chars)" : "Password"}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 pr-11 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <hr className="border-white/10" />

            <button
              type="submit"
              disabled={loading || googleLoading || !email || !password}
              className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="font-mono text-xs">authenticating…</span>
              ) : (
                mode === "signin" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>
          {/* Mode toggle */}
          <div className="w-full text-center mt-4">
            <span className="text-xs text-gray-400">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin")
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="underline text-white/80 hover:text-white transition-colors"
              >
                {mode === "signin" ? "Sign up, it's free!" : "Sign in"}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
