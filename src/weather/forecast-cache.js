/* Last-forecast cache so wind/marine data still show when offline (M1).
 * Small JSON blobs in localStorage; the routes library moves to IndexedDB in M2.
 * `formatAge` is pure and unit-tested. */

const PREFIX = 'mnp:fc:';

export function saveForecast(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage full / unavailable — caching is best-effort */
  }
}

export function loadForecast(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null; // { at, data } | null
  } catch {
    return null;
  }
}

/** Human "as of" string in Hebrew, e.g. "לפני 12 ד׳". Pure. */
export function formatAge(ts, now = Date.now()) {
  const min = Math.max(0, Math.round((now - ts) / 60000));
  if (min < 1) return 'עכשיו';
  if (min < 60) return `לפני ${min} ד׳`;
  const h = Math.round(min / 60);
  if (h < 24) return `לפני ${h} ש׳`;
  const d = Math.round(h / 24);
  return `לפני ${d} ימים`;
}
