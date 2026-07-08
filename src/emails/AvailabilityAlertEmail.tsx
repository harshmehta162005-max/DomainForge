import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from '@react-email/components';

interface AvailabilityAlertEmailProps {
  userName: string;
  domain: string;
  appUrl: string;
}

export const AvailabilityAlertEmail: React.FC<Readonly<AvailabilityAlertEmailProps>> = ({
  userName = 'User',
  domain = 'example.com',
  appUrl = 'http://localhost:3000',
}) => (
  <Html>
    <Head />
    <Preview>Good news! {domain} is now available to register.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>DomainForge</Text>
        </Section>
        
        <Section style={content}>
          <Text style={h1}>Domain Available!</Text>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            We have been monitoring your watchlist, and great news—the domain <strong>{domain}</strong> has just changed its status to <strong>Available</strong>.
          </Text>
          <Text style={text}>
            If you want to secure this domain, we recommend registering it as soon as possible before someone else does.
          </Text>
          
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${appUrl}/dashboard/watchlist`}
            >
              Go to Watchlist
            </Button>
          </Section>
          
          <Text style={footerText}>
            You received this email because you have "Availability Alerts" turned on in your DomainForge settings. 
            You can disable these alerts in your <a href={`${appUrl}/dashboard/settings`} style={link}>account settings</a>.
          </Text>
        </Section>
        
        <Hr style={hr} />
        <Text style={footer}>
          © 2026 DomainForge. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#09090b',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '8px',
  overflow: 'hidden',
};

const header = {
  padding: '24px 32px',
  backgroundColor: '#09090b',
  borderBottom: '1px solid #27272a',
};

const logoText = {
  color: '#fafafa',
  fontSize: '20px',
  fontWeight: '600',
  margin: 0,
};

const content = {
  padding: '32px',
};

const h1 = {
  color: '#fafafa',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const text = {
  color: '#a1a1aa',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#22d3ee',
  borderRadius: '4px',
  color: '#09090b',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
};

const hr = {
  borderColor: '#27272a',
  margin: '0',
};

const footer = {
  color: '#71717a',
  fontSize: '12px',
  textAlign: 'center' as const,
  padding: '24px 32px 0',
};

const footerText = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '32px 0 0',
};

const link = {
  color: '#22d3ee',
  textDecoration: 'underline',
};

export default AvailabilityAlertEmail;
