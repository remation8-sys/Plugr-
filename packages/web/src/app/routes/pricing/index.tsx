import { PlugrPaidTier } from '@activepieces/shared';
import { Check, CreditCard, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatPlugrMoney,
  plugrBillingMutations,
  plugrBillingQueries,
} from '@/features/plugr-billing';
import { cn } from '@/lib/utils';

const planOrder: PlugrPaidTier[] = ['starter', 'builder', 'pro', 'business'];

export function PricingPage() {
  const pricingQuery = plugrBillingQueries.usePricing();
  const checkoutMutation = plugrBillingMutations.useCreateCheckout();

  if (pricingQuery.isLoading || !pricingQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-4 lg:grid-cols-4">
          {planOrder.map((tier) => (
            <Skeleton key={tier} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const { data } = pricingQuery;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simple monthly billing. Plugr credits reset every month, and extra
          credit packs stay available until used.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {planOrder.map((tier) => {
          const plan = data.plans[tier];
          const price = plan.prices.monthly;
          return (
            <Card
              key={tier}
              className={cn(
                'relative flex min-h-[430px] flex-col rounded-lg',
                plan.popular && 'border-primary shadow-sm',
              )}
            >
              {plan.popular && (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Popular
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {plan.popular ? <Sparkles className="size-4" /> : null}
                  {plan.name}
                </CardTitle>
                <div className="pt-3">
                  <div className="text-3xl font-semibold tracking-normal">
                    {formatPlugrMoney(price.total, data.currency)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    per user monthly
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">
                    {plan.includedCredits} Plugr credits
                  </div>
                  <div className="text-xs text-muted-foreground">
                    monthly reset
                  </div>
                </div>
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 size-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() =>
                    checkoutMutation.mutate({ tier, period: 'monthly' })
                  }
                  disabled={checkoutMutation.isPending}
                >
                  <CreditCard className="mr-2 size-4" />
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PricingPage;
