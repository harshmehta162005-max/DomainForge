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

interface DomainAlertEmailProps {
  domain: string
  alertType: "available" | "expiring" | "price_drop"
  appUrl: string
  extraData?: string // e.g. price, days to expiry
}

export const DomainAlertEmail: React.FC<Readonly<DomainAlertEmailProps>> = ({
  domain = "example.com",
  alertType = "available",
  appUrl = "http://localhost:3000",
  extraData = "",
}) => {
  let subject = ""
  let headline = ""
  let bodyText = ""

  if (alertType === "available") {
    subject = `🎉 ${domain} is now available!`
    headline = "Domain Available"
    bodyText = `Great news! The domain you are watching, ${domain}, is now available to register.`
  } else if (alertType === "expiring") {
    subject = `⏰ ${domain} expires in ${extraData} days`
    headline = "Domain Expiring Soon"
    bodyText = `The domain ${domain} is expiring in ${extraData} days. Keep a close eye on it if you're looking to acquire it via drop catching or auction.`
  } else if (alertType === "price_drop") {
    subject = `💰 Price drop for ${domain}`
    headline = "Price Drop Alert"
    bodyText = `The estimated price for ${domain} has dropped to ${extraData}.`
  }

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>DomainForge Alerts</Text>
          </Section>
          <Section style={content}>
            <Text style={heading}>{headline}</Text>
            <Text style={paragraph}>{bodyText}</Text>
            <Section style={btnContainer}>
              <Button style={button} href={`${appUrl}/dashboard`}>
                View in Dashboard
              </Button>
            </Section>
            {alertType === "available" && (
              <Text style={footerText}>
                We have disabled further alerts for this domain.
              </Text>
            )}
            <Text style={footerText}>
              You are receiving this email because you enabled alerts for this domain on DomainForge. 
              Manage your preferences in the Watchlist dashboard.
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
}

const headerText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18181b",
}

const content = {
  padding: "0 48px",
}

const heading = {
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
  backgroundColor: "#06b6d4", // cyan-500
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
}

export default DomainAlertEmail
