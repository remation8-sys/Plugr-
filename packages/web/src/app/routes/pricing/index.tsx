import { PlugrBillingCurrency } from '@activepieces/shared';
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatPlugrMoney,
  plugrBillingMutations,
  plugrBillingQueries,
} from '@/features/plugr-billing';
import { cn } from '@/lib/utils';

const currencyOptions: PlugrBillingCurrency[] = ['USD', 'NGN'];

export function PricingPage() {
  const [currencyOverride, setCurrencyOverride] = useState<
    PlugrBillingCurrency | undefined
  >(undefined);
  const pricingQuery = plugrBillingQueries.usePricing(currencyOverride);
  const checkoutMutation = plugrBillingMutations.useCreateCheckout();
  const canvasSlotCheckout = plugrBillingMutations.useCreateCanvasSlotCheckout();
  const executionCreditCheckout =
    plugrBillingMutations.useCreateExecutionCreditCheckout();

  if (pricingQuery.isLoading || !pricingQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  const { data } = pricingQuery;
  const plus = data.plans.plus;
  const plusPrice = plus.prices.monthly;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start free. Pay as you go, or go unlimited with Plugr Plus.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="inline-flex rounded-lg border p-1">
            {currencyOptions.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => setCurrencyOverride(currency)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  data.currency === currency
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {currency}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Paying with a Nigerian card? Choose NGN so it isn&apos;t charged in
            a foreign currency.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="relative flex min-h-[430px] flex-col rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Free</CardTitle>
            <div className="pt-3">
              <div className="text-3xl font-semibold tracking-normal">
                {formatPlugrMoney(0, data.currency)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                forever
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium">
                {data.freeTier.canvasSlots} canvas slots
              </div>
              <div className="text-xs text-muted-foreground">
                {data.freeTier.executionCredits.toLocaleString()} shared
                executions/month
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {[
                'Instant execution, no throttling',
                'Full mobile app access',
                'Use any AI model as a workflow step',
                'All 700+ Plugs',
                'Plugr AI assistant not included',
                'MCP & API access not included',
              ].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" disabled>
              Your current plan by default
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'relative flex min-h-[430px] flex-col rounded-lg',
            plus.popular && 'border-primary shadow-sm',
          )}
        >
          {plus.popular && (
            <div className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Popular
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4" />
              {plus.name}
            </CardTitle>
            <div className="pt-3">
              <div className="text-3xl font-semibold tracking-normal">
                {formatPlugrMoney(plusPrice.total, data.currency)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                per user monthly
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium">
                {plus.includedCredits} Plugr AI credits
              </div>
              <div className="text-xs text-muted-foreground">
                monthly reset
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {plus.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() =>
                checkoutMutation.mutate({
                  tier: 'plus',
                  period: 'monthly',
                  currency: currencyOverride,
                })
              }
              disabled={checkoutMutation.isPending}
            >
              <CreditCard className="mr-2 size-4" />
              Choose {plus.name}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="size-4" />
            Pay as you go
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            No subscription needed. One-time purchases, yours permanently.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-auto justify-between py-3"
            disabled={canvasSlotCheckout.isPending}
            onClick={() =>
              canvasSlotCheckout.mutate({ currency: currencyOverride })
            }
          >
            <span>+1 additional canvas slot, forever</span>
            <span>
              {formatPlugrMoney(data.canvasSlotProduct.amount, data.currency)}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto justify-between py-3"
            disabled={executionCreditCheckout.isPending}
            onClick={() =>
              executionCreditCheckout.mutate({ currency: currencyOverride })
            }
          >
            <span>
              +{data.executionCreditPack.credits.toLocaleString()} execution
              credits
            </span>
            <span>
              {formatPlugrMoney(
                data.executionCreditPack.amount,
                data.currency,
              )}
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PricingPage;
