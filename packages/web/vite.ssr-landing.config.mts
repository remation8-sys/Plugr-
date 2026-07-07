// Separate, minimal Vite config used only to build a Node-consumable SSR
// bundle of the marketing LandingPage (see src/app/routes/landing/ssr-entry.tsx).
// Kept isolated from vite.config.mts so client-only plugins (PWA, checker,
// custom HTML templating) never run against this build.
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/web-ssr-landing',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@activepieces/shared': path.resolve(
        __dirname,
        '../../packages/shared/src',
      ),
    },
  },
  plugins: [react(), tsconfigPaths()],
  build: {
    ssr: path.resolve(__dirname, 'src/app/routes/landing/ssr-entry.tsx'),
    outDir: '../../dist-ssr/web',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'landing.mjs',
      },
    },
  },
});
