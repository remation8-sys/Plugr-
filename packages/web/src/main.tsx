import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
// eslint-disable-next-line import/no-unresolved -- vite virtual module
import { registerSW } from 'virtual:pwa-register';

import './i18n';
import App from './app/app';

import { detectAndPersistNativeApp } from '@/lib/native-app';

detectAndPersistNativeApp();

// autoUpdate + this helper keeps the app shell current while retaining a
// bounded offline cache for assets and explicitly safe background work.
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
