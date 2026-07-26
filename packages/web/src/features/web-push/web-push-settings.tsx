import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bell, BellOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { webPushApi } from './web-push-api';
import {
  getBrowserPushSubscription,
  isIosDevice,
  isStandaloneApp,
  isWebPushSupported,
  serializePushSubscription,
  subscribeBrowserToPush,
} from './web-push-client';

const webPushKeys = {
  config: ['web-push-config'] as const,
  subscription: ['web-push-subscription'] as const,
};

function WebPushSettings() {
  const { embedState } = useEmbedding();
  const queryClient = useQueryClient();
  const supported = isWebPushSupported();
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supported ? Notification.permission : 'default',
  );

  const configQuery = useQuery({
    queryKey: webPushKeys.config,
    queryFn: webPushApi.getConfig,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !embedState.isEmbedded,
  });

  const subscriptionQuery = useQuery({
    queryKey: webPushKeys.subscription,
    queryFn: async () => {
      const subscription = await getBrowserPushSubscription();
      if (subscription) {
        await webPushApi.upsertSubscription(
          serializePushSubscription(subscription),
        );
      }
      return subscription;
    },
    enabled:
      !embedState.isEmbedded && supported && configQuery.data?.enabled === true,
    retry: false,
    staleTime: 30 * 1000,
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const config = configQuery.data;
      if (!config?.enabled || !config.publicKey) {
        throw new Error(
          t('Browser notifications are not configured on this server.'),
        );
      }
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== 'granted') {
        throw new Error(
          t('Notification permission was not granted in your browser.'),
        );
      }

      const currentSubscription = await getBrowserPushSubscription();
      const subscription =
        currentSubscription ?? (await subscribeBrowserToPush(config.publicKey));
      await webPushApi.upsertSubscription(
        serializePushSubscription(subscription),
      );
      return subscription;
    },
    onSuccess: (subscription) => {
      queryClient.setQueryData(webPushKeys.subscription, subscription);
      toast.success(t('Browser notifications enabled'));
    },
    onError: (error) => {
      toast.error(t('Could not enable browser notifications'), {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const subscription = await getBrowserPushSubscription();
      if (!subscription) {
        return;
      }
      await webPushApi.deleteSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    },
    onSuccess: () => {
      queryClient.setQueryData(webPushKeys.subscription, null);
      toast.success(t('Browser notifications disabled'));
    },
    onError: (error) => {
      toast.error(t('Could not disable browser notifications'), {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  if (embedState.isEmbedded) {
    return null;
  }

  const isConfigured = configQuery.data?.enabled === true;
  const isSubscribed = Boolean(subscriptionQuery.data);
  const isPending =
    configQuery.isPending ||
    subscriptionQuery.isFetching ||
    enableMutation.isPending ||
    disableMutation.isPending;
  const unavailableMessage = getUnavailableMessage({
    configured: isConfigured,
    supported,
  });

  return (
    <section
      aria-labelledby="browser-notifications-title"
      className="rounded-lg border p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isSubscribed ? (
              <Bell aria-hidden="true" className="size-4" />
            ) : (
              <BellOff aria-hidden="true" className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <Label
              className="text-sm font-semibold"
              htmlFor="browser-notifications-switch"
              id="browser-notifications-title"
            >
              {t('Browser notifications')}
            </Label>
            <p
              className="mt-1 text-xs leading-5 text-muted-foreground"
              id="browser-notifications-description"
            >
              {unavailableMessage ??
                t(
                  'Get a notification on this device when a production flow fails.',
                )}
            </p>
            {permission === 'denied' && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {t(
                  'Notifications are blocked. Allow them in your browser settings, then try again.',
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex min-h-11 shrink-0 items-center">
          {isPending ? (
            <LoaderCircle
              aria-label={t('Updating browser notifications')}
              className="size-5 animate-spin text-muted-foreground"
            />
          ) : (
            <Switch
              aria-describedby="browser-notifications-description"
              checked={isSubscribed}
              disabled={
                !supported ||
                !isConfigured ||
                permission === 'denied' ||
                configQuery.isError
              }
              id="browser-notifications-switch"
              onCheckedChange={(checked) => {
                if (checked) {
                  enableMutation.mutate();
                } else {
                  disableMutation.mutate();
                }
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function getUnavailableMessage(params: {
  configured: boolean;
  supported: boolean;
}): string | null {
  if (!params.configured) {
    return t('Browser notifications are not configured on this server.');
  }
  if (params.supported) {
    return null;
  }
  if (isIosDevice() && !isStandaloneApp()) {
    return t(
      'On iPhone or iPad, install this app to your Home Screen and open it there first.',
    );
  }
  return t('This browser does not support web push notifications.');
}

export { WebPushSettings, webPushKeys };
