import { Metadata } from "next"
import DomainDetailsClient from "./DomainDetailsClient"

export const metadata: Metadata = {
  title: "Domain Details | DomainForge",
  description: "Detailed analysis and trademark risk assessment for domain.",
}

export default async function DomainPage(props: { params: Promise<{ domain: string }> }) {
  const params = await props.params;
  const domain = params.domain

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <DomainDetailsClient domain={domain} />
      </div>
    </div>
  )
}
