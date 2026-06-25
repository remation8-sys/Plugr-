import {
  PlugrBillingInfo,
  PlugrCheckoutResponse,
  PlugrCreateCheckoutRequest,
  PlugrCreateCreditCheckoutRequest,
  PlugrPricingInfo,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const plugrBillingApi = {
  getPricing() {
    return api.get<PlugrPricingInfo>('/v1/user-billing/pricing');
  },
  getInfo() {
    return api.get<PlugrBillingInfo>('/v1/user-billing/me');
  },
  createCheckout(request: PlugrCreateCheckoutRequest) {
    return api.post<PlugrCheckoutResponse>(
      '/v1/user-billing/checkout',
      request,
    );
  },
  createCreditCheckout(request: PlugrCreateCreditCheckoutRequest) {
    return api.post<PlugrCheckoutResponse>(
      '/v1/user-billing/credits/checkout',
      request,
    );
  },
  cancelSubscription() {
    return api.post<PlugrBillingInfo>('/v1/user-billing/cancel', {
      confirmation: 'CANCEL',
    });
  },
};
