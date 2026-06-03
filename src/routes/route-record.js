/* Pure helpers for the saved-routes library (M2). No Leaflet / DOM / IndexedDB deps,
 * so the record shape, distance and date formatting are unit-testable in isolation.
 *
 * A stored route record looks like:
 *   { id, name, wpts:[{lat,lon,name,type,vhf,action,depth}], extended,
 *     distanceNM, createdAt, updatedAt }
 * The runtime-only `_id` on waypoints is stripped before storing. */

import { nm } from '../geo/geo.js';

/** One-way route length in nautical miles (sum of the legs). */
export function routeDistanceNM(wpts) {
  let d = 0;
  for (let i = 0; i < wpts.length - 1; i++) d += nm(wpts[i], wpts[i + 1]);
  return d;
}

/** Collision-resistant id for a library entry. */
export function newRouteId() {
  return 'rt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

const stripId = ({ _id, ...w }) => w;

/** Build a storable library record from a route state (`{name, wpts, extended}`). */
export function toRecord(state, { id, createdAt, now = Date.now() } = {}) {
  const wpts = state.wpts.map(stripId);
  return {
    id: id || newRouteId(),
    name: state.name,
    wpts,
    extended: !!state.extended,
    distanceNM: routeDistanceNM(wpts),
    createdAt: createdAt || now,
    updatedAt: now,
  };
}

/** Convert a stored record back into a route state. The caller assigns runtime `_id`s. */
export function recordToState(rec) {
  return { name: rec.name, wpts: rec.wpts.map((w) => ({ ...w })), extended: !!rec.extended };
}

const MONTHS = [
  'ינו׳',
  'פבר׳',
  'מרץ',
  'אפר׳',
  'מאי',
  'יוני',
  'יולי',
  'אוג׳',
  'ספט׳',
  'אוק׳',
  'נוב׳',
  'דצמ׳',
];

/** Short Hebrew date for the routes list — "היום" / "אתמול" / "3 ביוני". */
export function formatDate(ts, now = Date.now()) {
  const d = new Date(ts);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, new Date(now))) return 'היום';
  if (sameDay(d, new Date(now - 86400000))) return 'אתמול';
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.getDate() + ' ב' + MONTHS[d.getMonth()] + (sameYear ? '' : ' ' + d.getFullYear());
}
