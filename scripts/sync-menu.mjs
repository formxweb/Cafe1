// Pulls the live La Joie menu (the same public, read-only data the current
// menu app at lajoiemersin.com.tr shows) into src/data/menu.json and downloads
// any product photos that are not yet in src/assets/menu.
//
// Usage: npm run sync:menu
// New photos get a transparent cut-out with scripts/cutouts.py (optional);
// until then the site falls back to the original photo.

import { writeFile, access, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { liveMenu } from '../src/data/site.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const photoDir = path.join(root, 'src/assets/menu');
const outFile = path.join(root, 'src/data/menu.json');

const headers = {
  apikey: liveMenu.anonKey,
  Authorization: `Bearer ${liveMenu.anonKey}`,
  'Content-Type': 'application/json',
};

async function get(table, query) {
  const res = await fetch(`${liveMenu.url}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return res.json();
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const [categories, products, options] = await Promise.all([
  get('categories', 'select=id,name,position&active=eq.true&order=position'),
  get('products', 'select=id,category_id,name,description,price,image_path,position,sold_out&active=eq.true&order=position,id'),
  fetch(`${liveMenu.url}/rest/v1/rpc/menu_secenekleri`, { method: 'POST', headers, body: '{}' }).then((r) => {
    if (!r.ok) throw new Error(`menu_secenekleri: HTTP ${r.status}`);
    return r.json();
  }),
]);

await mkdir(photoDir, { recursive: true });
for (const p of products) {
  if (!p.image_path) continue;
  const file = path.join(photoDir, `${p.id}.jpg`);
  if (await exists(file)) continue;
  const res = await fetch(`${liveMenu.url}/storage/v1/object/public/menu-images/${p.image_path}`);
  if (!res.ok) throw new Error(`photo ${p.id}: HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log(`photo ${p.id} downloaded`);
}

const menu = {
  syncedAt: new Date().toISOString(),
  categories: categories.map(({ id, name, position }) => ({ id, name, position })),
  products: products.map((p) => ({
    id: p.id,
    categoryId: p.category_id,
    name: p.name.trim(),
    description: (p.description ?? '').trim(),
    price: p.price,
    soldOut: p.sold_out,
    hasPhoto: Boolean(p.image_path),
    options: options
      .filter((g) => g.product_id === p.id)
      .sort((a, b) => a.position - b.position)
      .map((g) => ({
        name: g.name,
        mode: g.price_mode,
        choices: g.options.map((o) => ({ name: o.name.trim(), price: o.price, soldOut: o.sold_out })),
      })),
  })),
};

await writeFile(outFile, `${JSON.stringify(menu, null, 2)}\n`);
console.log(`${menu.categories.length} categories, ${menu.products.length} products → src/data/menu.json`);
