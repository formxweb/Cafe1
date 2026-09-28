// Price rules shared by the build (menu snapshot) and the browser (live prices).

const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

export const formatPrice = (value) => `${number.format(value)} ₺`;

/**
 * The price shown for a product. An option group that replaces the price
 * ("absolute", e.g. Small/Large) turns it into a range: 230–330 ₺.
 * @param {number} price base price
 * @param {{ mode: string, choices: { price: number }[] }[]} options
 */
export function priceLabel(price, options) {
  const absolute = options.find((g) => g.mode === 'absolute');
  const prices = absolute ? absolute.choices.map((c) => c.price) : [price];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, label: min === max ? formatPrice(min) : `${number.format(min)}–${formatPrice(max)}` };
}
