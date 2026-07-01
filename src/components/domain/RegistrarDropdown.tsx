"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExternalLink, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DomainSuggestion } from "@/types/domain"

interface RegistrarDropdownProps {
  suggestion: DomainSuggestion
  className?: string
  variant?: "primary" | "secondary"
}

export function RegistrarDropdown({ suggestion, className, variant = "primary" }: RegistrarDropdownProps) {
  if (suggestion.availabilityStatus !== "available") {
    // If not available, we could still render a view button or nothing.
    // The previous code had a "View" button for Namecheap.
    if (!suggestion.registrarLinks?.namecheap) return null
    
    return (
      <a
        href={suggestion.registrarLinks.namecheap}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "h-7 px-2 flex items-center gap-1 rounded-[4px] text-xs font-medium transition-colors duration-150",
          variant === "primary" ? "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-100" : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800",
          className
        )}
      >
        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        View
      </a>
    )
  }

  const links = suggestion.registrarLinks || {}
  const availableRegistrars = [
    { name: "Namecheap", url: links.namecheap },
    { name: "GoDaddy", url: links.godaddy },
    { name: "Porkbun", url: links.porkbun },
    { name: "Cloudflare", url: links.cloudflare },
  ].filter(r => !!r.url)

  if (availableRegistrars.length === 0) return null

  // If only one, just render a direct link
  if (availableRegistrars.length === 1) {
    return (
      <a
        href={availableRegistrars[0].url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "h-7 px-2 flex items-center gap-1 rounded-[4px] text-xs font-medium transition-colors duration-150",
          variant === "primary" ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300" : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300",
          className
        )}
      >
        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        Buy
      </a>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "h-7 px-2 flex items-center gap-1.5 rounded-[4px] text-xs font-medium transition-all duration-150 active:scale-[0.98] outline-none",
          "bg-cyan-400 text-zinc-950 hover:bg-cyan-300",
          className
        )}
      >
        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        Buy...
        <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 z-[100] bg-zinc-900 border-zinc-800">
        {availableRegistrars.map((r) => (
          <DropdownMenuItem key={r.name} className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100 text-zinc-300 text-xs p-0">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full px-2 py-2">
              <span>{r.name}</span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
