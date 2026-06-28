"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

interface RemoveDomainButtonProps {
  domain: string
}

/**
 * Client component for removing a domain from the watchlist.
 * Uses router.refresh() to re-fetch the Server Component after deletion.
 */
export function RemoveDomainButton({ domain }: RemoveDomainButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      if (res.ok) {
        router.refresh() // re-runs the Server Component to reflect updated list
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title={`Remove ${domain}`}
      aria-label={`Remove ${domain} from watchlist`}
      className="flex items-center justify-center h-7 w-7 rounded-[4px] text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
