import {
  Activity,
  ArrowRight,
  Ban,
  BarChart3,
  Check,
  CreditCard,
  Eye,
  ReceiptText,
  RotateCcw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { PlugrChatWidget } from '@/app/components/plugr-chat-widget';

import { PixelCanvas } from './pixel-canvas';
import { Pricing } from './pricing';
import { ProductTour } from './product-tour';
import { WorkflowCanvas } from './workflow-canvas';

/**
 * Plugr marketing landing page.
 *
 * Visual system from the Stitch "Technical Precision" design — primary blue
 * #0055ff, a light-to-dark narrative, Inter + monospace technical labels, and
 * blueprint grid textures. Colors are applied as explicit values (not the app's
 * cyan/navy tokens) so the page renders its own palette regardless of theme.
 *
 * Self-contained: no flags/auth dependencies, so it can render for logged-out
 * visitors at `/`. Section content reflects what Plugr actually does.
 */

const BLUE = '#0055ff';
const INK = '#0d0e1a';

const HERO_PIXELS = [
  'rgba(0,85,255,0.5)',
  'rgba(107,140,255,0.4)',
  'rgba(255,255,255,0.10)',
  'rgba(255,255,255,0.06)',
  'rgba(0,85,255,0.25)',
];

const INTEGRATIONS = [
  'Slack',
  'Gmail',
  'Google Sheets',
  'Notion',
  'HubSpot',
  'OpenAI',
  'Postgres',
  'Webhooks',
];

const OBS_FEATURES = [
  {
    icon: Eye,
    title: 'Run history & step details',
    body: 'Open a run to inspect its status and step results, then retry a failed run when you are ready.',
  },
  {
    icon: BarChart3,
    title: 'Advanced analytics on Pro',
    body: 'Pro and Business track run volume, active flows, active users, and estimated time saved from values you set.',
  },
];

const DEPLOY_COLS = [
  {
    icon: Server,
    title: 'Fully managed cloud',
    body: 'Plugr runs on our infrastructure — nothing to provision, patch, or scale. Sign in and start building.',
  },
  {
    icon: Activity,
    title: 'Operational visibility',
    body: 'Inspect run history, open any run to see step-by-step results, and retry a failed run whenever you choose.',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted connections',
    body: 'Connection values are encrypted before storage so workflows can use connected accounts without exposing raw credentials.',
  },
];

const REFUND_POLICY_POINTS = [
  {
    icon: ReceiptText,
    title: 'No free trial',
    body: 'Paid plans begin when payment is successfully completed.',
  },
  {
    icon: RotateCcw,
    title: '3-day first-payment window',
    body: 'If Plugr is not the right fit, request a refund within 3 days of your first paid subscription.',
  },
  {
    icon: CreditCard,
    title: 'Billing mistakes are corrected',
    body: 'Duplicate charges, incorrect charges, or accidental overbilling are refunded to the original payment method.',
  },
  {
    icon: Ban,
    title: 'Abuse and heavy usage excluded',
    body: 'Refunds may be denied for excessive paid-resource use, fraud, chargeback misuse, or Terms violations.',
  },
];

const GRID_BG: CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(0,85,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,85,255,0.06) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

function Overline({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'light';
}) {
  return (
    <span
      className="font-mono text-xs font-medium uppercase tracking-[0.15em]"
      style={{ color: tone === 'blue' ? BLUE : 'rgba(255,255,255,0.55)' }}
    >
      {children}
    </span>
  );
}

function PrimaryCta({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold sm:px-6 text-white transition-colors"
      style={{ backgroundColor: BLUE }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0041c8')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
    >
      {children}
    </Link>
  );
}

function PlugrMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <img
        src="/plugr-icon.png"
        alt=""
        className="h-6 w-auto"
        width="24"
        height="24"
        loading="eager"
        decoding="async"
      />
      <span
        className="text-lg font-bold tracking-tight"
        style={{ color: dark ? INK : '#ffffff' }}
      >
        Plugr
      </span>
    </Link>
  );
}

function Nav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'rgba(13,14,26,0.85)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5">
        <PlugrMark />
        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Observability', href: '#observability' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Reliability', href: '#reliability' },
            { label: 'Blog', href: '/blog/' },
            { label: 'About', href: '/about' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            to="/sign-in"
            className="shrink-0 whitespace-nowrap text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <PrimaryCta to="/sign-up">Create account</PrimaryCta>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <PixelCanvas
        colors={HERO_PIXELS}
        className="pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 35%, transparent 0%, #0d0e1a 78%), radial-gradient(ellipse 60% 50% at 20% 0%, rgba(0,85,255,0.18) 0%, transparent 60%)',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <Overline>Visual automation · AI-assisted building</Overline>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Describe the work.{' '}
            <span style={{ color: '#6b8cff' }}>Inspect the workflow.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            Plugr combines a visual workflow canvas with an AI builder that
            discovers integration actions and fields live, then creates a flow
            you can inspect, validate, and test. Run it on events or schedules,
            and trace what happened step by step.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <PrimaryCta to="/sign-up">
              Create account
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </PrimaryCta>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-white/60">
            No free trial. Your first paid subscription has a 3-day refund
            window.
          </p>
        </div>
        <WorkflowCanvas />
      </div>

      {/* Integration strip */}
      <div
        className="relative border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto max-w-6xl px-5 py-8">
          <p className="text-center">
            <Overline tone="light">
              Connects with the tools you already use
            </Overline>
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {INTEGRATIONS.map((name) => (
              <span key={name} className="text-sm font-medium text-white/60">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ObservabilitySection() {
  return (
    <section
      id="observability"
      className="relative overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={GRID_BG}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <Overline>Observability</Overline>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            See what ran. Inspect every step.
          </h2>
          <p className="mt-4 text-lg text-white/65">
            Plugr records run history and step results. Open any run to inspect
            its steps, and retry a failed run whenever you choose.
          </p>
          <div className="mt-8 space-y-6">
            {OBS_FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: 'rgba(0,85,255,0.12)',
                    color: '#6b8cff',
                  }}
                >
                  <feature.icon className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/55">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log panel */}
        <div
          className="overflow-hidden rounded-xl border shadow-2xl"
          style={{
            backgroundColor: '#0a0b14',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <span className="font-mono text-xs text-white/60">
              example run · #8f2a1c
            </span>
            <span
              className="font-mono text-xs font-medium uppercase tracking-wide"
              style={{ color: '#00c853' }}
            >
              ● succeeded
            </span>
          </div>
          <div className="space-y-2 p-5 font-mono text-xs leading-relaxed">
            {[
              ['12:04:01', 'trigger', 'webhook received', '#00c853'],
              ['12:04:01', 'agent', 'classified: refund request', '#6b8cff'],
              ['12:04:02', 'branch', 'matched: priority = high', '#6b8cff'],
              ['12:04:02', 'action', 'created Zendesk ticket', '#00c853'],
              ['12:04:03', 'action', 'notified #support', '#00c853'],
            ].map((row, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-white/60">{row[0]}</span>
                <span className="w-16 shrink-0" style={{ color: row[3] }}>
                  {row[1]}
                </span>
                <span className="text-white/60">{row[2]}</span>
              </div>
            ))}
            <div className="pt-2 text-white/60">
              done · 5 steps · 2.1s · 0 errors
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeploySection() {
  return (
    <section id="reliability" style={{ backgroundColor: '#f3f2ff' }}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Overline>Built for production</Overline>
          <h2
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: INK }}
          >
            Runs in the cloud, ready when your work is.
          </h2>
          <p className="mt-4 text-lg" style={{ color: '#434656' }}>
            Plugr is a fully managed service — we run the servers, keep them
            patched, and scale them so you can focus on your automations.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {DEPLOY_COLS.map((col) => (
            <div
              key={col.title}
              className="rounded-xl border bg-white p-4 sm:p-6"
              style={{ borderColor: '#e1e1ef' }}
            >
              <div
                className="flex size-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(0,85,255,0.08)', color: BLUE }}
              >
                <col.icon className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-lg font-semibold" style={{ color: INK }}>
                {col.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: '#434656' }}
              >
                {col.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RefundPolicySection() {
  return (
    <section id="refund-policy" style={{ backgroundColor: '#faf8ff' }}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Overline>Refund policy</Overline>
            <h2
              className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: INK }}
            >
              Clear billing, no surprise trial.
            </h2>
            <p
              className="mt-4 text-lg leading-relaxed"
              style={{ color: '#434656' }}
            >
              Plugr does not offer a free trial. If your first paid subscription
              is not a fit, you can request a refund within 3 days of your
              initial payment.
            </p>
            <p className="mt-4 text-sm" style={{ color: '#6b6e7c' }}>
              Last updated: July 15, 2026
            </p>
          </div>

          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {REFUND_POLICY_POINTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: '#e1e1ef' }}
                >
                  <div
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: 'rgba(0,85,255,0.08)',
                      color: BLUE,
                    }}
                  >
                    <item.icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="mt-4 text-base font-semibold"
                    style={{ color: INK }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: '#434656' }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-xl border bg-white p-4 sm:p-6"
              style={{ borderColor: '#e1e1ef' }}
            >
              <h3 className="text-base font-semibold" style={{ color: INK }}>
                Additional terms
              </h3>
              <ul
                className="mt-4 space-y-3 text-sm leading-relaxed"
                style={{ color: '#434656' }}
              >
                <li>
                  After the 3-day refund window, subscription payments are
                  generally non-refundable.
                </li>
                <li>
                  You may cancel your subscription at any time. Paid access
                  continues until the end of the current billing period.
                </li>
                <li>
                  Refunds may not be available after significant use of paid
                  resources, including workflow executions, AI usage, automation
                  credits, browser automation runs, or other usage-based
                  features.
                </li>
                <li>
                  Plugr is not responsible for failures caused by third-party
                  services, integrations, banks, payment providers, APIs, or
                  external platforms connected to your workflows.
                </li>
                <li>
                  Refunds are returned to the original payment method and may
                  take 5-10 business days, depending on your bank or payment
                  provider.
                </li>
                <li>
                  Nothing in this policy limits any rights you may have under
                  applicable consumer protection laws.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={GRID_BG}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 120%, rgba(0,85,255,0.2) 0%, transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Turn the next manual process into a workflow.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/65">
          Create an account, choose a paid plan, and start building with the
          Plugr AI builder and monthly Plugr credits.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryCta to="/sign-up">
            Create account
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </PrimaryCta>
          <Link
            to="/sign-in"
            className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ backgroundColor: '#0a0b14' }}>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <PlugrMark />
            <p className="mt-4 text-sm text-white/60">
              Visual workflow automation with an AI builder that discovers live
              tools and keeps every flow visible and editable.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-white/60">
                Product
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-white/65 hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#observability"
                    className="text-white/65 hover:text-white"
                  >
                    Observability
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-white/65 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#refund-policy"
                    className="text-white/65 hover:text-white"
                  >
                    Refund policy
                  </a>
                </li>
                <li>
                  <a
                    href="#reliability"
                    className="text-white/65 hover:text-white"
                  >
                    Reliability
                  </a>
                </li>
                <li>
                  <a href="/blog/" className="text-white/65 hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-white/60">
                Company
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/about" className="text-white/65 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-white/65 hover:text-white"
                  >
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-white/65 hover:text-white">
                    Terms and conditions
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@plugr.cloud"
                    className="text-white/65 hover:text-white"
                  >
                    support@plugr.cloud
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+447776530083"
                    className="text-white/65 hover:text-white"
                  >
                    +44 7776 530083
                  </a>
                </li>
                <li className="max-w-[15rem] text-white/65">
                  <span className="block text-white/60">Commercial office</span>
                  1, Bazyjacobs Estate, Irhirhi Road, Benin City 300102, Edo
                  State, Nigeria
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-white/60">
                Get started
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    to="/sign-in"
                    className="text-white/65 hover:text-white"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sign-up"
                    className="text-white/65 hover:text-white"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div
          className="mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="text-xs text-white/60">
            <p>
              Plugr is a product of{' '}
              <span className="text-white/60">REMSHIELD SOLUTIONS LTD</span>
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} REMSHIELD SOLUTIONS LTD. All rights
              reserved.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-white/60">
            <Check className="size-3" style={{ color: '#00c853' }} />
            Fully managed cloud
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: INK }}>
      <Nav />
      <main>
        <Hero />
        <ProductTour />
        <ObservabilitySection />
        <DeploySection />
        <Pricing />
        <RefundPolicySection />
        <ClosingCta />
      </main>
      <Footer />
      <PlugrChatWidget />
    </div>
  );
}

LandingPage.displayName = 'LandingPage';
