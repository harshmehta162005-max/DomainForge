import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes safely — handles conflicts correctly.
 * Always use this instead of clsx() or template literals for Tailwind.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a domain for display — ensures lowercase, no protocol.
 * "BREWLY.AI" → "brewly.ai"
 */
export function formatDomain(domain: string): string {
  return domain.toLowerCase().replace(/^https?:\/\//, "")
}

/**
 * Extract TLD from a full domain string.
 * "brewly.ai" → ".ai"
 */
export function extractTld(domain: string): string {
  const parts = formatDomain(domain).split(".")
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ""
}

/**
 * Extract base name from a full domain string.
 * "brewly.ai" → "brewly"
 */
export function extractBaseName(domain: string): string {
  return formatDomain(domain).split(".")[0] ?? domain
}

/**
 * Generate a Namecheap search URL for a domain.
 */
export function namecheapUrl(domain: string): string {
  // TODO: Remember to replace 'YOUR_NAMECHEAP_AFFILIATE_ID' with your actual affiliate ID later!
  return `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}&affId=YOUR_NAMECHEAP_AFFILIATE_ID`
}

/**
 * Generate a GoDaddy search URL for a domain.
 * TODO: Remember to replace 'YOUR_GODADDY_AFFILIATE_ID' with your actual affiliate ID later!
 */
export function godaddyUrl(domain: string): string {
  return `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domain)}&isc=YOUR_GODADDY_AFFILIATE_ID`
}

/**
 * Simple SHA-256 hash for cache keys (works in Edge runtime).
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Sleep for N milliseconds — use sparingly in server code.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
