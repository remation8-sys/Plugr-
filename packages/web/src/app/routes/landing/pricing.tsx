import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Pricing section for the landing page.
 *
 * Adapted from the 21st.dev glassy-pricing community component — frosted cards
 * with a "most popular" highlight — recolored to the Stitch blue palette and
 * driven by Plugr's real tiers. The heavy full-screen WebGL shader from the
 * original is replaced with a lightweight animated CSS glow for performance.
 */

const BLUE = '#0055ff';
const INK = '#0d0e1a';

type Plan = {
  name: string;
  price: number;
  blurb: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 7,
    blurb: 'Get your first automations live.',
    features: [
      '10 Flows',
      '2,000 executions / month',
      'All 749+ Plugs',
      'Community support',
    ],
    cta: 'Get started',
  },
  {
    name: 'Builder',
    price: 12,
    blurb: 'Scale up across your team.',
    features: [
      'Unlimited Flows',
      '10,000 executions / month',
      'All Plugs',
      'Templates',
      'Email support',
    ],
    cta: 'Choose Builder',
    popular: true,
  },
  {
    name: 'Pro',
    price: 29,
    blurb: 'Everything, unlocked.',
    features: [
      'Unlimited everything',
      'Rem AI agent',
      'Priority support',
    ],
    cta: 'Go Pro',
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <style>{`
        @keyframes plg-glow {
          0%, 100% { transform: translate(-8%, -6%) scale(1); }
          50% { transform: translate(8%, 6%) scale(1.1); }
        }
      `}</style>
      {/* Animated glow + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,85,255,0.18) 0%, transparent 60%)',
          animation: 'plg-glow 14s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,85,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,85,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="font-mono text-xs font-medium uppercase tracking-[0.15em]"
            style={{ color: '#6b8cff' }}
          >
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Simple plans that scale with you.
          </h2>
          <p className="mt-4 text-lg text-white/65">
            Start building for $7 a month. Upgrade any time as your automations
            grow.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl border p-7 backdrop-blur-xl"
              style={{
                background: plan.popular
                  ? 'linear-gradient(160deg, rgba(0,85,255,0.18), rgba(255,255,255,0.04))'
                  : 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                borderColor: plan.popular
                  ? 'rgba(0,85,255,0.5)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: plan.popular
                  ? '0 0 0 1px rgba(0,85,255,0.3), 0 24px 60px rgba(0,0,0,0.4)'
                  : 'none',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: BLUE }}
                >
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-white/55">{plan.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-5xl font-light text-white">
                  ${plan.price}
                </span>
                <span className="text-sm text-white/55">/month</span>
              </div>
              <div
                className="my-6 h-px w-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                }}
              />
              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: plan.popular ? '#6b8cff' : BLUE }}
                      strokeWidth={2.5}
                    />
                    <span className="text-sm text-white/85">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/sign-up"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={
                  plan.popular
                    ? { backgroundColor: BLUE, color: '#ffffff' }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}