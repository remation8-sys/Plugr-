import { PlugrCreditPackSize } from '@activepieces/shared';
import { CreditCard, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  formatPlugrDate,
  formatPlugrMoney,
  plugrBillingMutations,
  plugrBillingQueries,
} from '@/features/plugr-billing';

const creditPacks: PlugrCreditPackSize[] = ['100', '500', '1000'];

export function AccountBilling() {
  const billingQuery = plugrBillingQueries.useInfo();
  const pricingQuery = plugrBillingQueries.usePricing();
  const creditCheckout = plugrBillingMutations.useCreateCreditCheckout();
  const cancelSubscription = plugrBillingMutations.useCancelSubscription();

  if (billingQuery.isLoading || !billingQuery.data) {
    return (
      <div className="text-sm text-muted-foreground">Loading billing...</div>
    );
  }

  const billing = billingQuery.data;
  const user = billing.user;
  const canCancel =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'cancelled';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Billing</h3>
        <p className="text-xs text-muted-foreground">
          Per-user Plugr subscription
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Current plan</div>
          <div className="mt-1 text-lg font-semibold capitalize">
            {user.subscriptionTier}
          </div>
          <div className="mt-1 text-xs text-muted-foreground capitalize">
            {user.subscriptionStatus}
            {user.subscriptionEndsAt
              ? ` until ${formatPlugrDate(user.subscriptionEndsAt)}`
              : ''}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Plugr credits</div>
          <div className="mt-1 text-lg font-semibold">
            {billing.creditsRemaining.toLocaleString()} remaining
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            monthly reset
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="mb-3">
          <div className="text-sm font-medium">Add Plugr credits</div>
          <div className="text-xs text-muted-foreground">
            Use packs when your plan credits run low.
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {creditPacks.map((pack) => {
            const price = pricingQuery.data?.creditPacks[pack];
            return (
              <Button
                key={pack}
                variant="outline"
                className="justify-between"
                disabled={!price || creditCheckout.isPending}
                onClick={() => creditCheckout.mutate({ pack })}
              >
                <span>{pack} credits</span>
                {price ? (
                  <span>{formatPlugrMoney(price.amount, price.currency)}</span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>

      {canCancel && (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Subscription</div>
            <div className="text-xs text-muted-foreground">
              Cancelling keeps access until the paid period ends.
            </div>
          </div>
          <Button
            variant="outline"
            disabled={
              cancelSubscription.isPending ||
              user.subscriptionStatus === 'cancelled'
            }
            onClick={() => {
              if (window.confirm('Cancel your Plugr subscription?')) {
                cancelSubscription.mutate();
              }
            }}
          >
            <XCircle className="mr-2 size-4" />
            Cancel
          </Button>
        </div>
      )}

      <div className="rounded-lg border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <CreditCard className="size-4" />
          Billing history
        </div>
        <div className="space-y-2 text-sm">
          {billing.history.length === 0 && (
            <div className="text-muted-foreground">No billing history yet.</div>
          )}
          {billing.history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="capitalize">{item.type}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPlugrDate(item.created)} - {item.status}
                </div>
              </div>
              <div className="shrink-0 font-medium">
                {formatPlugrMoney(item.amountPaid, item.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Separator />
    </div>
  );
}
