import {
  WebPushConfig,
  WebPushSubscriptionRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

const webPushApi = {
  getConfig() {
    return api.get<WebPushConfig>('/v1/web-push/config');
  },
  upsertSubscription(subscription: WebPushSubscriptionRequest) {
    return api.post<void, WebPushSubscriptionRequest>(
      '/v1/web-push/subscriptions',
      subscription,
    );
  },
  deleteSubscription(endpoint: string) {
    return api.delete<void>('/v1/web-push/subscriptions', { endpoint });
  },
};

export { webPushApi };
