/* Centralized error handling (M5). Surfaces uncaught errors / promise rejections as a
 * throttled toast instead of failing silently, so a glitch at sea is at least visible.
 * Errors are still logged to the console for debugging. */

import { toast } from './toast.js';

let lastShown = 0;

function report(detail) {
  console.error('[marine-nav]', detail);
  const now = Date.now();
  if (now - lastShown < 5000) return; // don't spam if something loops
  lastShown = now;
  toast('אירעה תקלה זמנית — נסה שוב');
}

export function init() {
  window.addEventListener('error', (e) => report(e.error || e.message));
  window.addEventListener('unhandledrejection', (e) => report(e.reason));
}
