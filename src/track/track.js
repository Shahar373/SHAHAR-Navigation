/* Pure track helpers (M4) — recorded-track distance, stats and GPX. No Leaflet/DOM, so
 * they are unit-testable. A track point is { lat, lon, t } (t = epoch ms); `spd`/`acc`
 * may be present from the GPS but stats are derived from positions + time. */

import { nm } from '../geo/geo.js';

export function trackDistanceNM(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += nm(pts[i - 1], pts[i]);
  return d;
}

/** Distance (NM), duration (ms), average + max speed-over-ground (knots), point count. */
export function trackStats(pts) {
  const distNM = trackDistanceNM(pts);
  const durMs = pts.length > 1 ? pts[pts.length - 1].t - pts[0].t : 0;
  const hours = durMs / 3_600_000;
  const avgKt = hours > 0 ? distNM / hours : 0;
  let maxKt = 0;
  for (let i = 1; i < pts.length; i++) {
    const dt = (pts[i].t - pts[i - 1].t) / 3_600_000;
    if (dt > 0) {
      const v = nm(pts[i - 1], pts[i]) / dt;
      if (v > maxKt && v < 60) maxKt = v; // ignore GPS jumps
    }
  }
  return { distNM, durMs, avgKt, maxKt, points: pts.length };
}

/** "h:mm:ss" elapsed-time label. */
export function fmtDur(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h + ':' + pad(m) + ':' + pad(sec);
}

const xmlEscape = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** GPX 1.1 <trk> with timestamped <trkpt>s. */
export function toTrackGpx(name, pts) {
  let g =
    '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MarineNavPro" xmlns="http://www.topografix.com/GPX/1/1">\n';
  g += `  <trk><name>${xmlEscape(name)}</name><trkseg>\n`;
  pts.forEach((p) => {
    const time = p.t ? `<time>${new Date(p.t).toISOString()}</time>` : '';
    g += `    <trkpt lat="${p.lat}" lon="${p.lon}">${time}</trkpt>\n`;
  });
  g += '  </trkseg></trk>\n</gpx>';
  return g;
}
