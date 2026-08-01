import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
// eslint-disable-next-line import/no-unresolved -- vite virtual module
import { registerSW } from 'virtual:pwa-register';

import './i18n';

import { detectAndPersistNativeApp } from '@/lib/native-app';
import { setPendingPwaUpdate } from '@/lib/pwa-update';

import App from './app/app';

detectAndPersistNativeApp();

// Keep the current worker in control until the user accepts the update. This
// avoids reloading a flow editor while a field is being changed.
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => {
    if (isMobilePwaContext()) {
      setPendingPwaUpdate(() => updateServiceWorker(true));
      return;
    }
    void updateServiceWorker(true);
  },
  onNeedReload: () => {
    if (isMobilePwaContext() && window.location.pathname.includes('/flows/')) {
      setPendingPwaUpdate(async () => window.location.reload());
      return;
    }
    window.location.reload();
  },
  onRegisteredSW: (_serviceWorkerUrl, registration) => {
    if (!registration) {
      return;
    }

    window.setInterval(() => {
      if (navigator.onLine) {
        void registration.update();
      }
    }, 60 * 60 * 1000);
  },
  onRegisterError: (error) => {
    console.error('Plugr service worker registration failed', error);
  },
});

function isMobilePwaContext() {
  return window.matchMedia('(max-width: 767px)').matches;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
