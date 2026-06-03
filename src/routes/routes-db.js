/* IndexedDB-backed saved-routes library (M2). A tiny hand-rolled Promise wrapper —
 * no `idb` dependency, honoring the "minimal, keyless deps" constraint. One object
 * store ('routes', keyPath 'id') holding the records produced by route-record.js.
 *
 * Persistence here is the durable library; the in-progress draft is in draft.js.
 * jsdom has no IndexedDB, so this module is exercised in the browser, not in unit
 * tests (the pure record/date logic in route-record.js is what gets tested). */

const DB_NAME = 'mnp-routes';
const STORE = 'routes';
const VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function withStore(mode, run) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = run(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onabort = tx.onerror = () => reject(tx.error);
      })
  );
}

/** Insert or replace a record; resolves with the record. */
export function putRoute(rec) {
  return withStore('readwrite', (st) => st.put(rec)).then(() => rec);
}

/** All records, newest-updated first. */
export function getAllRoutes() {
  return withStore('readonly', (st) => st.getAll()).then((list) =>
    (list || []).sort((a, b) => b.updatedAt - a.updatedAt)
  );
}

/** Single record by id (or undefined). */
export function getRoute(id) {
  return withStore('readonly', (st) => st.get(id));
}

export function deleteRoute(id) {
  return withStore('readwrite', (st) => st.delete(id));
}
