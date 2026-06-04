/* Shared live-position service (M4). Owns a single geolocation watch and fans positions
 * out to multiple consumers (the locate marker, the live-nav HUD, the track recorder), so
 * we never run two GPS watches. Holds the screen wake-lock while any consumer is active.
 * Foreground only — recording runs while the app is open (the chosen M4 mode). */

import { startWatch } from '../platform/geolocation.js';
import { keepAwake, allowSleep } from '../platform/wakelock.js';

const posSubs = new Set();
const errSubs = new Set();
let stopFn = null;
let starting = false;
let last = null;

async function ensureWatch() {
  if (stopFn || starting) return;
  starting = true;
  keepAwake();
  const fn = await startWatch(
    (p) => {
      last = p;
      posSubs.forEach((f) => f(p));
    },
    (e) => errSubs.forEach((f) => f(e))
  );
  starting = false;
  stopFn = fn;
  if (!posSubs.size) teardown(); // everyone left during async setup
}

function teardown() {
  if (stopFn) stopFn();
  stopFn = null;
  allowSleep();
  last = null;
}

/** Subscribe to positions. Returns an unsubscribe function. Starts the watch on the first
 * subscriber and stops it (releasing the wake-lock) when the last one leaves. */
export function subscribe(onPos, onErr) {
  posSubs.add(onPos);
  if (onErr) errSubs.add(onErr);
  if (last) onPos(last);
  ensureWatch();
  return () => {
    posSubs.delete(onPos);
    if (onErr) errSubs.delete(onErr);
    if (!posSubs.size) teardown();
  };
}

export const lastPosition = () => last;
