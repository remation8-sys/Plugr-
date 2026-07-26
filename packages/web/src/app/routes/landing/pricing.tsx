import { plugrPaidTierValues, plugrPlanCatalog } from '@activepieces/shared';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Pricing section for the landing page.
 *
 * Adapted from the 21st.dev glassy-pricing community component — frosted cards
 * with a "most popular" highlight — recolored to the Stitch blue palette.
 *
 * Tiers, USD prices and features are read straight from the shared
 * `plugrPlanCatalog` (the same source the billing API and in-app pricing page
 * use), so this section can never drift from what customers are actually
 * charged. It stays static — the catalog is a bundled constant, so no API or
 * auth call is needed and it renders for logged-out visitors.
 */

const BLUE = '#0055ff';
const INK = '#0d0e1a';

export function Pricing() {
  const plans = plugrPaidTierValues.map((tier) => plugrPlanCatalog[tier]);
  const startingPrice = Math.min(...plans.map((plan) => plan.prices.USD));

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
            Start at ${startingPrice} a month. All plans include unlimited
            flows, executions, and the full integration library. Builder and
            above include Plugr AI credits.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            return (
              <div
                key={plan.tier}
                className="relative flex h-full flex-col rounded-2xl border p-4 backdrop-blur-xl sm:p-6"
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
                    className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-5xl font-light text-white">
                    ${plan.prices.USD}
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
                <ul className="flex flex-1 flex-col gap-3">
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
                  Create account
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-2 text-center text-xs text-white/60">
          <p>
            Prices in USD, billed monthly. Local currency is shown at checkout.
          </p>
          <p>
            No free trial. First paid subscriptions have a{' '}
            <a
              href="#refund-policy"
              className="text-white/65 underline underline-offset-4 hover:text-white"
            >
              3-day refund window
            </a>
            .
          </p>
          <p>
            Plugr credits cover AI-assisted building, audits, fixes,
            modifications, and reports.
          </p>
        </div>
      </div>
    </section>
  );
}
