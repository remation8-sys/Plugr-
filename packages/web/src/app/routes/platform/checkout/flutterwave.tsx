import { PlugrPaidTierSchema } from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect, useMemo, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { CenteredPage } from '@/app/components/centered-page';
import { LoadingSpinner } from '@/components/custom/spinner';
import { plugrBillingMutations } from '@/features/plugr-billing';

export default function FlutterwaveCheckoutPage() {
  const [searchParams] = useSearchParams();
  const startedRef = useRef(false);
  const planParam = searchParams.get('plan');
  const planResult = useMemo(
    () => PlugrPaidTierSchema.safeParse(planParam),
    [planParam],
  );
  const { mutate: createCheckout } = plugrBillingMutations.useCreateCheckout();

  useEffect(() => {
    if (!planResult.success || startedRef.current) {
      return;
    }
    startedRef.current = true;
    createCheckout({ tier: planResult.data, period: 'monthly' });
  }, [createCheckout, planResult]);

  if (!planResult.success) {
    return <Navigate to="/platform/setup/billing/error" replace />;
  }

  return (
    <CenteredPage
      title={t('Preparing checkout')}
      description={t('Connecting you to Flutterwave secure checkout.')}
    >
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    </CenteredPage>
  );
}
