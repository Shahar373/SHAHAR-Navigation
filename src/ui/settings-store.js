/* Persisted user settings (M5) — theme + remembered form defaults (cruise speed, fuel
 * setup, ₪/litre). Pure localStorage get/set so it's unit-testable; the DOM wiring lives
 * in settings.js. Best-effort: never throws if storage is unavailable. */

const KEY = 'mnp.settings';

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSettings(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj || {}));
  } catch {
    /* ignore quota / private-mode */
  }
}

/** Merge a partial into the stored settings and return the result. */
export function patchSettings(partial) {
  const next = { ...loadSettings(), ...partial };
  saveSettings(next);
  return next;
}
