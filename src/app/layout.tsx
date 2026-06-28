import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { JetBrains_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "DomainForge — AI Domain Name Generator",
    template: "%s | DomainForge",
  },
  description:
    "Find the perfect domain name for your business using AI. Real-time availability checking across 1000+ TLDs.",
  keywords: ["domain name generator", "AI domain names", "domain availability", "startup names"],
  authors: [{ name: "DomainForge" }],
  openGraph: {
    title: "DomainForge — AI Domain Name Generator",
    description: "Find the perfect domain name for your business using AI.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-950 text-zinc-50 min-h-screen`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
