import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const sourceSvg = readFileSync(
  path.join(webRoot, 'public', 'favicon.svg'),
  'utf8'
);
const outputDirectory = path.join(webRoot, 'public', 'icons');
const regularSizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outputDirectory, { recursive: true });

function renderPng(svg, size) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
    .render()
    .asPng();
}

for (const size of regularSizes) {
  writeFileSync(
    path.join(outputDirectory, `icon-${size}.png`),
    renderPng(sourceSvg, size)
  );
}

const viewBox =
  sourceSvg.match(/viewBox=["']([^"']+)["']/i)?.[1] ?? '0 0 512 512';
const innerMarkup = sourceSvg
  .replace(/^[\s\S]*?<svg[^>]*>/i, '')
  .replace(/<\/svg>\s*$/i, '');
const maskableSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#0a0a0b" />
    <svg x="64" y="64" width="384" height="384" viewBox="${viewBox}">
      ${innerMarkup}
    </svg>
  </svg>
`;

for (const size of [192, 512]) {
  writeFileSync(
    path.join(outputDirectory, `icon-${size}-maskable.png`),
    renderPng(maskableSvg, size)
  );
}

console.log(`Generated ${regularSizes.length + 2} Plugr PWA icons.`);
