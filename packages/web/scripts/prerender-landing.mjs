// Injects a static, server-rendered copy of the marketing homepage into the
// already-built dist/packages/web/index.html so non-JS crawlers see real
// content at "/". Runs after `vite build` (client) and after the dedicated
// SSR bundle build (vite.ssr-landing.config.mts) has produced dist-ssr/web/landing.mjs.
//
// index.html is also the SPA fallback for every authenticated app route, so
// the injected markup must only be visible on "/" itself. index.html's own
// inline bootstrap script clears #root before paint on any other path — see
// the <script> immediately after <div id="root"> in index.html.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const WEB_ROOT = path.resolve(import.meta.dirname, '..');
const SSR_BUNDLE = path.join(WEB_ROOT, '..', '..', 'dist-ssr', 'web', 'landing.mjs');
const DIST_INDEX = path.join(WEB_ROOT, '..', '..', 'dist', 'packages', 'web', 'index.html');

async function main() {
  if (!existsSync(SSR_BUNDLE)) {
    throw new Error(`SSR bundle not found at ${SSR_BUNDLE} — run "npm run build:ssr-landing" first`);
  }
  if (!existsSync(DIST_INDEX)) {
    throw new Error(`${DIST_INDEX} not found — run "vite build" first`);
  }

  const { renderLandingHtml } = await import(pathToFileURL(SSR_BUNDLE).href);
  const landingHtml = renderLandingHtml();
  if (!landingHtml || landingHtml.length < 500) {
    throw new Error(`renderLandingHtml() produced suspiciously little output (${landingHtml?.length ?? 0} chars) — aborting injection`);
  }

  const html = readFileSync(DIST_INDEX, 'utf8');
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('Could not find an empty <div id="root"></div> in dist index.html to inject into');
  }

  const injected = html.replace(
    '<div id="root"></div>',
    `<div id="root">${landingHtml}</div>`,
  );
  writeFileSync(DIST_INDEX, injected, 'utf8');
  console.log(`Prerendered landing page injected into ${path.relative(WEB_ROOT, DIST_INDEX)} (${landingHtml.length} chars)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
