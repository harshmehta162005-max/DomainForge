import { Resend } from "resend"
import { env } from "@/lib/env"

// Singleton instance to avoid multiple instantiations
let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient && env.RESEND_API_KEY) {
    resendClient = new Resend(env.RESEND_API_KEY)
  }
  return resendClient
}

export interface WatchlistAlertEmailProps {
  to: string
  domain: string
  registrarLink: string
}

export async function sendWatchlistAlertEmail({ to, domain, registrarLink }: WatchlistAlertEmailProps) {
  const client = getResendClient()
  if (!client) {
    console.warn("[Email] Resend API key not configured. Skipping alert for:", domain)
    return false
  }

  try {
    const { error } = await client.emails.send({
      from: "DomainForge Alerts <alerts@domainforge.app>", // Update with verified domain if deploying to production
      to,
      subject: `🎉 Good news! ${domain} is now available`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #18181b;">
          <h2 style="color: #22d3ee;">DomainForge Watchlist Alert</h2>
          <p>Hi there,</p>
          <p>Great news! A domain on your watchlist is now available to register:</p>
          <div style="padding: 16px; background-color: #f4f4f5; border-radius: 8px; margin: 24px 0; font-size: 20px; text-align: center; font-family: monospace;">
            <strong>${domain}</strong>
          </div>
          <p>Domains can be snatched up quickly, so we recommend registering it as soon as possible if you're still interested.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${registrarLink}" style="background-color: #22d3ee; color: #09090b; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Register Domain Now
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
          <p style="font-size: 12px; color: #71717a;">
            You received this because you enabled email alerts for this domain in your DomainForge watchlist.<br/>
            To stop receiving these alerts, go to your <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/watchlist" style="color: #06b6d4;">watchlist settings</a> and turn off alerts.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("[Email] Failed to send email:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[Email] Exception sending email:", error)
    return false
  }
}
