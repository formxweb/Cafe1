// Renders public/og.jpg (1200×630), the image shown when the site is shared:
// the La Joie wordmark on paper with the flat white in its LJ cup.
//
// Usage: node scripts/og-image.mjs

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { letters, descriptor } from '../src/components/brand/paths.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const W = 1200;
const H = 630;

const wordmark = `
<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${Math.round((700 * 378) / 1160)}" viewBox="0 12 1160 378">
  <path d="${letters}" fill="#173f32" fill-rule="evenodd"/>
  <path d="M850 70 Q897 116 944 70" fill="none" stroke="#c6a15b" stroke-width="13" stroke-linecap="round"/>
  <circle cx="897" cy="46" r="25" fill="#c6a15b"/>
  <g fill="#173f32">${descriptor}</g>
  <rect x="21" y="361" width="177" height="5" rx="2.5" fill="#c6a15b"/>
  <rect x="956" y="361" width="175" height="5" rx="2.5" fill="#c6a15b"/>
</svg>`;

// Stone table under the cup, paper above: the same set as the Masa chapter
const surface = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f7f0e2"/>
  <rect y="455" width="${W}" height="${H - 455}" fill="#e8dbc2"/>
  <rect y="455" width="${W}" height="1" fill="#12251b" fill-opacity="0.16"/>
  <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
  <ellipse cx="930" cy="560" rx="185" ry="22" fill="#3e2c12" fill-opacity="0.22" filter="url(#soft)"/>
</svg>`;

const cup = await sharp(path.join(root, 'src/assets/cutouts/40.webp')).resize({ width: 420 }).toBuffer();
const cupMeta = await sharp(cup).metadata();

await sharp(Buffer.from(surface))
  .composite([
    { input: Buffer.from(wordmark), left: 64, top: 70 },
    { input: cup, left: 930 - 210, top: 575 - cupMeta.height },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(root, 'public/og.jpg'));

console.log('public/og.jpg written');
