import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Sparkles, Zap } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getPlugrCreditsRemaining,
  getPlugrExecutionCreditsRemaining,
  hasPlugrPlusAccess,
  plugrBillingQueries,
} from '@/features/plugr-billing';
import { projectCollectionUtils } from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';

const SidebarUsageLimits = React.memo(() => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const currentUser = userHooks.useCurrentUser();
  const billingQuery = plugrBillingQueries.useInfo();
  const billingUser = billingQuery.data?.user ?? currentUser.data;
  const isPlus = hasPlugrPlusAccess(billingUser);
  const creditsRemaining =
    billingQuery.data?.creditsRemaining ??
    getPlugrCreditsRemaining(billingUser);
  const totalCredits = Math.max(
    0,
    (billingUser?.aiCreditsIncluded ?? 0) +
      (billingUser?.aiCreditsPurchased ?? 0),
  );
  const creditsPercent =
    totalCredits > 0 ? (creditsRemaining / totalCredits) * 100 : 0;

  const executionCreditsRemaining =
    billingQuery.data?.executionCreditsRemaining ??
    getPlugrExecutionCreditsRemaining(billingUser);
  const totalExecutionCredits = Math.max(
    0,
    (billingUser?.executionCreditsIncluded ?? 0) +
      (billingUser?.executionCreditsPurchased ?? 0),
  );
  const executionPercent =
    totalExecutionCredits > 0
      ? (executionCreditsRemaining / totalExecutionCredits) * 100
      : 0;

  if (isNil(billingUser)) {
    return null;
  }

  if (isNil(project)) {
    return (
      <div className="flex flex-col w-full gap-2 rounded-lg border bg-background p-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
        <Skeleton className="w-full h-1.5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-2 rounded-lg border bg-background p-3">
      {isPlus ? (
        <>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3.5 text-primary" />
              {t('AI Credits')}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatUtils.formatNumber(
                Math.max(0, Math.round(creditsRemaining)),
              )}{' '}
              / {formatUtils.formatNumber(totalCredits)}
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, creditsPercent))}
            className="h-1.5"
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="size-3.5 text-primary" />
              {t('Execution credits')}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatUtils.formatNumber(
                Math.max(0, Math.round(executionCreditsRemaining)),
              )}{' '}
              / {formatUtils.formatNumber(totalExecutionCredits)}
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, executionPercent))}
            className="h-1.5"
          />
        </>
      )}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-muted-foreground">
          {isPlus ? `${t('Runs')} · ${t('Unlimited')}` : t('Plugr AI needs Plus')}
        </span>
        <Link
          to="/pricing"
          className="flex w-fit shrink-0 items-center gap-0.5 whitespace-nowrap font-medium text-foreground/80 hover:text-foreground"
        >
          <span>{isPlus ? t('Manage plan') : t('Upgrade')}</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
});

SidebarUsageLimits.displayName = 'SidebarUsageLimits';
export default SidebarUsageLimits;
