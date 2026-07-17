import {
  PlugrBillingCurrency,
  PlugrCreateCheckoutRequest,
  PlugrCreateCreditCheckoutRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { openPlugrInlineCheckout } from './flutterwave-inline';
import { plugrBillingApi } from './plugr-billing-api';

async function startCheckout(response: {
  checkoutUrl: string;
  inline?: Parameters<typeof openPlugrInlineCheckout>[0];
}): Promise<void> {
  // Prefer the on-site Inline modal; fall back to the hosted checkout page if
  // the Flutterwave script is unavailable (blocked, offline, etc.).
  if (response.inline) {
    try {
      await openPlugrInlineCheckout(response.inline);
      return;
    } catch {
      // fall through to hosted redirect
    }
  }
  window.location.href = response.checkoutUrl;
}

export const plugrBillingKeys = {
  pricing: (currency?: PlugrBillingCurrency) =>
    ['plugr-billing-pricing', currency ?? 'auto'] as const,
  info: ['plugr-billing-info'] as const,
};

export const plugrBillingQueries = {
  usePricing(currency?: PlugrBillingCurrency) {
    return useQuery({
      queryKey: plugrBillingKeys.pricing(currency),
      queryFn: () => plugrBillingApi.getPricing(currency),
    });
  },
  useInfo() {
    return useQuery({
      queryKey: plugrBillingKeys.info,
      queryFn: plugrBillingApi.getInfo,
    });
  },
};

export const plugrBillingMutations = {
  useCreateCheckout() {
    return useMutation({
      mutationFn: async (request: PlugrCreateCheckoutRequest) => {
        const response = await plugrBillingApi.createCheckout(request);
        await startCheckout(response);
      },
      onError: (error) => {
        toast.error(t('Could not start checkout'), {
          description: error instanceof Error ? error.message : undefined,
        });
      },
    });
  },
  useCreateCreditCheckout() {
    return useMutation({
      mutationFn: async (request: PlugrCreateCreditCheckoutRequest) => {
        const response = await plugrBillingApi.createCreditCheckout(request);
        await startCheckout(response);
      },
      onError: (error) => {
        toast.error(t('Could not start checkout'), {
          description: error instanceof Error ? error.message : undefined,
        });
      },
    });
  },
  useCancelSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: plugrBillingApi.cancelSubscription,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: plugrBillingKeys.info });
        toast.success(t('Subscription cancelled'));
      },
      onError: (error) => {
        toast.error(t('Could not cancel subscription'), {
          description: error instanceof Error ? error.message : undefined,
        });
      },
    });
  },
};
