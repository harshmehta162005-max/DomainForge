import type { Metadata } from "next"
import DomainDetailsClient from "./DomainDetailsClient"

export async function generateMetadata(
  props: { params: Promise<{ domain: string }> }
): Promise<Metadata> {
  const { domain } = await props.params
  const decoded = decodeURIComponent(domain)
  return {
    title: `${decoded} — Trademark & Brand Risk | DomainForge`,
    description: `AI trademark risk assessment, social handle availability, and alternative TLD analysis for ${decoded}.`,
  }
}

export default async function DomainPage(props: { params: Promise<{ domain: string }> }) {
  const params = await props.params
  const domain = params.domain

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <DomainDetailsClient domain={domain} />
      </div>
    </div>
  )
}
