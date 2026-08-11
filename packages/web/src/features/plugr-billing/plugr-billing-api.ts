import {
  PlugrBillingCurrency,
  PlugrBillingInfo,
  PlugrCheckoutResponse,
  PlugrCreateCanvasSlotCheckoutRequest,
  PlugrCreateCheckoutRequest,
  PlugrCreateCreditCheckoutRequest,
  PlugrCreateExecutionCreditCheckoutRequest,
  PlugrPricingInfo,
  PlugrVerifyTransactionRequest,
  PlugrVerifyTransactionResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const plugrBillingApi = {
  getPricing(currency?: PlugrBillingCurrency) {
    return api.get<PlugrPricingInfo>('/v1/user-billing/pricing', {
      currency,
    });
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
  createExecutionCreditCheckout(request: PlugrCreateExecutionCreditCheckoutRequest) {
    return api.post<PlugrCheckoutResponse>(
      '/v1/user-billing/credits/execution/checkout',
      request,
    );
  },
  createCanvasSlotCheckout(request: PlugrCreateCanvasSlotCheckoutRequest) {
    return api.post<PlugrCheckoutResponse>(
      '/v1/user-billing/credits/canvas-slot/checkout',
      request,
    );
  },
  cancelSubscription() {
    return api.post<PlugrBillingInfo>('/v1/user-billing/cancel', {
      confirmation: 'CANCEL',
    });
  },
  verifyTransaction(request: PlugrVerifyTransactionRequest) {
    return api.post<PlugrVerifyTransactionResponse>(
      '/v1/user-billing/verify',
      request,
    );
  },
};
