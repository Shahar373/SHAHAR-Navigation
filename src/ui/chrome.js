/* Map chrome: coord/zoom readouts, fit-to-route, day/night, fullscreen, mobile menu (L646–654). */

import { map } from '../map/map.js';
import { dm } from '../geo/geo.js';
import { $ } from './dom.js';
import { toast } from './toast.js';
import { getRouteLine } from '../route/route.js';
import { toggleNight } from './settings.js';

export function init() {
  const rdC = $('rdCoord'),
    rdZ = $('rdZoom');
  map.on('mousemove', (e) => (rdC.textContent = dm(e.latlng.lat, e.latlng.lng)));
  const updZ = () => (rdZ.textContent = 'z' + map.getZoom().toFixed(1));
  map.on('zoom', updZ);
  updZ();

  $('btnFit').onclick = () => {
    const rl = getRouteLine();
    if (rl) map.flyToBounds(rl.getBounds().pad(0.35), { duration: 0.8 });
  };
  $('btnNight').onclick = () => toggleNight();
  $('btnFull').onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen &&
        document.documentElement.requestFullscreen().catch(() => toast('מסך מלא חסום בתצוגה זו'));
    } else document.exitFullscreen();
  };
  $('menuBtn').onclick = () => $('side').classList.toggle('open');
}
