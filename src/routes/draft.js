/* Working-route autosave (M2). The single in-progress route is mirrored to
 * localStorage so it survives a reload / app close, and is restored on startup
 * ("manual save to the library + automatic restore of the working route").
 *
 * The named library lives in IndexedDB (routes-db.js); this is only the volatile
 * draft. localStorage is used deliberately: it is synchronous, so the draft can be
 * restored before the first map paint with no flicker (mirrors forecast-cache.js). */

const KEY = 'mnp.draft';

const stripId = ({ _id, ...w }) => w;

/** Persist the current route state. Never throws (storage may be full/blocked). */
export function saveDraft(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        name: state.name,
        wpts: state.wpts.map(stripId),
        extended: !!state.extended,
      })
    );
  } catch {
    /* ignore quota / private-mode errors — the draft is best-effort */
  }
}

/** Restore the saved draft, or null if none / unreadable. */
export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.wpts)) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
