import { Link } from 'react-router-dom';

import { PlugrChatWidget } from '@/app/components/plugr-chat-widget';

const BLUE = '#0055ff';
const INK = '#0d0e1a';

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

export function AboutPage() {
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
              color: BLUE,
              fontWeight: 600,
            }}
          >
            Company
          </span>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0.5rem 0 0.75rem',
            }}
          >
            About Plugr
          </h1>
        </div>

        <Section title="Who we are">
          <P>
            Plugr is a visual workflow automation platform with an AI builder
            that discovers live integration actions and fields, then creates a
            flow you can inspect, validate, and test.
          </P>
          <P>
            <strong style={{ color: '#fff' }}>
              Plugr is a product of REMSHIELD SOLUTIONS LTD
            </strong>
            , a registered company. Plugr is one of several products operated by
            REMSHIELD SOLUTIONS LTD.
          </P>
        </Section>

        <Section title="Registered business information">
          <P>
            <strong style={{ color: '#fff' }}>Legal business name:</strong>{' '}
            REMSHIELD SOLUTIONS LTD
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Registered address:</strong>
            <br />
            1, Bazyjacobs Estate, Irhirhi Road
            <br />
            Benin City, Edo State
            <br />
            Nigeria
          </P>
        </Section>

        <Section title="Contact us">
          <P>
            <strong style={{ color: '#fff' }}>Email:</strong>{' '}
            <a href="mailto:support@plugr.cloud" style={{ color: BLUE }}>
              support@plugr.cloud
            </a>
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Phone / WhatsApp:</strong>{' '}
            <a href="tel:+447776530083" style={{ color: BLUE }}>
              +44 7776 530083
            </a>
          </P>
          <P>
            <strong style={{ color: '#fff' }}>Website:</strong>{' '}
            <a href="https://plugr.cloud" style={{ color: BLUE }}>
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
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}
          >
            © {new Date().getFullYear()} REMSHIELD SOLUTIONS LTD. All rights
            reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link
              to="/"
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Home
            </Link>
            <Link
              to="/privacy"
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Privacy
            </Link>
          </div>
        </div>
      </main>
      <PlugrChatWidget />
    </div>
  );
}
