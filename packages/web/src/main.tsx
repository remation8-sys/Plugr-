import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import './i18n';
import { detectAndPersistNativeApp } from '@/lib/native-app';

import App from './app/app';

detectAndPersistNativeApp();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
