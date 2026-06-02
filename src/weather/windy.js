/* Windy live-forecast embed modal — wind / waves / currents overlays, keyless (L564–572). */

import { map } from '../map/map.js';
import { $ } from '../ui/dom.js';

function openWindy(ov) {
  const c = map.getCenter();
  const z = Math.min(11, Math.max(7, Math.round(map.getZoom())));
  const prod = ov === 'waves' ? '&product=ecmwfWaves' : '';
  $('windyFrame').src =
    `https://embed.windy.com/embed2.html?lat=${c.lat.toFixed(3)}&lon=${c.lng.toFixed(3)}&detailLat=${c.lat.toFixed(3)}&detailLon=${c.lng.toFixed(3)}&zoom=${z}&level=surface&overlay=${ov}${prod}&menu=&message=true&marker=true&calendar=now&type=map&location=coordinates&metricWind=m%2Fs&metricTemp=%C2%B0C&radarRange=-1`;
  $('windy').classList.add('on');
  document
    .querySelectorAll('.wbtn')
    .forEach((b) => b.classList.toggle('active', b.dataset.ov === ov));
}

export function init() {
  const windy = $('windy'),
    wframe = $('windyFrame');
  $('btnWindy').onclick = () => openWindy('waves');
  $('windyClose').onclick = () => {
    windy.classList.remove('on');
    wframe.src = '';
  };
  windy.addEventListener('click', (e) => {
    if (e.target === windy) {
      windy.classList.remove('on');
      wframe.src = '';
    }
  });
  document.querySelectorAll('.wbtn').forEach((b) => (b.onclick = () => openWindy(b.dataset.ov)));
}
