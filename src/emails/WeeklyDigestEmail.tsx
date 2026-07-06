import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components"
import * as React from "react"

export interface DigestItem {
  domain: string
  status: string
  score: number
  expiresAt: string | null
  priceEstimate: string | null
}

interface WeeklyDigestEmailProps {
  userName: string
  appUrl: string
  newAvailable: DigestItem[]
  expiringSoon: DigestItem[]
  priceDrops: DigestItem[]
}

export const WeeklyDigestEmail: React.FC<Readonly<WeeklyDigestEmailProps>> = ({
  userName = "Domain Hunter",
  appUrl = "http://localhost:3000",
  newAvailable = [],
  expiringSoon = [],
  priceDrops = [],
}) => {
  const totalUpdates = newAvailable.length + expiringSoon.length + priceDrops.length
  const previewText = `Your weekly DomainForge summary is here. ${totalUpdates} updates to your watchlist.`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>DomainForge Weekly Digest</Text>
          </Section>
          
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            <Text style={paragraph}>
              Here is your weekly summary of the domains you are monitoring. 
              {totalUpdates === 0 && " Things have been quiet this week, no major changes."}
            </Text>

            {newAvailable.length > 0 && (
              <>
                <Hr style={divider} />
                <Text style={sectionTitle}>🎉 Newly Available</Text>
                {newAvailable.map((item) => (
                  <div key={item.domain} style={itemRow}>
                    <Text style={domainName}>{item.domain}</Text>
                    <Button style={actionButton} href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}>
                      Register Now
                    </Button>
                  </div>
                ))}
              </>
            )}

            {expiringSoon.length > 0 && (
              <>
                <Hr style={divider} />
                <Text style={sectionTitle}>⏰ Expiring Soon</Text>
                {expiringSoon.map((item) => (
                  <div key={item.domain} style={itemRow}>
                    <Text style={domainName}>{item.domain}</Text>
                    <Text style={metaText}>Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "Soon"}</Text>
                  </div>
                ))}
              </>
            )}

            {priceDrops.length > 0 && (
              <>
                <Hr style={divider} />
                <Text style={sectionTitle}>💰 Price Drops</Text>
                {priceDrops.map((item) => (
                  <div key={item.domain} style={itemRow}>
                    <Text style={domainName}>{item.domain}</Text>
                    <Text style={metaText}>Now: {item.priceEstimate}</Text>
                  </div>
                ))}
              </>
            )}

            <Section style={btnContainer}>
              <Button style={primaryButton} href={`${appUrl}/dashboard/watchlist`}>
                View Full Watchlist
              </Button>
            </Section>

            <Text style={footerText}>
              You are receiving this email because you opted into Weekly Digests. 
              Manage your preferences in your <a href={`${appUrl}/settings/notifications`} style={{color: "#06b6d4"}}>Account Settings</a>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e4e4e7",
  borderRadius: "8px",
}

const header = {
  padding: "0 48px",
  backgroundColor: "#18181b",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  marginTop: "-20px",
  paddingTop: "24px",
  paddingBottom: "24px",
}

const headerText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: 0,
}

const content = {
  padding: "24px 48px",
}

const greeting = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#27272a",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#52525b",
}

const divider = {
  borderColor: "#e4e4e7",
  margin: "32px 0",
}

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#18181b",
  marginBottom: "16px",
}

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  backgroundColor: "#fafafa",
  border: "1px solid #f4f4f5",
  borderRadius: "6px",
  marginBottom: "8px",
}

const domainName = {
  fontSize: "16px",
  fontWeight: "600",
  fontFamily: "monospace",
  color: "#09090b",
  margin: 0,
}

const metaText = {
  fontSize: "14px",
  color: "#71717a",
  margin: 0,
}

const actionButton = {
  backgroundColor: "#22c55e", 
  borderRadius: "4px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "6px 12px",
}

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "48px",
  marginBottom: "32px",
}

const primaryButton = {
  backgroundColor: "#06b6d4", 
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
}

const footerText = {
  fontSize: "12px",
  color: "#a1a1aa",
  marginTop: "24px",
  textAlign: "center" as const,
}

export default WeeklyDigestEmail
