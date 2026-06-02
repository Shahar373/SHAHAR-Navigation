/* Central mutable state + a tiny event bus.
 *
 * Replaces the original scattered globals (`state`, `editMode`, `oneWay`) and
 * decouples the original implicit call chain
 *   renderRoute -> buildLegs -> updateStats -> updEta -> updFuel
 * into events, so the module import graph stays acyclic. Observable behavior is
 * unchanged: the same functions still run, in the same order, on the same triggers.
 *
 * Events:
 *   'route:changed' — route structure changed (add/remove/move/render)
 *   'legs:changed'  — only waypoint labels changed (rename / type / vhf)
 *   'stats:changed' — distance/speed/ETA recomputed (fuel listens to this)
 *   'edit:off'      — request to leave edit mode (emitted by the measure tool)
 */

import { DEFAULT_WPTS } from './defaults.js';

let uidc = 0;
export function uid() {
  return 'wp' + ++uidc;
}

export const store = {
  state: {
    name: 'הרצליה · צפונה',
    wpts: JSON.parse(JSON.stringify(DEFAULT_WPTS)),
    extended: false,
  },
  editMode: false,
  measuring: false,
  oneWay: 0,
};
store.state.wpts.forEach((w) => (w._id = uid()));

const listeners = {};
export function on(evt, fn) {
  (listeners[evt] ||= []).push(fn);
}
export function emit(evt, payload) {
  (listeners[evt] || []).forEach((fn) => fn(payload));
}
