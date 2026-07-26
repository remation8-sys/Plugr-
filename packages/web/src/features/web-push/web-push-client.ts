import { WebPushSubscriptionRequest } from '@activepieces/shared';

function isWebPushSupported(): boolean {
  const hasBrowserSupport =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'Notification' in window &&
    'PushManager' in window &&
    'serviceWorker' in navigator;
  if (!hasBrowserSupport) {
    return false;
  }
  return !isIosDevice() || isStandaloneApp();
}

function isIosDevice(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneApp(): boolean {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    standaloneNavigator.standalone === true
  );
}

async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

async function subscribeBrowserToPush(
  publicKey: string,
): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKey),
    userVisibleOnly: true,
  });
}

function serializePushSubscription(
  subscription: PushSubscription,
): WebPushSubscriptionRequest {
  const serialized = subscription.toJSON();
  const auth = serialized.keys?.auth;
  const p256dh = serialized.keys?.p256dh;
  if (!auth || !p256dh) {
    throw new Error('The browser did not provide valid notification keys.');
  }
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      auth,
      p256dh,
    },
  };
}

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export {
  getBrowserPushSubscription,
  isIosDevice,
  isStandaloneApp,
  isWebPushSupported,
  serializePushSubscription,
  subscribeBrowserToPush,
  urlBase64ToUint8Array,
};
