// Live details on a static page: whether La Joie is open right now, and the
// current menu prices from the café's own menu app. If the menu request
// fails, the prices from the last sync simply stay on the page.

import { site, liveMenu } from '../data/site.js';
import { openStatus } from '../lib/hours.js';
import { priceLabel } from '../lib/price.js';

function showStatus() {
  const { isOpen, label } = openStatus(site);
  document.querySelectorAll('[data-open-status]').forEach((el) => {
    el.textContent = label;
    el.dataset.open = String(isOpen);
  });
}

showStatus();
setInterval(showStatus, 60_000);

async function refreshPrices() {
  const headers = { apikey: liveMenu.anonKey, Authorization: `Bearer ${liveMenu.anonKey}` };
  const signal = AbortSignal.timeout(6000);
  const [products, groups] = await Promise.all([
    fetch(`${liveMenu.url}/rest/v1/products?select=id,price,sold_out&active=eq.true`, { headers, signal }).then((r) =>
      r.ok ? r.json() : Promise.reject(r.status),
    ),
    fetch(`${liveMenu.url}/rest/v1/rpc/menu_secenekleri`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: '{}',
      signal,
    }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
  ]);

  const live = new Map(products.map((p) => [p.id, p]));

  document.querySelectorAll('[data-price-for]').forEach((el) => {
    const id = Number(el.dataset.priceFor);
    const product = live.get(id);
    const row = el.closest('[data-item]');
    if (!product) {
      // Taken off the menu since the last sync
      if (row) row.hidden = true;
      return;
    }
    const options = groups
      .filter((g) => g.product_id === id)
      .map((g) => ({ mode: g.price_mode, choices: g.options }));
    const { label } = priceLabel(product.price, options);
    if (el.textContent !== label) el.textContent = label;
    row?.classList.toggle('is-sold-out', product.sold_out);
  });

  document.querySelectorAll('[data-menu-freshness]').forEach((el) => {
    el.textContent = 'Fiyatlar menü uygulamamızla eşzamanlı';
  });
}

if (liveMenu.enabled) {
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
  idle(() => refreshPrices().catch(() => {}));
}
