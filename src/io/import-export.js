/* GPX / GeoJSON / native-JSON import & export — DOM/file wiring (L602–634).
 * The pure serialize/parse logic lives in ./serialize.js (unit-tested). */

import { store } from '../state/store.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { loadRoute } from '../route/route.js';
import { saveTextFile } from '../platform/files.js';
import { toJson, toGeoJson, toGpx, parseRoute } from './serialize.js';

async function download(name, text, type) {
  const r = await saveTextFile(name, text, type);
  if (r.native) toast('נשמר לתיקיית המסמכים: ' + r.path + ' ✓');
}

function applyImport(text, fname) {
  const { wpts, name } = parseRoute(text, fname);
  if (!wpts || !wpts.length) {
    toast('לא נמצאו נקודות בקובץ');
    return;
  }
  wpts.forEach((w) => {
    if (!w.type) w.type = 'cruise';
    if (!w.vhf) w.vhf = '16';
  });
  loadRoute({ name, wpts, extended: wpts.some((w) => w.type === 'ext') });
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
