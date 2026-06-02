/* GPX / GeoJSON / native-JSON import & export — DOM/file wiring (L602–634).
 * The pure serialize/parse logic lives in ./serialize.js (unit-tested). */

import { map } from '../map/map.js';
import { store, uid } from '../state/store.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { renderRoute, getRouteLine } from '../route/route.js';
import { toJson, toGeoJson, toGpx, parseRoute } from './serialize.js';

function download(name, text, type) {
  const b = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
}

function applyImport(text, fname) {
  const { wpts, name } = parseRoute(text, fname);
  if (!wpts || !wpts.length) {
    toast('לא נמצאו נקודות בקובץ');
    return;
  }
  wpts.forEach((w) => {
    w._id = uid();
    if (!w.type) w.type = 'cruise';
    if (!w.vhf) w.vhf = '16';
  });
  store.state = { name, wpts, extended: wpts.some((w) => w.type === 'ext') };
  $('btnExtend').classList.toggle('active', store.state.extended);
  renderRoute(true);
  map.flyToBounds(getRouteLine().getBounds().pad(0.4), { duration: 0.8 });
  toast('יובאו ' + wpts.length + ' נקודות ✓');
}

export function init() {
  $('expJson').onclick = () => download('route.json', toJson(store.state), 'application/json');
  $('expGeo').onclick = () =>
    download('route.geojson', toGeoJson(store.state), 'application/geo+json');
  $('expGpx').onclick = () => download('route.gpx', toGpx(store.state), 'application/gpx+xml');
  $('btnImport').onclick = () => $('fileIn').click();
  $('fileIn').onchange = (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        applyImport(rd.result, f.name);
      } catch {
        toast('ייבוא נכשל — בדוק את הקובץ');
      }
      ev.target.value = '';
    };
    rd.readAsText(f);
  };
}
