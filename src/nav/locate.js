/* Live geolocation: own-position marker + accuracy circle + distance/bearing to target (L656–668). */

import L from 'leaflet';
import { map } from '../map/map.js';
import { store } from '../state/store.js';
import { nm, brg } from '../geo/geo.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { startWatch } from '../platform/geolocation.js';
import { keepAwake, allowSleep } from '../platform/wakelock.js';

let posMarker = null,
  accCircle = null,
  stopWatch = null,
  starting = false;

function onPos(p) {
  const ll = [p.coords.latitude, p.coords.longitude];
  if (!posMarker) {
    posMarker = L.circleMarker(ll, {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: '#41d3cb',
      fillOpacity: 1,
    }).addTo(map);
    accCircle = L.circle(ll, {
      radius: p.coords.accuracy || 30,
      color: '#41d3cb',
      weight: 1,
      fillOpacity: 0.07,
    }).addTo(map);
    map.flyTo(ll, 14, { duration: 0.8 });
  } else {
    posMarker.setLatLng(ll);
    accCircle.setLatLng(ll).setRadius(p.coords.accuracy || 30);
  }
  const me = { lat: ll[0], lon: ll[1] };
  const tgt =
    store.state.wpts.find((w) => w.type === 'turn') ||
    store.state.wpts[store.state.wpts.length - 1];
  if (!tgt) return;
  $('navlive').classList.add('on');
  $('navDist').textContent = nm(me, tgt).toFixed(2) + ' NM';
  $('navTgt').textContent = '→ ' + Math.round(brg(me, tgt)) + '° · ' + tgt.name.split('—')[0];
}

function stop(btn) {
  if (stopWatch) stopWatch();
  stopWatch = null;
  allowSleep();
  btn.classList.remove('active');
  $('navlive').classList.remove('on');
  if (posMarker) posMarker.remove();
  if (accCircle) accCircle.remove();
  posMarker = accCircle = null;
}

export function init() {
  $('btnLocate').onclick = async (e) => {
    const btn = e.currentTarget;
    if (stopWatch) return stop(btn);
    if (starting) return;
    starting = true;
    btn.classList.add('active');
    toast('מאתר מיקום…');
    keepAwake(); // keep the screen on while navigating underway
    const stopFn = await startWatch(onPos, () => {
      toast('מיקום נחסם/נכשל — בדוק הרשאות מיקום');
      stop(btn);
    });
    starting = false;
    if (btn.classList.contains('active')) stopWatch = stopFn;
    else stopFn(); // toggled off during async permission prompt
  };
}
