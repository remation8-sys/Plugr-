/// <reference types='vitest' />
import { readFileSync } from 'node:fs';
import path from 'path';

import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import customHtmlPlugin from './vite-plugins/html-plugin';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';

  const AP_TITLE = 'Plugr';
  const AP_FAVICON = '/plugr-icon.png';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/web',
    server: {
      // allowedHosts: ['wozcsvaint.loclx.io'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            Host: '127.0.0.1:4200',
          },
          ws: true,
        },
        '^/mcp(/|$)': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
          rewrite: (p: string) => p,
        },
        '/.well-known': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/register': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/authorize': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/token': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
        '/revoke': {
          target: 'http://127.0.0.1:3000',
          secure: false,
          changeOrigin: true,
          headers: {
            'X-Forwarded-Host': 'localhost:4200',
          },
        },
      },
      port: 4200,
      host: '0.0.0.0',
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },
    resolve: {
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/commands',
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@activepieces/shared': path.resolve(
          __dirname,
          '../../packages/shared/src'
        ),
        'ee-embed-sdk': path.resolve(
          __dirname,
          '../../packages/ee/embed-sdk/src'
        ),
        '@activepieces/pieces-framework': path.resolve(
          __dirname,
          '../../packages/pieces/framework/src'
        ),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      customHtmlPlugin({
        title: AP_TITLE,
        icon: AP_FAVICON,
      }),
      ...(isDev
        ? [
            checker({
              typescript: {
                buildMode: true,
                tsconfigPath: './tsconfig.json',
                root: __dirname,
              },
            }),
          ]
        : []),
      VitePWA({
        registerType: 'prompt',
        includeManifestIcons: false,
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'logo-180.png',
          'icons/icon-192.png',
        ],
        manifest: {
          id: '/',
          name: 'Plugr',
          short_name: 'Plugr',
          description: 'Automate your business from your phone',
          theme_color: '#0055ff',
          background_color: '#0a0a0b',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'icons/icon-72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: 'icons/icon-96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: 'icons/icon-128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: 'icons/icon-144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: 'icons/icon-152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
          categories: ['business', 'productivity', 'utilities'],
          shortcuts: [
            {
              name: 'Automations',
              short_name: 'Automations',
              url: '/automations',
              icons: [
                {
                  src: 'icons/icon-96.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Plugr Chat',
              short_name: 'Chat',
              url: '/chat',
              icons: [
                {
                  src: 'icons/icon-96.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Explore templates',
              short_name: 'Explore',
              url: '/templates',
              icons: [
                {
                  src: 'icons/icon-96.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
          ],
        },
        workbox: {
          importScripts: ['/push-sw.js'],
          globPatterns: ['**/*.{js,css,html,woff2}'],
          manifestTransforms: [
            (entries) => {
              const indexHtml = readFileSync(
                path.resolve(__dirname, '../../dist/packages/web/index.html'),
                'utf8',
              );
              const initialAssetUrls = new Set(
                Array.from(
                  indexHtml.matchAll(/(?:src|href)="\/([^"]+\.js)"/g),
                  (match) => match[1],
                ),
              );
              const initialStylesheetUrls = new Set(
                Array.from(
                  indexHtml.matchAll(/href="\/([^"]+\.css)"/g),
                  (match) => match[1],
                ),
              );
              return {
                manifest: entries.filter(
                  (entry) =>
                    entry.url === 'index.html' ||
                    entry.url.endsWith('.woff2') ||
                    initialAssetUrls.has(entry.url) ||
                    initialStylesheetUrls.has(entry.url),
                ),
                warnings: [],
              };
            },
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api(?:\/|$)/,
            /^\/mcp(?:\/|$)/,
            /^\/blog(?:\/|$)/,
            /^\/feed\.xml$/,
            /^\/robots\.txt$/,
            /^\/sitemap\.xml$/,
            /^\/\.well-known(?:\/|$)/,
            /^\/(?:register|authorize|token|revoke)(?:\/|$)/,
          ],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                (request.destination === 'script' ||
                  request.destination === 'style' ||
                  request.destination === 'worker'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'plugr-app-assets-v1',
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 180,
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.method === 'GET' &&
                !request.headers.has('authorization') &&
                url.origin === self.location.origin &&
                (url.pathname.startsWith('/api/v1/templates') ||
                  url.pathname === '/api/v1/user-billing/pricing'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'plugr-public-data-v1',
                networkTimeoutSeconds: 4,
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxAgeSeconds: 24 * 60 * 60,
                  maxEntries: 60,
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'image' &&
                !url.pathname.startsWith('/api/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'plugr-images-v1',
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 120,
                },
              },
            },
            {
              urlPattern: /\/api\/v1\/templates-telemetry\/event$/,
              method: 'POST',
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'plugr-safe-actions-v1',
                  options: {
                    maxRetentionTime: 24 * 60,
                  },
                },
              },
            },
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],

    build: {
      cssCodeSplit: true,
      outDir: '../../dist/packages/web',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            return undefined;
          },
        },
        onLog(level, log, handler) {
          if (
            log.cause &&
            log.message.includes(`Can't resolve original location of error.`)
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  };
});
