/* Pure geodesy helpers — nautical miles, bearings, degrees-decimal-minutes.
 * Lifted verbatim from the original single-file app (no behavior change). */

export const R_NM = 3440.065;
export const D2R = Math.PI / 180;

/** Great-circle distance between two {lat,lon} points, in nautical miles. */
export function nm(a, b) {
  const dLa = (b.lat - a.lat) * D2R,
    dLo = (b.lon - a.lon) * D2R,
    la1 = a.lat * D2R,
    la2 = b.lat * D2R;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.sqrt(h));
}

/** Initial bearing a→b in degrees (0–360). */
export function brg(a, b) {
  const la1 = a.lat * D2R,
    la2 = b.lat * D2R,
    dLo = (b.lon - a.lon) * D2R;
  const y = Math.sin(dLo) * Math.cos(la2),
    x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLo);
  return (Math.atan2(y, x) / D2R + 360) % 360;
}

/** Destination [lat,lon] from a point, bearing (deg) and distance (NM). */
export function dest(lat, lon, b, d) {
  const δ = d / R_NM,
    θ = b * D2R,
    φ1 = lat * D2R,
    λ1 = lon * D2R;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [φ2 / D2R, ((λ2 / D2R + 540) % 360) - 180];
}

/** Format lat/lon as degrees-decimal-minutes, e.g. 32°09.783'N 034°47.774'E. */
export function dm(lat, lon) {
  function one(v, p, n, t) {
    const h = v >= 0 ? p : n;
    v = Math.abs(v);
    const d = Math.floor(v),
      m = (v - d) * 60;
    return String(d).padStart(t ? 3 : 2, '0') + '°' + m.toFixed(3).padStart(6, '0') + "'" + h;
  }
  return one(lat, 'N', 'S', false) + ' ' + one(lon, 'E', 'W', true);
}

/** Hours → "H:MM שעות". */
export function hm(h) {
  const t = Math.round(h * 60);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') + ' שעות';
}

/** Approximate point→segment distance in NM via a local planar projection. */
export function ptSegNM(p, a, b) {
  const k = Math.cos(p.lat * D2R);
  const ax = a.lon * k,
    ay = a.lat,
    bx = b.lon * k,
    by = b.lat,
    px = p.lon * k,
    py = p.lat;
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1e-9))
  );
  const cx = ax + t * dx,
    cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy) * 60;
}
