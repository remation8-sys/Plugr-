import { t } from 'i18next';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Plug,
  Workflow,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/**
 * Plugr marketing landing page.
 *
 * Self-contained (no flags/auth dependencies) so it can render for logged-out
 * visitors at `/`. Uses the Plugr semantic color tokens throughout — renders
 * dark navy regardless of theme state because `--background` is navy in both
 * `:root` and `.dark`.
 */

const FEATURES = [
  {
    icon: Workflow,
    title: 'Visual flow builder',
    body: 'Drag, drop, done. Build automations on a canvas your whole team can read — no code, no bottlenecks.',
  },
  {
    icon: Bot,
    title: 'AI agents that do the work',
    body: "Hand off the judgment calls. Plugr's AI agents read, decide, and act right inside your workflows.",
  },
  {
    icon: Plug,
    title: 'Hundreds of integrations',
    body: 'Connect the tools you already use. From Slack to Sheets to your CRM, your stack finally talks to itself.',
  },
  {
    icon: Zap,
    title: 'Triggers for everything',
    body: 'Start a flow on a new email, a webhook, a schedule, or a button. If it happens, Plugr can react to it.',
  },
  {
    icon: BarChart3,
    title: 'Impact analytics',
    body: 'See what your automations actually save. Track runs, time saved, and results — not just activity.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect your apps',
    body: 'Link your tools in a few clicks with secure, managed connections.',
  },
  {
    step: '02',
    title: 'Build your flow',
    body: 'Lay out triggers and actions on the visual canvas — or let an AI agent draft it for you.',
  },
  {
    step: '03',
    title: 'Run on autopilot',
    body: 'Plugr watches for your triggers and runs the workflow for you, 24/7.',
  },
  {
    step: '04',
    title: 'Measure the impact',
    body: 'Watch the hours pile back up in your analytics dashboard.',
  },
];

const PROOF = [
  'Hundreds of integrations',
  'No-code visual builder',
  'AI-native automation',
  'Self-hostable',
];

function PlugrMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src="/logo.svg" alt="" className="h-6 w-auto" />
      <span className="text-lg font-semibold tracking-tight text-foreground font-sentient">
        Plugr
      </span>
    </Link>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <PlugrMark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/sign-in">{t('Sign in')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/sign-up">{t('Get started free')}</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Brand glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -10%, rgb(0 212 255 / 0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 85% 30%, rgb(0 255 133 / 0.08) 0%, transparent 55%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t('Automation that runs itself')}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-sentient">
          {t('Put your busywork on autopilot.')}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t(
            'Plugr connects your apps and runs your repetitive workflows for you — with a visual builder, AI agents, and hundreds of integrations. No code required.',
          )}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="xl" className="w-full sm:w-auto">
            <Link to="/sign-up">
              {t('Start automating free')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
            <a href="#how-it-works">{t('See how it works')}</a>
          </Button>
        </div>

        {/* Proof strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {PROOF.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Check className="size-4 text-success" />
              {t(item)}
            </span>
          ))}
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/** Abstract automation-flow visual built from brand-tokened nodes. */
function HeroVisual() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-10">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          {[
            { label: 'Trigger', sub: 'New email', accent: 'text-primary' },
            { label: 'AI Agent', sub: 'Classify & draft', accent: 'text-success' },
            { label: 'Action', sub: 'Send to Slack', accent: 'text-primary' },
          ].map((node, i, arr) => (
            <div key={node.label} className="flex flex-1 items-center gap-4">
              <div className="flex-1 rounded-xl border border-border bg-background p-4 text-left">
                <div className={`text-xs font-semibold ${node.accent}`}>
                  {t(node.label)}
                </div>
                <div className="mt-1 text-sm text-foreground">{t(node.sub)}</div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sentient">
          {t('Everything you need to automate')}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t(
            'One platform for the whole loop — connect, build, run, and measure your automations.',
          )}
        </p>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t(feature.title)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(feature.body)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sentient">
            {t('From busywork to autopilot in four steps')}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t('No setup headaches. You could ship your first flow today.')}
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="text-sm font-semibold text-primary">
                {step.step}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {t(step.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(step.body)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 120%, rgb(0 212 255 / 0.14) 0%, transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl font-sentient">
          {t("Your busywork isn't going to automate itself.")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t('Spin up your first automation in minutes. Free to start.')}
        </p>
        <div className="mt-9 flex justify-center">
          <Button asChild size="xl">
            <Link to="/sign-up">
              {t('Start automating free')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <PlugrMark />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/sign-in" className="hover:text-foreground transition-colors">
            {t('Sign in')}
          </Link>
          <Link to="/sign-up" className="hover:text-foreground transition-colors">
            {t('Get started')}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Plugr
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

LandingPage.displayName = 'LandingPage';