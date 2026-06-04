/* Pure wind/current-aware ETA model (M4). A planning approximation (the app is a planning
 * aid, not certified navigation): effective speed-over-ground per leg = cruise speed plus the
 * along-track current component, plus a small wind term (headwind slows more than a tailwind
 * helps). Inputs:
 *   wind:    { spd (m/s), dir (deg, meteorological "from") }  | null
 *   current: { spd (m/s), dir (deg, oceanographic "toward") } | null
 * Speeds are knots out. SOG is floored at 1 kt so ETA stays finite. */

import { nm, brg } from '../geo/geo.js';

const D2R = Math.PI / 180;
const MS_TO_KT = 1.94384;

export function legSOG(cruiseKt, bearing, wind, current) {
  let sog = cruiseKt;
  if (current && current.spd) {
    sog += current.spd * MS_TO_KT * Math.cos((current.dir - bearing) * D2R);
  }
  if (wind && wind.spd) {
    const toward = wind.dir + 180; // wind blows toward (from + 180)
    const along = wind.spd * MS_TO_KT * Math.cos((toward - bearing) * D2R); // + tailwind, − headwind
    sog += along < 0 ? along * 0.07 : along * 0.03;
  }
  return Math.max(1, sog);
}

/** Total hours for the route at cruise speed, adjusted for wind/current.
 * roundTrip also sums the return legs (reversed bearings). */
export function routeHours(wpts, cruiseKt, wind, current, roundTrip = true) {
  let h = 0;
  for (let i = 0; i < wpts.length - 1; i++) {
    const d = nm(wpts[i], wpts[i + 1]);
    h += d / legSOG(cruiseKt, brg(wpts[i], wpts[i + 1]), wind, current);
    if (roundTrip) h += d / legSOG(cruiseKt, brg(wpts[i + 1], wpts[i]), wind, current);
  }
  return h;
}

/** True if wind/current meaningfully change the estimate (used to show the adjusted line). */
export function hasEnv(wind, current) {
  return !!((wind && wind.spd > 0.5) || (current && current.spd > 0.02));
}
