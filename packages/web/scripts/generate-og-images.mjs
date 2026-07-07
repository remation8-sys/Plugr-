// Generates a distinct, branded Open Graph / Twitter card + schema "image"
// PNG per blog post (1200x630), plus one cover image for the /blog/ index.
// Built with an inline SVG template rasterized via @resvg/resvg-js so every
// post gets real, distinguishable social-card artwork instead of sharing one
// logo file. Runs at build time only (see build-blog.mjs); output PNGs are
// written to public/blog/<slug>/og.png and public/blog/assets/og-cover.png.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const WIDTH = 1200;
const HEIGHT = 630;
const BLUE = '#0055ff';
const INK = '#0d0e1a';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Small deterministic hash so each slug gets a stable, distinct accent hue
// while the base brand gradient (blue -> ink) stays identical across posts.
function hueForSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

// Greedy word-wrap using an estimated average glyph width, since we don't
// have real font metrics available at SVG-string build time.
function wrapTitle(title, fontSize, maxWidth) {
  const avgCharWidth = fontSize * 0.72;
  const maxChars = Math.max(6, Math.floor(maxWidth / avgCharWidth));
  const words = title.toUpperCase().split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildOgSvg({ title, tag, dateLabel }) {
  const hue = hueForSlug(title);
  const accent = `hsl(${hue}, 85%, 62%)`;
  const accentSoft = `hsl(${hue}, 85%, 62%)`;

  let fontSize = 68;
  let lines = wrapTitle(title, fontSize, 980);
  if (lines.length > 3) {
    fontSize = 52;
    lines = wrapTitle(title, fontSize, 980);
  }
  const lineHeight = fontSize * 1.18;
  const blockHeight = lines.length * lineHeight;
  const startY = HEIGHT / 2 - blockHeight / 2 + fontSize * 0.75 - 20;

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="80" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BLUE}" />
      <stop offset="55%" stop-color="#12245e" />
      <stop offset="100%" stop-color="${INK}" />
    </linearGradient>
    <radialGradient id="blob" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accentSoft}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accentSoft}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <circle cx="${1000 + (hue % 60)}" cy="90" r="360" fill="url(#blob)" />
  <rect x="80" y="72" width="${72 + tag.length * 15}" height="44" rx="22" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.55" stroke-width="1.5" />
  <text x="${80 + 20}" y="100" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" letter-spacing="1.5" fill="${accent}">${escapeXml(tag.toUpperCase())}</text>
  <text font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text x="80" y="${HEIGHT - 60}" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#ffffff">PLUGR</text>
  <text x="80" y="${HEIGHT - 32}" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="rgba(255,255,255,0.55)">plugr.cloud/blog</text>
  <text x="${WIDTH - 80}" y="${HEIGHT - 60}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="rgba(255,255,255,0.55)">${escapeXml(dateLabel)}</text>
</svg>`;
}

function rasterize(svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Arial',
    },
  });
  return resvg.render().asPng();
}

export function generatePostOgImage({ title, tag, dateLabel, outPath }) {
  const svg = buildOgSvg({ title, tag: tag || 'Automation', dateLabel });
  const png = rasterize(svg);
  writeFileSync(outPath, png);
}

export function generateBlogCoverImage(outPath) {
  const svg = buildOgSvg({
    title: 'The Plugr Blog',
    tag: 'Automation & AI Agents',
    dateLabel: 'plugr.cloud',
  });
  writeFileSync(outPath, rasterize(svg));
}
