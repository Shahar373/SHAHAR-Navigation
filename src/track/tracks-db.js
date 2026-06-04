/* IndexedDB store for recorded tracks (M4) — separate from the routes library. Same tiny
 * hand-rolled wrapper style as routes-db.js (no extra deps). Records:
 *   { id, name, points:[{lat,lon,t}], distanceNM, durMs, createdAt } */

const DB_NAME = 'mnp-tracks';
const STORE = 'tracks';
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

export function putTrack(rec) {
  return withStore('readwrite', (st) => st.put(rec)).then(() => rec);
}
export function getAllTracks() {
  return withStore('readonly', (st) => st.getAll()).then((list) =>
    (list || []).sort((a, b) => b.createdAt - a.createdAt)
  );
}
export function deleteTrack(id) {
  return withStore('readwrite', (st) => st.delete(id));
}
