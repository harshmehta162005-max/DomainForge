"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const IconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }
  const Icon = IconMap[toast.type]

  const colorMap = {
    success: "border-green-800 bg-green-950/80 text-green-300",
    error:   "border-red-800 bg-red-950/80 text-red-300",
    info:    "border-zinc-700 bg-zinc-900/90 text-zinc-200",
  }

  return (
    <div className={cn(
      "flex items-start gap-3 min-w-64 max-w-xs px-3 py-2.5 rounded-[4px] border backdrop-blur-sm shadow-xl",
      "animate-slide-in",
      colorMap[toast.type]
    )}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <p className="text-sm flex-1 leading-5">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — fixed bottom-left above the AI assistant */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
