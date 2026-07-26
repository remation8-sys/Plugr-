import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { PlugrChatWidget } from '@/app/components/plugr-chat-widget';

const BLUE = '#0055ff';
const BLUE_TEXT = '#6b8cff';
const INK = '#0d0e1a';

const LAST_UPDATED = 'July 18, 2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
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

function P({ children }: { children: ReactNode }) {
  return <p style={{ marginBottom: '0.75rem' }}>{children}</p>;
}

function Ul({ children }: { children: ReactNode }) {
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

function Li({ children }: { children: ReactNode }) {
  return <li style={{ marginBottom: '0.35rem' }}>{children}</li>;
}

export function TermsPage() {
  return (
    <div
      style={{
        background: INK,
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'rgba(255,255,255,0.65)',
      }}
    >
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
          Back to home
        </Link>
      </nav>

      <main
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '3rem 2rem 5rem',
        }}
      >
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
            Terms and Conditions
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

        <Section title="1. Acceptance of Terms">
          <P>
            Plugr is operated by REMSHIELD SOLUTIONS LTD (&quot;Plugr&quot;,
            &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms and
            Conditions govern your access to and use of plugr.cloud, the Plugr
            web application, workflow automation tools, AI-assisted builder,
            integrations, billing features, and related services.
          </P>
          <P>
            By creating an account, connecting an integration, starting a paid
            subscription, or otherwise using Plugr, you agree to these Terms. If
            you use Plugr for a company or other organisation, you confirm that
            you have authority to accept these Terms on its behalf.
          </P>
          <P>
            You must be at least 18 years old, or the age of majority in your
            country, to use Plugr.
          </P>
        </Section>

        <Section title="2. What Plugr Does">
          <P>
            Plugr is a software-as-a-service workflow automation platform. It
            lets users create, manage, and run automated workflows across apps,
            APIs, webhooks, AI tools, and connected business systems.
          </P>
          <P>
            Plugr is not a bank, payment institution, legal adviser, tax
            adviser, medical adviser, financial adviser, or replacement for
            professional judgement. You are responsible for reviewing workflows
            before they are activated and for confirming that their outputs are
            suitable for your use.
          </P>
        </Section>

        <Section title="3. Accounts and Security">
          <Ul>
            <Li>
              You must provide accurate account, billing, and contact details.
            </Li>
            <Li>
              You are responsible for keeping your login credentials secure and
              for all activity under your account.
            </Li>
            <Li>
              You must notify us promptly at{' '}
              <a href="mailto:support@plugr.cloud" style={{ color: BLUE_TEXT }}>
                support@plugr.cloud
              </a>{' '}
              if you suspect unauthorised account access.
            </Li>
            <Li>
              We may suspend access if we reasonably believe your account is
              compromised or being used in breach of these Terms.
            </Li>
          </Ul>
        </Section>

        <Section title="4. Subscriptions, Billing, and Renewals">
          <P>
            Plugr is a paid subscription service. We do not provide a free trial
            unless a trial or promotion is expressly shown to you in writing at
            checkout.
          </P>
          <P>
            Paid access begins after a successful payment. By starting a
            subscription, you authorise us and our payment processors to charge
            your selected payment method at checkout and automatically on each
            renewal date for the billing cycle you choose, such as monthly,
            quarterly, biannual, or annual billing.
          </P>
          <P>
            Prices, currencies, plan limits, credits, and available features are
            shown on the pricing page or during checkout. Taxes, bank charges,
            currency conversion charges, card issuer fees, and payment-provider
            fees may apply and are your responsibility unless stated otherwise.
          </P>
          <P>
            If a payment fails, is reversed, is disputed, or cannot be verified,
            we may withhold, downgrade, or suspend paid access until payment is
            completed.
          </P>
        </Section>

        <Section title="5. Cancellation and Refunds">
          <P>
            You may cancel your subscription at any time. Cancellation stops the
            next renewal charge, but paid access continues until the end of the
            current billing period.
          </P>
          <P>
            Except where required by law, subscription payments are generally
            non-refundable after purchase. However, if Plugr is not the right
            fit, you may request a refund within 3 days of your first paid
            subscription payment.
          </P>
          <P>
            Duplicate charges, accidental overbilling, or clear billing errors
            will be corrected and refunded to the original payment method.
            Refunds may be denied for heavy paid-resource usage, fraud,
            chargeback misuse, policy abuse, or violations of these Terms.
          </P>
          <P>
            Refunds are returned to the original payment method and may take
            5-10 business days to appear, depending on your bank, card issuer,
            or payment provider.
          </P>
        </Section>

        <Section title="6. Usage Limits and Plan Features">
          <P>
            Some Plugr features are limited by plan tier, usage credits,
            execution volume, AI usage, browser automation usage, number of
            users, connected apps, or other limits shown in the product or on
            the pricing page.
          </P>
          <P>
            We may refuse, throttle, pause, or require an upgrade for usage that
            exceeds your plan limits, harms service reliability, creates
            security risk, or materially increases infrastructure costs.
          </P>
        </Section>

        <Section title="7. Your Workflows, Content, and Data">
          <P>
            You retain ownership of workflows, prompts, inputs, files, execution
            data, and other content you submit to Plugr (&quot;Customer
            Content&quot;). You grant Plugr a limited licence to host, process,
            transmit, copy, and display Customer Content only as needed to
            provide, secure, support, and improve the service.
          </P>
          <P>
            You are responsible for the accuracy, legality, quality, and rights
            associated with your Customer Content, including any data passed
            through third-party integrations.
          </P>
          <P>
            We may collect technical logs, metadata, product usage data, and
            de-identified or aggregated analytics to operate, secure, and
            improve Plugr.
          </P>
        </Section>

        <Section title="8. Third-Party Services and Integrations">
          <P>
            Plugr connects with third-party services such as email providers,
            messaging tools, spreadsheets, CRMs, AI providers, APIs, payment
            processors, and other business applications. You are responsible for
            complying with the terms, policies, rate limits, permissions, and
            laws that apply to those third-party services.
          </P>
          <P>
            Third-party services may change, suspend, fail, reject payments,
            revoke access, limit API calls, or remove features. Plugr is not
            responsible for failures, delays, data loss, rejected transactions,
            or workflow errors caused by third-party services, banks, card
            issuers, payment processors, APIs, or platforms outside our control.
          </P>
        </Section>

        <Section title="9. AI Features">
          <P>
            Plugr may include AI-assisted features that help draft workflows,
            write copy, analyse information, or suggest automation steps. AI
            output can be incomplete, inaccurate, or unsuitable for your use.
          </P>
          <P>
            You are responsible for reviewing AI-generated output before using
            it, especially where workflows affect customers, finances, legal
            obligations, personal data, or business-critical systems.
          </P>
        </Section>

        <Section title="10. Acceptable Use">
          <P>You must not use Plugr to:</P>
          <Ul>
            <Li>
              violate laws, regulations, sanctions, or third-party rights;
            </Li>
            <Li>send spam, phishing, malware, scams, or deceptive messages;</Li>
            <Li>
              collect, expose, or misuse personal data without proper consent or
              lawful basis;
            </Li>
            <Li>
              abuse payment systems, perform fraudulent transactions, or evade
              payment-provider rules;
            </Li>
            <Li>
              attack, overload, scrape, probe, or interfere with Plugr or any
              third-party system;
            </Li>
            <Li>
              reverse engineer, copy, resell, sublicense, or offer Plugr as a
              competing hosted service without written permission;
            </Li>
            <Li>
              use Plugr for harmful, violent, hateful, exploitative, or unlawful
              content or activity.
            </Li>
          </Ul>
        </Section>

        <Section title="11. Suspension and Termination">
          <P>
            We may suspend or terminate your access to Plugr if you breach these
            Terms, fail to pay fees, create security or reliability risk, misuse
            the service, violate third-party rules, or if suspension is required
            by law, payment providers, banks, regulators, or infrastructure
            providers.
          </P>
          <P>
            You may stop using Plugr at any time. Some provisions, including
            payment obligations, ownership, disclaimers, liability limits,
            indemnity, and dispute provisions, continue after termination.
          </P>
        </Section>

        <Section title="12. Intellectual Property">
          <P>
            Plugr and its software, design, branding, documentation, templates,
            and underlying technology are owned by us or our licensors. These
            Terms do not transfer ownership of Plugr to you.
          </P>
          <P>
            If you provide feedback or suggestions, you allow us to use them
            without restriction or compensation.
          </P>
        </Section>

        <Section title="13. Service Availability and Changes">
          <P>
            We aim to keep Plugr reliable, but we do not guarantee uninterrupted
            or error-free service. We may modify, pause, remove, or discontinue
            features for operational, security, legal, commercial, or product
            reasons.
          </P>
          <P>
            We may update these Terms from time to time. Material changes will
            be communicated by email, in-app notice, or by posting the updated
            Terms. Continued use of Plugr after the effective date means you
            accept the updated Terms.
          </P>
        </Section>

        <Section title="14. Disclaimers and Limitation of Liability">
          <P>
            Plugr is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis. To the maximum extent permitted by law, we
            disclaim warranties of merchantability, fitness for a particular
            purpose, non-infringement, availability, accuracy, and uninterrupted
            operation.
          </P>
          <P>
            To the maximum extent permitted by law, Plugr will not be liable for
            indirect, incidental, special, consequential, exemplary, or punitive
            damages, or for lost profits, revenue, goodwill, data, business
            opportunity, or business interruption.
          </P>
          <P>
            To the maximum extent permitted by law, our total liability for any
            claim relating to Plugr is limited to the amount you paid to Plugr
            in the 3 months before the event giving rise to the claim.
          </P>
        </Section>

        <Section title="15. Indemnity">
          <P>
            You agree to defend, indemnify, and hold harmless Plugr, REMSHIELD
            SOLUTIONS LTD, and our directors, officers, employees, contractors,
            and service providers from claims, losses, damages, liabilities,
            costs, and expenses arising from your use of Plugr, your Customer
            Content, your workflows, your breach of these Terms, or your
            violation of law or third-party rights.
          </P>
        </Section>

        <Section title="16. Governing Law">
          <P>
            These Terms are governed by the laws of England and Wales, except
            where mandatory consumer protection laws in your country require
            otherwise. Courts in England and Wales will have exclusive
            jurisdiction, unless applicable law gives you mandatory rights to
            bring a claim elsewhere.
          </P>
        </Section>

        <Section title="17. Contact">
          <P>For support, billing, or legal questions:</P>
          <P>
            <strong style={{ color: '#fff' }}>Plugr</strong>
            <br />
            Operator: REMSHIELD SOLUTIONS LTD
            <br />
            Email:{' '}
            <a href="mailto:support@plugr.cloud" style={{ color: BLUE_TEXT }}>
              support@plugr.cloud
            </a>
            <br />
            Phone:{' '}
            <a href="tel:+447776530083" style={{ color: BLUE_TEXT }}>
              +44 7776 530083
            </a>
            <br />
            Website:{' '}
            <a href="https://plugr.cloud" style={{ color: BLUE_TEXT }}>
              plugr.cloud
            </a>
          </P>
        </Section>

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
            Copyright {new Date().getFullYear()} REMSHIELD SOLUTIONS LTD. All
            rights reserved.
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
              to="/privacy"
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
      <PlugrChatWidget />
    </div>
  );
}
