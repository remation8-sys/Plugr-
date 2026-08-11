import { PlugrCreditPackSize } from '@activepieces/shared';
import { CreditCard, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  formatPlugrDate,
  formatPlugrMoney,
  getPlugrCanvasSlotLimit,
  hasPlugrPlusAccess,
  plugrBillingMutations,
  plugrBillingQueries,
} from '@/features/plugr-billing';

const creditPacks: PlugrCreditPackSize[] = ['100', '500', '1000'];

export function AccountBilling() {
  const billingQuery = plugrBillingQueries.useInfo();
  const pricingQuery = plugrBillingQueries.usePricing();
  const creditCheckout = plugrBillingMutations.useCreateCreditCheckout();
  const executionCreditCheckout =
    plugrBillingMutations.useCreateExecutionCreditCheckout();
  const canvasSlotCheckout = plugrBillingMutations.useCreateCanvasSlotCheckout();
  const cancelSubscription = plugrBillingMutations.useCancelSubscription();

  if (billingQuery.isLoading || !billingQuery.data) {
    return (
      <div className="text-sm text-muted-foreground">Loading billing...</div>
    );
  }

  const billing = billingQuery.data;
  const user = billing.user;
  const isPlus = hasPlugrPlusAccess(user);
  const canvasSlotLimit = getPlugrCanvasSlotLimit(user);
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

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Current plan</div>
          <div className="mt-1 text-lg font-semibold capitalize">
            {isPlus ? 'Plugr Plus' : 'Free'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground capitalize">
            {user.subscriptionStatus}
            {user.subscriptionEndsAt
              ? ` until ${formatPlugrDate(user.subscriptionEndsAt)}`
              : ''}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Canvas slots</div>
          <div className="mt-1 text-lg font-semibold">
            {canvasSlotLimit === null ? 'Unlimited' : `${canvasSlotLimit} total`}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {canvasSlotLimit === null
              ? 'included with Plugr Plus'
              : `${user.canvasSlotsPurchased} purchased`}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Executions</div>
          <div className="mt-1 text-lg font-semibold">
            {isPlus
              ? 'Unlimited'
              : `${billing.executionCreditsRemaining.toLocaleString()} remaining`}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {isPlus ? 'included with Plugr Plus' : 'monthly reset'}
          </div>
        </div>
      </div>

      {!isPlus && (
        <div className="rounded-lg border p-3">
          <div className="mb-3">
            <div className="text-sm font-medium">Pay-as-you-go</div>
            <div className="text-xs text-muted-foreground">
              One-time purchases, yours permanently - no subscription needed.
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-between"
              disabled={
                !pricingQuery.data?.canvasSlotProduct ||
                canvasSlotCheckout.isPending
              }
              onClick={() => canvasSlotCheckout.mutate({})}
            >
              <span>+1 canvas slot</span>
              {pricingQuery.data?.canvasSlotProduct ? (
                <span>
                  {formatPlugrMoney(
                    pricingQuery.data.canvasSlotProduct.amount,
                    pricingQuery.data.canvasSlotProduct.currency,
                  )}
                </span>
              ) : null}
            </Button>
            <Button
              variant="outline"
              className="justify-between"
              disabled={
                !pricingQuery.data?.executionCreditPack ||
                executionCreditCheckout.isPending
              }
              onClick={() => executionCreditCheckout.mutate({})}
            >
              <span>
                +{pricingQuery.data?.executionCreditPack.credits ?? 5000}{' '}
                executions
              </span>
              {pricingQuery.data?.executionCreditPack ? (
                <span>
                  {formatPlugrMoney(
                    pricingQuery.data.executionCreditPack.amount,
                    pricingQuery.data.executionCreditPack.currency,
                  )}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      )}

      {isPlus && (
        <div className="rounded-lg border p-3">
          <div className="mb-3">
            <div className="text-sm font-medium">Add Plugr AI credits</div>
            <div className="text-xs text-muted-foreground">
              Use packs when your monthly credits run low.
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
      )}

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
