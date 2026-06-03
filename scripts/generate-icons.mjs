/* One-off icon generator: rasterizes the compass-rose brand mark into PWA icons.
 * Run with `node scripts/generate-icons.mjs`. Outputs to public/. The generated
 * PNGs are committed, so this only needs re-running if the artwork changes. */

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Compass rose (100x100 logical units). North pointer is amber; no <text> so we
// don't depend on system fonts at rasterization time.
const rose = (transform) => `
  <g transform="${transform}">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#41d3cb" stroke-width="2" opacity="0.75"/>
    <circle cx="50" cy="50" r="36" fill="none" stroke="#7aa7c7" stroke-width="1.4" opacity="0.55"/>
    <polygon points="50,8 56,50 50,46 44,50" fill="#ffb84d"/>
    <polygon points="50,92 44,50 50,54 56,50" fill="#7aa7c7"/>
    <polygon points="8,50 50,44 46,50 50,56" fill="#7aa7c7"/>
    <polygon points="92,50 50,56 54,50 50,44" fill="#7aa7c7"/>
    <circle cx="50" cy="50" r="3.5" fill="#fff"/>
  </g>`;

const bg = `
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#0b2230"/>
      <stop offset="100%" stop-color="#07151e"/>
    </radialGradient>
  </defs>`;

// rounded-corner icon (for regular "any" purpose + apple-touch + favicon)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${bg}
  <rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="url(#g)"/>
  <rect x="6" y="6" width="500" height="500" rx="106" ry="106" fill="none" stroke="rgba(123,167,199,0.25)" stroke-width="3"/>
  ${rose('translate(86,86) scale(3.4)')}
</svg>`;

// maskable icon: full-bleed background, artwork kept inside the central safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${bg}
  <rect x="0" y="0" width="512" height="512" fill="url(#g)"/>
  ${rose('translate(126,126) scale(2.6)')}
</svg>`;

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(out, file));
  console.log('wrote', file, size + 'x' + size);
}

writeFileSync(join(out, 'favicon.svg'), iconSvg);
console.log('wrote favicon.svg');
await png(iconSvg, 192, 'pwa-192.png');
await png(iconSvg, 512, 'pwa-512.png');
await png(maskableSvg, 512, 'maskable-512.png');
await png(iconSvg, 180, 'apple-touch-icon-180.png');
