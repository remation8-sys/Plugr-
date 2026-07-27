import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
// eslint-disable-next-line import/no-unresolved -- vite virtual module
import { registerSW } from 'virtual:pwa-register';

import './i18n';
import App from './app/app';

import { detectAndPersistNativeApp } from '@/lib/native-app';

detectAndPersistNativeApp();

// autoUpdate + skipWaiting/clientsClaim (see vite.config.mts) mean a new
// service worker takes control of already-open tabs immediately. Without
// this listener, a tab left open across a deploy keeps running its old,
// already-loaded JS while the new worker starts serving the new build's
// asset manifest underneath it — a lazy-loaded chunk the old JS asks for
// by its old hash no longer matches anything, and you get a broken,
// partially-old/partially-new render (e.g. step-settings panels rendering
// their loading skeleton and real content on top of each other). A single
// reload the moment the new worker takes over is the standard fix.
let reloadingForNewServiceWorker = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloadingForNewServiceWorker) {
    return;
  }
  reloadingForNewServiceWorker = true;
  window.location.reload();
});

registerSW({
  immediate: true,
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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
