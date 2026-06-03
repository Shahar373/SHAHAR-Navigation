/* Distance measure tool (NM) (L637–644). Requests edit-mode-off via the bus to avoid a cycle. */

import L from 'leaflet';
import { map } from '../map/map.js';
import { store, emit } from '../state/store.js';
import { nm } from '../geo/geo.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';

let mPts = [],
  mLine = null,
  mMarkers = [];

function addMeasure(ll) {
  mPts.push(ll);
  mMarkers.push(
    L.circleMarker(ll, { radius: 4, color: '#ffb84d', fillColor: '#ffb84d', fillOpacity: 1 }).addTo(
      map
    )
  );
  if (mLine) mLine.remove();
  mLine = L.polyline(mPts, { color: '#ffb84d', weight: 2, dashArray: '4,5' }).addTo(map);
  let d = 0;
  for (let i = 1; i < mPts.length; i++)
    d += nm({ lat: mPts[i - 1].lat, lon: mPts[i - 1].lng }, { lat: mPts[i].lat, lon: mPts[i].lng });
  $('rdMeasure').textContent = d.toFixed(2) + ' NM';
}

function clearMeasure() {
  store.measuring = false;
  $('btnMeasure').classList.remove('active');
  map.getContainer().style.cursor = store.editMode ? 'copy' : '';
  if (mLine) mLine.remove();
  mMarkers.forEach((m) => m.remove());
  mPts = [];
  mMarkers = [];
  $('rdMeasure').style.display = 'none';
}

export function init() {
  const rdM = $('rdMeasure');
  $('btnMeasure').onclick = (e) => {
    store.measuring = !store.measuring;
    e.currentTarget.classList.toggle('active', store.measuring);
    if (store.measuring) {
      if (store.editMode) emit('edit:off');
      toast('מדידה: לחץ נקודות. כפתור שוב לאיפוס.');
      map.getContainer().style.cursor = 'crosshair';
      rdM.style.display = 'inline';
      rdM.textContent = '0.00 NM';
    } else clearMeasure();
  };
  map.on('click', (e) => {
    if (store.measuring) addMeasure(e.latlng);
  });
}
