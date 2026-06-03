/* Screen wake-lock (M3) — keep the display awake while navigating underway. Uses the
 * standard Screen Wake Lock API, which works both in the PWA and inside the Capacitor
 * Android WebView (Chromium), so no extra native plugin is needed. Best-effort: silently
 * no-ops where unsupported, and re-acquires on tab/app re-focus (locks drop on blur). */

let lock = null;
let wanted = false;

async function acquire() {
  if (!wanted || lock || !('wakeLock' in navigator)) return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => {
      lock = null;
    });
  } catch {
    /* denied / unsupported — ignore */
  }
}

export async function keepAwake() {
  wanted = true;
  await acquire();
}

export async function allowSleep() {
  wanted = false;
  if (lock) {
    try {
      await lock.release();
    } catch {
      /* ignore */
    }
    lock = null;
  }
}

// Wake locks are dropped when the page is hidden; re-acquire when it returns.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') acquire();
});
