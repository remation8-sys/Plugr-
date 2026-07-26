import { tryCatch } from '@activepieces/shared';

import { webPushApi } from './web-push-api';
import {
  getBrowserPushSubscription,
  isWebPushSupported,
} from './web-push-client';

async function cleanUpWebPushSession(): Promise<void> {
  if (!isWebPushSupported()) {
    return;
  }
  const { data: subscription } = await tryCatch(getBrowserPushSubscription);
  if (!subscription) {
    return;
  }

  const { error } = await tryCatch(() =>
    webPushApi.deleteSubscription(subscription.endpoint),
  );
  if (error) {
    console.warn(
      'Could not remove browser notifications from the server',
      error,
    );
  }
  await tryCatch(() => subscription.unsubscribe());
}

export { cleanUpWebPushSession };
