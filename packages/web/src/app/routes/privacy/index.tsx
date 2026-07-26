import { Link } from 'react-router-dom';

import { PlugrChatWidget } from '@/app/components/plugr-chat-widget';

const BLUE = '#0055ff';
const BLUE_TEXT = '#6b8cff';
const INK = '#0d0e1a';

const LAST_UPDATED = 'July 26, 2026';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: '0.75rem',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7,
          fontSize: '0.9375rem',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: '0.75rem' }}>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        paddingLeft: '1.5rem',
        marginBottom: '0.75rem',
        listStyleType: 'disc',
      }}
    >
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: '0.35rem' }}>{children}</li>;
}

export function PrivacyPage() {
  return (
    <div
      style={{
        background: INK,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'rgba(255,255,255,0.65)',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          <svg
            viewBox="0 0 22 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '22px', height: '19px' }}
          >
            <path
              d="M6.46013 5.81759C5.30809 4.10962 5.75876 1.79113 7.46672 0.639093C9.17469 -0.512944 11.4932 -0.0622757 12.6452 1.64569L20.4261 13.1813C21.5781 14.8893 21.1274 17.2077 19.4195 18.3598C17.7115 19.5118 15.393 19.0611 14.241 17.3532L10.8676 12.3519C10.4339 11.8054 9.55114 11.8905 9.02108 12.4205C8.58152 12.8601 8.43761 13.9846 8.31301 14.9582C8.29474 15.1009 8.27689 15.2405 8.25858 15.3741C8.19097 16.0114 7.97092 16.6418 7.58762 17.2101C6.33511 19.067 3.81375 19.5565 1.95682 18.304C0.0998936 17.0515 -0.390738 14.5304 0.861776 12.6734C1.51136 11.7104 2.50224 11.1151 3.56472 10.9399L3.56322 10.9384C6.63307 10.4932 7.20222 7.02864 6.64041 6.08487L6.46013 5.81759Z"
              fill={BLUE}
            />
          </svg>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Plugr
          </span>
        </Link>
        <Link
          to="/"
          style={{
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
          }}
        >
          ← Back to home
        </Link>
      </nav>

      {/* Content */}
      <main
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '3rem 2rem 5rem',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BLUE_TEXT,
              fontWeight: 600,
            }}
          >
            Legal
          </span>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: '0.5rem 0 0.75rem',
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.875rem',
            }}
          >
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <Section title="1. Introduction">
          <P>
            Plugr (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates
            plugr.cloud, a no-code automation platform that lets you connect
            apps and automate workflows. This Privacy Policy explains what data
            we collect, how we use it, and your rights.
          </P>
          <P>
            By using Plugr, you agree to the practices described in this policy.
            If you do not agree, please do not use our service.
          </P>
        </Section>

        <Section title="2. Data We Collect">
          <P>
            <strong style={{ color: '#fff' }}>Account information</strong> —
            when you sign up we collect your name, email address, and a hashed
            password.
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Automation data</strong> — flow
            definitions (triggers, steps, logic) you create inside Plugr, along
            with execution logs (timestamps, success/failure status, and any
            data your flow explicitly passes between steps).
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Connection credentials</strong> —
            when you connect a third-party app (e.g. Gmail, Slack), we store the
            OAuth access token or API key needed to act on your behalf. All
            credentials are encrypted at rest using AES-256.
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Usage data</strong> — basic
            telemetry such as page views, feature usage, and error logs used to
            improve the product.
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Browser notification data</strong>{' '}
            — if you opt in, we store the push endpoint and browser-generated
            encryption keys needed to deliver flow-failure notifications to that
            device. We do not use this data for advertising.
          </P>
        </Section>

        <Section title="3. Google API Services — Gmail">
          <P>
            Plugr&apos;s use and transfer to any other app of information
            received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              style={{ color: BLUE_TEXT }}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </P>
          <P>
            When you connect your Gmail account, Plugr may request access to:
          </P>
          <Ul>
            <Li>View your email messages and settings (read access)</Li>
            <Li>Send email on your behalf</Li>
            <Li>Manage drafts and send emails</Li>
            <Li>
              Read, compose, send, and manage your email (modify access — needed
              for labeling, archiving, and spam-related automations)
            </Li>
          </Ul>
          <P>
            <strong style={{ color: '#fff' }}>
              We do not read, store, or share the content of your emails.
            </strong>{' '}
            OAuth tokens are stored encrypted and are used solely to execute the
            automations you configure. Email content is never written to our
            database — it flows through your automation and is delivered to the
            next step (e.g. Slack or a spreadsheet) as you configured.
          </P>
          <P>
            We do not use Gmail data to serve advertising, train AI models, or
            share with third parties for their own purposes. We do not allow
            humans to read your Gmail data unless you explicitly share it with
            us for support.
          </P>
        </Section>

        <Section title="4. How We Use Your Data">
          <Ul>
            <Li>To provide, operate, and improve the Plugr service</Li>
            <Li>To authenticate you and secure your account</Li>
            <Li>
              To execute your automation workflows on your behalf using
              credentials you provide
            </Li>
            <Li>
              To send transactional emails (password resets, billing receipts)
            </Li>
            <Li>
              To send browser notifications you explicitly enable for production
              flow failures
            </Li>
            <Li>To respond to support requests</Li>
            <Li>To comply with legal obligations</Li>
          </Ul>
          <P>We do not sell your personal data to third parties.</P>
        </Section>

        <Section title="5. Data Storage and Security">
          <P>
            Your data is stored on servers located in the European Union. All
            data in transit is protected with TLS 1.2+. Credentials and OAuth
            tokens are encrypted at rest with AES-256 before being written to
            the database.
          </P>
          <P>
            We enforce multi-tenant data isolation — each user account&apos;s
            data is strictly separated and inaccessible to other users.
          </P>
        </Section>

        <Section title="6. Third-Party Services">
          <P>
            To deliver our service we use the following third-party providers:
          </P>
          <Ul>
            <Li>
              <strong style={{ color: '#fff' }}>Hostinger</strong> — cloud
              hosting and infrastructure
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Flutterwave</strong> — payment
              processing (we do not store card numbers)
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>OpenRouter / Anthropic</strong>{' '}
              — AI assistant feature (no user data is sent unless you use the AI
              chat)
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Google</strong> — OAuth
              authentication for Gmail and Google integrations
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Browser push providers</strong>{' '}
              — Apple, Google, Microsoft, or Mozilla may relay an encrypted
              notification to your browser when you opt in
            </Li>
          </Ul>
          <P>
            Each provider has its own privacy policy. We share only the minimum
            data required to deliver the service.
          </P>
        </Section>

        <Section title="7. Data Retention">
          <P>
            We retain your account data for as long as your account is active.
            Automation execution logs are kept for 30 days by default. You can
            delete individual logs or your entire account at any time.
          </P>
          <P>
            When you disconnect a third-party app (e.g. revoke Gmail access),
            the corresponding credentials are deleted from our database
            immediately.
          </P>
          <P>
            Browser notification subscriptions are removed when you disable
            notifications or log out on that device. Expired subscriptions are
            deleted automatically when the browser provider reports them as
            invalid.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>You have the right to:</P>
          <Ul>
            <Li>
              <strong style={{ color: '#fff' }}>Access</strong> — request a copy
              of the personal data we hold about you
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Correction</strong> — update
              inaccurate data via your account settings
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Deletion</strong> — delete your
              account and all associated data at any time
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>Portability</strong> — export
              your flows and data in a machine-readable format
            </Li>
            <Li>
              <strong style={{ color: '#fff' }}>
                Revoke third-party access
              </strong>{' '}
              — disconnect any app connection from your Plugr settings; this
              immediately deletes the stored credential
            </Li>
          </Ul>
          <P>
            To exercise any right, email us at{' '}
            <a href="mailto:privacy@plugr.cloud" style={{ color: BLUE_TEXT }}>
              privacy@plugr.cloud
            </a>
            . We will respond within 30 days.
          </P>
        </Section>

        <Section title="9. Cookies">
          <P>
            Plugr uses only essential cookies necessary to maintain your login
            session. We do not use advertising or tracking cookies.
          </P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>
            Plugr is not directed at children under 13. We do not knowingly
            collect personal data from children. If you believe a child has
            provided us with personal data, contact us and we will delete it.
          </P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>
            We may update this policy as our service evolves. Material changes
            will be communicated via email or an in-app notice at least 14 days
            before taking effect. Continued use of Plugr after changes
            constitutes acceptance.
          </P>
        </Section>

        <Section title="12. Contact Us">
          <P>For any privacy-related questions or requests:</P>
          <P>
            <strong style={{ color: '#fff' }}>Plugr</strong>
            <br />
            Email:{' '}
            <a href="mailto:privacy@plugr.cloud" style={{ color: BLUE_TEXT }}>
              privacy@plugr.cloud
            </a>
            <br />
            Website:{' '}
            <a href="https://plugr.cloud" style={{ color: BLUE_TEXT }}>
              plugr.cloud
            </a>
          </P>
        </Section>

        {/* Footer note */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '2rem',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span
            style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8125rem' }}
          >
            © {new Date().getFullYear()} REMSHIELD SOLUTIONS LTD. All rights
            reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link
              to="/"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Home
            </Link>
            <Link
              to="/about"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              About
            </Link>
            <Link
              to="/terms"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Terms
            </Link>
            <Link
              to="/sign-in"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
      <PlugrChatWidget />
    </div>
  );
}
