// One passive scroll/resize listener for the whole page. Callbacks run at
// most once per animation frame and once right away.

const callbacks = new Set();
let queued = false;

function run() {
  queued = false;
  callbacks.forEach((callback) => callback());
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
}

addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue, { passive: true });

export function onFrame(callback) {
  callbacks.add(callback);
  callback();
}

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Scroll progress of a tall element through the viewport: 0 when its top
 * reaches the top of the viewport, 1 when its bottom reaches the bottom.
 * Used by the sticky chapters.
 */
export function stickyProgress(el) {
  const rect = el.getBoundingClientRect();
  const distance = rect.height - innerHeight;
  if (distance <= 0) return rect.top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -rect.top / distance));
}

/**
 * Progress of an element passing through the viewport: 0 when its top enters
 * at the bottom, 1 when its bottom leaves at the top.
 */
export function passProgress(el) {
  const rect = el.getBoundingClientRect();
  return Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight + rect.height)));
}
