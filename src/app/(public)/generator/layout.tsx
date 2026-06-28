import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Name Generator — DomainForge",
  description: "AI-powered domain name generator. Describe your project and get instant, scored domain suggestions with live availability checking.",
}

export default function GeneratorLayout({ children }: { children: React.ReactNode }) {
  return children
}
