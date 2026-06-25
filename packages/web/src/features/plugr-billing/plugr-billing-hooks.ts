import {
  PlugrCreateCheckoutRequest,
  PlugrCreateCreditCheckoutRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { plugrBillingApi } from './plugr-billing-api';

export const plugrBillingKeys = {
  pricing: ['plugr-billing-pricing'] as const,
  info: ['plugr-billing-info'] as const,
};

export const plugrBillingQueries = {
  usePricing() {
    return useQuery({
      queryKey: plugrBillingKeys.pricing,
      queryFn: plugrBillingApi.getPricing,
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
        window.location.href = response.checkoutUrl;
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
        window.location.href = response.checkoutUrl;
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
