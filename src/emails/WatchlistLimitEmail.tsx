import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
} from "@react-email/components"
import * as React from "react"

interface WatchlistLimitEmailProps {
  userName: string
  appUrl: string
  currentCount: number
  maxLimit: number
}

export const WatchlistLimitEmail: React.FC<Readonly<WatchlistLimitEmailProps>> = ({
  userName = "Domain Hunter",
  appUrl = "http://localhost:3000",
  currentCount = 40,
  maxLimit = 50,
}) => {
  const previewText = `You are approaching your DomainForge watchlist limit (${currentCount}/${maxLimit}).`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>Watchlist Limit Approaching</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            <Text style={paragraph}>
              You have added {currentCount} domains to your watchlist. You are currently on the Free Tier which allows a maximum of {maxLimit} domains to be monitored simultaneously.
            </Text>
            <Text style={paragraph}>
              Once you hit {maxLimit}, you will need to remove some domains to make room for new ones, or upgrade your account to monitor unlimited domains.
            </Text>
            <Section style={btnContainer}>
              <Button style={button} href={`${appUrl}/dashboard/watchlist`}>
                Manage Watchlist
              </Button>
            </Section>
            <Text style={footerText}>
              You are receiving this email because your watchlist hit 80% capacity.
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

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
}

const button = {
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

export default WatchlistLimitEmail
