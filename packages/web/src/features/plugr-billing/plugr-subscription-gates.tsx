import { PlugrSubscriptionStatus, PlugrSubscriptionTier } from '@activepieces/shared';
import { LockKeyhole } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

type PlugrBillingUser = {
  subscriptionTier?: PlugrSubscriptionTier;
  subscriptionStatus?: PlugrSubscriptionStatus;
  subscriptionEndsAt?: string | Date | null;
  aiCreditsIncluded?: number;
  aiCreditsUsed?: number;
  aiCreditsPurchased?: number;
  canvasSlotsPurchased?: number;
  executionCreditsIncluded?: number;
  executionCreditsUsed?: number;
  executionCreditsPurchased?: number;
};

const FREE_TIER_CANVAS_SLOTS = 2;

const tierLabels: Record<PlugrSubscriptionTier, string> = {
  free: 'Free',
  plus: 'Plugr Plus',
};

function isPaidPlugrTier(tier: PlugrSubscriptionTier | undefined) {
  return tier === 'plus';
}

/**
 * Every account has core product access (free tier included) - flows,
 * connections, tables, AI-as-a-workflow-step. This is only false for a
 * lapsed/expired Plus subscriber before normalization has run client-side,
 * which shouldn't happen in practice since the backend flips them back to
 * free automatically.
 */
export function hasPlugrAppAccess(_user: PlugrBillingUser | null | undefined) {
  return true;
}

/**
 * Plugr AI assistant + MCP/API access + specialist agents + advanced
 * analytics are all Plugr Plus-only. There's a single paid tier now, so this
 * is just "does the user have an active Plus subscription."
 */
export function hasPlugrPlusAccess(user: PlugrBillingUser | null | undefined) {
  if (!user) return false;
  if (!isPaidPlugrTier(user.subscriptionTier)) return false;
  if (user.subscriptionStatus === 'expired') return false;
  if (user.subscriptionStatus === 'active') return true;
  if (user.subscriptionStatus === 'cancelled') {
    return isFuture(user.subscriptionEndsAt);
  }
  return false;
}

export const hasPlugrAiAccess = hasPlugrPlusAccess;

export function getPlugrTierLabel(tier: PlugrSubscriptionTier | undefined) {
  return tier ? tierLabels[tier] : tierLabels.free;
}

export function getPlugrCreditsRemaining(
  user: PlugrBillingUser | null | undefined,
) {
  if (!user || !hasPlugrPlusAccess(user)) return 0;
  return Math.max(
    0,
    (user.aiCreditsIncluded ?? 0) +
      (user.aiCreditsPurchased ?? 0) -
      (user.aiCreditsUsed ?? 0),
  );
}

export function getPlugrExecutionCreditsRemaining(
  user: PlugrBillingUser | null | undefined,
) {
  if (!user) return 0;
  return Math.max(
    0,
    (user.executionCreditsIncluded ?? 0) +
      (user.executionCreditsPurchased ?? 0) -
      (user.executionCreditsUsed ?? 0),
  );
}

/** null = unlimited (Plugr Plus) */
export function getPlugrCanvasSlotLimit(
  user: PlugrBillingUser | null | undefined,
): number | null {
  if (!user) return FREE_TIER_CANVAS_SLOTS;
  if (isPaidPlugrTier(user.subscriptionTier)) return null;
  return FREE_TIER_CANVAS_SLOTS + (user.canvasSlotsPurchased ?? 0);
}

/**
 * Gates surfaces that require an active Plugr Plus subscription: the Plugr
 * AI assistant, MCP settings, specialist agents, advanced analytics.
 */
export function PlugrAiAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = userHooks.useCurrentUser();

  if (!user) return null;
  if (hasPlugrPlusAccess(user)) return <>{children}</>;

  return (
    <PlugrLockedFeature
      title="Build with Plugr AI"
      description="Describe what you want in plain words and Plugr builds the automation for you. Available on Plugr Plus."
      ctaLabel="See plans"
    />
  );
}

export function PlugrLockedFeature({
  title,
  description,
  ctaLabel = 'Upgrade',
  className,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] w-full items-center justify-center px-4 py-10 md:px-6',
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full border bg-muted/40">
          <LockKeyhole className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button asChild>
          <Link to="/pricing">{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

function isFuture(value: string | Date | null | undefined) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}
