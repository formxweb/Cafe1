import menu from '../data/menu.json';
import { formatPrice, priceLabel } from './price.js';

// Files are named by product id: src/assets/menu/36.jpg, src/assets/cutouts/36.webp
const byId = (files) =>
  Object.fromEntries(Object.entries(files).map(([file, image]) => [file.match(/(\d+)\.\w+$/)[1], image]));

const cutouts = byId(import.meta.glob('../assets/cutouts/*.webp', { eager: true, import: 'default' }));
const photos = byId(import.meta.glob('../assets/menu/*.jpg', { eager: true, import: 'default' }));

/** Transparent cut-out when one exists, otherwise the original photo on cream paper. */
export function productImage(id) {
  return cutouts[id] ?? photos[id] ?? null;
}

/** The original square studio photo (cream paper with the La Joie watermark). */
export function productPhoto(id) {
  return photos[id] ?? null;
}

const locale = 'tr-TR';

/** "MAKARNA KULÜBÜ" → "Makarna Kulübü" (Turkish casing rules for I/İ). */
export function titleCase(text) {
  return text
    .toLocaleLowerCase(locale)
    .split(' ')
    .map((word) => word.charAt(0).toLocaleUpperCase(locale) + word.slice(1))
    .join(' ');
}

export const slug = (text) =>
  text
    .toLocaleLowerCase(locale)
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Editorial order for the site: coffee first, then the kitchen through the day.
// Categories not listed here (added later in the menu app) follow at the end.
const ORDER = [
  'KAHVE & İÇECEKLER',
  'TATLILAR',
  'EN ÇOK TERCİH EDİLENLER',
  'KAHVALTI',
  'MAKARNA KULÜBÜ',
  'TAVUK & KÖFTE',
  'DOYURAN MENÜLER',
  'SALATALAR',
  'ÇITIR EKSTRALAR',
  'ÖĞRENCİ MENÜSÜ',
];
const FAVOURITES = 'EN ÇOK TERCİH EDİLENLER';

const rank = (name) => {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length : i;
};

const favouriteNames = new Set(
  menu.products
    .filter((p) => menu.categories.find((c) => c.id === p.categoryId)?.name === FAVOURITES)
    .map((p) => p.name),
);

/**
 * Option lines shown under a product, e.g. "Sıcak · Buzlu" or "6’lı · 9’lu +30 ₺".
 * A single free choice (the drink that comes with a menu) is already in the
 * description, so it is left out.
 */
function optionLines(product) {
  return product.options
    .filter((g) => !(g.choices.length === 1 && g.choices[0].price === 0))
    .map((g) =>
      g.choices.map((c) => ({
        name: c.name,
        price: g.mode === 'absolute' ? formatPrice(c.price) : c.price > 0 ? `+${formatPrice(c.price)}` : '',
        soldOut: c.soldOut,
      })),
    );
}

function toItem(p) {
  const { min, label } = priceLabel(p.price, p.options);
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    min,
    price: label,
    options: optionLines(p),
    soldOut: p.soldOut,
    favourite: favouriteNames.has(p.name),
    image: p.hasPhoto ? productImage(p.id) : null,
  };
}

export const categories = menu.categories
  .map((c) => ({
    id: c.id,
    key: c.name,
    name: titleCase(c.name),
    slug: slug(c.name),
    isFavourites: c.name === FAVOURITES,
    items: menu.products.filter((p) => p.categoryId === c.id).map(toItem),
  }))
  .filter((c) => c.items.length > 0)
  .sort((a, b) => rank(a.key) - rank(b.key));

const all = menu.products.map(toItem);

/** Look up a product by id for editorial placements (Masa, Gün). */
export function product(id) {
  const item = all.find((p) => p.id === id);
  if (!item) throw new Error(`Menu product ${id} is not in src/data/menu.json`);
  return item;
}

export const syncedAt = new Date(menu.syncedAt);
export const productCount = new Set(menu.products.map((p) => p.name)).size;
