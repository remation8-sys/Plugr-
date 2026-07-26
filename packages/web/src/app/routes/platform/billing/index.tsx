import {
  ApSubscriptionStatus,
  AiCreditsAutoTopUpState,
  ApEdition,
  ApFlagId,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { PageLoadingSkeleton } from '@/components/custom/page-loading-skeleton';
import { Button } from '@/components/ui/button';
import { ActiveFlowAddon } from '@/features/billing/components/active-flows-addon';
import { AICreditUsage } from '@/features/billing/components/ai-credits/ai-credit-usage';
import { LicenseKey } from '@/features/billing/components/license-key';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/hooks/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function Billing() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={t('Unlock Billing Page')}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      lockDocumentationUrl="https://plugr.cloud"
      showContactSales={false}
    >
      <BillingPageDetails />
    </LockedFeatureGuard>
  );
}

function BillingPageDetails() {
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const { mutate: redirectToPortalSession } = billingMutations.usePortalLink();
  const status = platformPlanInfo?.plan?.stripeSubscriptionStatus;
  const isSubscriptionActive =
    ApSubscriptionStatus.ACTIVE === (status as ApSubscriptionStatus);

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <PageLoadingSkeleton
        className="h-full"
        label={t('Loading billing information')}
      />
    );
  }

  if (isError) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        {t('Failed to load billing information')}
      </article>
    );
  }

  return (
    <CenteredPage
      title={t('Billing')}
      description={t(
        'For questions about billing contact us at support@plugr.cloud',
      )}
    >
      <div className="flex flex-col gap-6">
        {isSubscriptionActive && <SubscriptionInfo info={platformPlanInfo} />}

        {(isSubscriptionActive ||
          platformPlanInfo?.plan.aiCreditsAutoTopUpState ===
            AiCreditsAutoTopUpState.ENABLED) && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => redirectToPortalSession()}
          >
            {t('Access Billing Portal')}
          </Button>
        )}

        {!isCommunity && (
          <>
            <ActiveFlowAddon platformSubscription={platformPlanInfo} />
            <AICreditUsage platformSubscription={platformPlanInfo} />
          </>
        )}
        <LicenseKey platform={platform} />
      </div>
    </CenteredPage>
  );
}
