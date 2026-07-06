import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
// eslint-disable-next-line import/no-unresolved -- vite virtual module
import { registerSW } from 'virtual:pwa-register';

import './i18n';
import { detectAndPersistNativeApp } from '@/lib/native-app';

import App from './app/app';

detectAndPersistNativeApp();

// autoUpdate + this helper: when a deploy ships a new service worker, open
// pages reload themselves to the fresh version instead of staying one
// cold-start behind.
registerSW({ immediate: true });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
