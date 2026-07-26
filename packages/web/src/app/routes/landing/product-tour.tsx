import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Database,
  Mail,
  Webhook,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

import { AgentChat } from './agent-chat';

/**
 * Interactive product-tour section for the landing page.
 *
 * Blends the 21st.dev tabbed feature block with the AI chat card — tabbed,
 * state-driven, recolored to the Stitch palette. Each tab pairs Plugr copy with
 * a dark "product" visual; the AI tab embeds the interactive agent chat.
 */

const BLUE = '#0055ff';
const BLUE_TEXT = '#6b8cff';
const INK = '#0d0e1a';
const GREEN = '#00c853';

type TabId = 'build' | 'ai' | 'measure';

const TABS: {
  id: TabId;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}[] = [
  {
    id: 'build',
    label: 'Build visually',
    icon: Workflow,
    title: 'Drag, drop, automate.',
    description:
      'Lay out triggers and actions on a visual canvas. Start no-code, then add code steps only where you need them.',
    bullets: [
      '700+ prebuilt app integrations',
      'Branches, loops, and custom code steps',
      'Test individual steps or the whole flow',
    ],
  },
  {
    id: 'ai',
    label: 'Build with Plugr AI',
    icon: Bot,
    title: 'Turn a request into a flow.',
    description:
      'Describe an automation in chat. Plugr AI discovers the available integrations and fields live, then builds a flow you can inspect.',
    bullets: [
      'Build, validate, test, and troubleshoot from chat',
      'Live discovery instead of stale integration guesses',
      'Business adds tool-using AI agent steps inside workflows',
    ],
  },
  {
    id: 'measure',
    label: 'Run & measure',
    icon: BarChart3,
    title: 'See what ran and what happened.',
    description:
      'Review run history and step results, retry failed runs, and use Pro analytics to track volume and estimated time saved.',
    bullets: [
      'Step-by-step run status and output',
      'Retry failed runs in one click',
      'Advanced analytics on Pro and Business',
    ],
  },
];

function FlowMock() {
  const steps = [
    { icon: Webhook, label: 'Trigger', sub: 'New lead', accent: GREEN },
    { icon: Bot, label: 'AI Agent', sub: 'Enrich & classify', accent: BLUE },
    { icon: Database, label: 'Action', sub: 'Update CRM', accent: BLUE },
    { icon: Mail, label: 'Action', sub: 'Notify #sales', accent: BLUE },
  ];
  return (
    <div
      className="rounded-xl border p-5 shadow-2xl"
      style={{
        backgroundColor: '#0a0b14',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i}>
            <div
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="flex size-8 items-center justify-center rounded-md"
                style={{ backgroundColor: `${s.accent}1f`, color: s.accent }}
              >
                <s.icon className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <div
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: s.accent === BLUE ? BLUE_TEXT : s.accent }}
                >
                  {s.label}
                </div>
                <div className="text-xs font-semibold text-white">{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="ml-7 h-3 w-px"
                style={{ backgroundColor: BLUE }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsMock() {
  const stats = [
    { label: 'Runs this week', value: '2,481' },
    { label: 'Active flows', value: '18' },
    { label: 'Est. hours saved', value: '146' },
  ];
  const log = [
    ['12:04', 'lead-routing', 'succeeded', GREEN],
    ['12:01', 'invoice-sync', 'succeeded', GREEN],
    ['11:58', 'support-triage', 'succeeded', GREEN],
    ['11:52', 'data-export', 'failed', '#ff6b6b'],
  ];
  return (
    <div
      className="rounded-xl border p-5 shadow-2xl"
      style={{
        backgroundColor: '#0a0b14',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <div className="mb-3 font-mono text-xs uppercase tracking-wider text-white/60">
        Illustrative Pro analytics
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border p-3"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-xs text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs">
        {log.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-white/60">{row[0]}</span>
            <span className="flex-1 text-white/70">{row[1]}</span>
            <span style={{ color: row[3] as string }}>{row[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabVisual({ id }: { id: TabId }) {
  if (id === 'ai') return <AgentChat />;
  if (id === 'measure') return <StatsMock />;
  return <FlowMock />;
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-mono text-xs font-medium uppercase tracking-[0.15em]"
      style={{ color: BLUE }}
    >
      {children}
    </span>
  );
}

export function ProductTour() {
  const [active, setActive] = useState<TabId>('build');
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section id="features" style={{ backgroundColor: '#faf8ff' }}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Overline>Product tour</Overline>
          <h2
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: INK }}
          >
            Build, run, and inspect in one place.
          </h2>
          <p className="mt-4 text-lg" style={{ color: '#434656' }}>
            Build with chat or the visual canvas, run on events or schedules,
            and trace the result step by step.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          {TABS.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:w-auto"
                style={{
                  backgroundColor: isActive ? INK : 'transparent',
                  color: isActive ? '#ffffff' : '#434656',
                }}
              >
                <t.icon className="size-4" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        <div
          className="mt-8 rounded-2xl border bg-white p-4 sm:p-10"
          style={{ borderColor: '#e1e1ef' }}
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h3
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                style={{ color: INK }}
              >
                {tab.title}
              </h3>
              <p className="mt-3 text-base" style={{ color: '#434656' }}>
                {tab.description}
              </p>
              <ul className="mt-6 space-y-3">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: BLUE_TEXT }}
                      strokeWidth={2}
                    />
                    <span className="text-sm" style={{ color: '#191b25' }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/sign-up"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: BLUE }}
              >
                Create account
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
              <p className="mt-3 text-xs" style={{ color: '#6b6e7c' }}>
                Plugr has no free trial. Your first paid subscription has a
                3-day refund window.
              </p>
            </div>
            <div>
              <TabVisual id={tab.id} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
