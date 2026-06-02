/* Static display aids: coast line, 1-NM rings, 12-NM limit line + label, allowed zone (L433–439, L518–521). */

import L from 'leaflet';
import { map } from './map.js';
import { COAST } from '../state/defaults.js';
import { store } from '../state/store.js';
import { dest, brg } from '../geo/geo.js';
import { bindTog } from '../ui/dom.js';

const coast = L.polyline(COAST, { color: '#caa472', weight: 1.6, opacity: 0.5, dashArray: '1,6' });
const rings = L.layerGroup();

const twelvePts = COAST.map((p, i) => {
  const a = COAST[Math.max(0, i - 1)],
    b = COAST[Math.min(COAST.length - 1, i + 1)];
  const cb = brg({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] });
  const sea = (cb - 90 + 360) % 360;
  return dest(p[0], p[1], sea, 12);
});
const twelve = L.polyline(twelvePts, {
  color: '#ffb84d',
  weight: 2,
  opacity: 0.85,
  dashArray: '10,6',
});
const twelveLbl = L.marker(twelvePts[Math.floor(twelvePts.length / 2)], {
  icon: L.divIcon({
    className: '',
    html: '<div style="background:rgba(255,184,77,.92);color:#06151d;font:700 10px Heebo;padding:2px 8px;border-radius:6px;white-space:nowrap">גבול 12 מייל · משיט 30</div>',
    iconSize: [120, 18],
    iconAnchor: [60, 9],
  }),
});
const zone = L.polygon([...COAST, ...twelvePts.slice().reverse()], {
  color: '#ffb84d',
  weight: 0,
  fillColor: '#41d3cb',
  fillOpacity: 0.06,
});

export function init() {
  bindTog(
    'tgCoast',
    () => coast.addTo(map),
    () => coast.remove()
  );
  bindTog(
    'tgRings',
    () => {
      rings.clearLayers();
      [store.state.wpts[0], store.state.wpts[store.state.wpts.length - 1]].forEach(
        (w) =>
          w &&
          L.circle([w.lat, w.lon], {
            radius: 1852,
            color: '#7aa7c7',
            weight: 1,
            opacity: 0.4,
            fill: false,
            dashArray: '3,7',
          }).addTo(rings)
      );
      rings.addTo(map);
    },
    () => rings.remove()
  );
  bindTog(
    'tg12',
    () => {
      twelve.addTo(map);
      twelveLbl.addTo(map);
    },
    () => {
      twelve.remove();
      twelveLbl.remove();
    }
  );
  bindTog(
    'tgZone',
    () => zone.addTo(map),
    () => zone.remove()
  );
}
