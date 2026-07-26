import {
  PlugrPaidTier,
  PlugrSubscriptionStatus,
  PlugrSubscriptionTier,
} from '@activepieces/shared';
import { LockKeyhole } from 'lucide-react';
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

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
};

const tierRank: Record<PlugrSubscriptionTier, number> = {
  trial: 0,
  starter: 1,
  builder: 2,
  pro: 3,
  business: 4,
};

const tierLabels: Record<PlugrSubscriptionTier, string> = {
  trial: 'Unpaid',
  starter: 'Starter',
  builder: 'Builder',
  pro: 'Pro',
  business: 'Business',
};

export function hasPlugrAppAccess(user: PlugrBillingUser | null | undefined) {
  if (!user) return false;
  if (!isPaidPlugrTier(user.subscriptionTier)) return false;
  if (user.subscriptionStatus === 'expired') return false;
  if (user.subscriptionStatus === 'active') return true;
  if (user.subscriptionStatus === 'cancelled') {
    return isFuture(user.subscriptionEndsAt);
  }
  return false;
}

export function canUsePlugr(user: PlugrBillingUser | null | undefined) {
  return hasPlugrAppAccess(user);
}

/**
 * AI access = the plan includes AI credits (Builder/Pro/Business) or the user
 * bought credits. Starter includes 0 credits, so Starter users get the upsell
 * teaser instead of the chat. Credit *exhaustion* (used all included) is a
 * separate in-chat state, so we key off entitlement, not remaining balance.
 */
export function hasPlugrAiAccess(user: PlugrBillingUser | null | undefined) {
  if (!canUsePlugr(user)) return false;
  return (
    (user!.aiCreditsIncluded ?? 0) > 0 || (user!.aiCreditsPurchased ?? 0) > 0
  );
}

export function hasMinimumPlugrTier(
  user: PlugrBillingUser | null | undefined,
  minimumTier: PlugrPaidTier,
) {
  const tier = user?.subscriptionTier;
  return (
    hasPlugrAppAccess(user) && !!tier && tierRank[tier] >= tierRank[minimumTier]
  );
}

export function getPlugrTierLabel(tier: PlugrSubscriptionTier | undefined) {
  return tier ? tierLabels[tier] : tierLabels.trial;
}

export function getPlugrCreditsRemaining(
  user: PlugrBillingUser | null | undefined,
) {
  if (!user || user.subscriptionTier === 'trial') return 0;
  return Math.max(
    0,
    (user.aiCreditsIncluded ?? 0) +
      (user.aiCreditsPurchased ?? 0) -
      (user.aiCreditsUsed ?? 0),
  );
}

export function PlugrAppAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = userHooks.useCurrentUser();
  const location = useLocation();
  const isBillingRoute =
    location.pathname.startsWith('/pricing') ||
    location.pathname.startsWith('/billing');

  if (!user || isBillingRoute || hasPlugrAppAccess(user)) {
    return <>{children}</>;
  }

  return <Navigate to="/pricing" replace />;
}

export function PlugrAccessGuard({ children }: { children: React.ReactNode }) {
  const { data: user } = userHooks.useCurrentUser();

  if (!user) return null;
  if (!hasPlugrAppAccess(user)) return <Navigate to="/pricing" replace />;
  if (canUsePlugr(user)) return <>{children}</>;

  return (
    <PlugrLockedFeature
      title="Choose a plan to automate"
      description="Choose a paid plan and add a payment method before building or running automations."
      ctaLabel="View plans"
    />
  );
}

export function PlugrAiAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = userHooks.useCurrentUser();

  if (!user) return null;
  if (!hasPlugrAppAccess(user)) return <Navigate to="/pricing" replace />;
  if (hasPlugrAiAccess(user)) return <>{children}</>;

  return (
    <PlugrLockedFeature
      title="Build with Plugr AI"
      description="Describe what you want in plain words and Plugr builds the automation for you. Available on the Builder, Pro, and Business plans."
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

function isPaidPlugrTier(tier: PlugrSubscriptionTier | undefined) {
  return (
    tier === 'starter' ||
    tier === 'builder' ||
    tier === 'pro' ||
    tier === 'business'
  );
}
