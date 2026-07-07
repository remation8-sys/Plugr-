// Build-time only: renders the marketing LandingPage to a static HTML string
// so non-JS crawlers see real content at "/". Never shipped to the browser —
// consumed only by scripts/prerender-landing.mjs via the SSR bundle it builds.
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import { LandingPage } from './index';

export function renderLandingHtml(): string {
  return renderToStaticMarkup(
    <StaticRouter location="/">
      <LandingPage />
    </StaticRouter>,
  );
}
