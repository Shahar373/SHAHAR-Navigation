/* Route editor: edit-mode toggle, click-to-insert, extend-to-Poleg, new, reset (L575–599). */

import { map } from '../map/map.js';
import { store, uid, on } from '../state/store.js';
import { DEFAULT_WPTS, POLEG } from '../state/defaults.js';
import { ptSegNM } from '../geo/geo.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { renderRoute, getRouteLine } from './route.js';

function setEdit(v) {
  store.editMode = v;
  document.body.classList.toggle('editing', v);
  $('editbar').classList.toggle('on', v);
  $('btnEdit').classList.toggle('active', v);
  $('btnEdit2').classList.toggle('active', v);
  map.getContainer().style.cursor = v ? 'copy' : '';
  renderRoute(false);
  toast(v ? 'מצב עריכה פעיל' : 'עריכה כבויה');
}

export function init() {
  $('btnEdit').onclick = () => setEdit(!store.editMode);
  $('btnEdit2').onclick = () => setEdit(!store.editMode);

  // Leaving edit mode is requested by the measure tool via the bus (avoids an import cycle).
  on('edit:off', () => {
    if (store.editMode) setEdit(false);
  });

  map.on('click', (e) => {
    if (store.measuring) return; // the measure tool handles clicks while measuring
    if (!store.editMode) return;
    const p = { lat: e.latlng.lat, lon: e.latlng.lng };
    // insert at the segment that minimizes added detour
    let best = store.state.wpts.length,
      bestD = Infinity;
    for (let i = 0; i < store.state.wpts.length - 1; i++) {
      const d = ptSegNM(p, store.state.wpts[i], store.state.wpts[i + 1]);
      if (d < bestD) {
        bestD = d;
        best = i + 1;
      }
    }
    if (store.state.wpts.length < 2 || bestD > 0.6) {
      // append if far from any segment
      store.state.wpts.push({
        _id: uid(),
        type: 'cruise',
        vhf: '16',
        lat: p.lat,
        lon: p.lon,
        name: 'נקודה ' + (store.state.wpts.length + 1),
        action: '',
        depth: '—',
      });
    } else {
      store.state.wpts.splice(best, 0, {
        _id: uid(),
        type: 'cruise',
        vhf: '16',
        lat: p.lat,
        lon: p.lon,
        name: 'נקודה',
        action: '',
        depth: '—',
      });
    }
    renderRoute(false);
  });

  $('btnExtend').onclick = (e) => {
    if (!store.state.extended) {
      store.state.wpts.push({ ...POLEG, _id: uid() });
      store.state.extended = true;
      e.currentTarget.classList.add('active');
      toast('הרחבה לפולג נוספה למסלול');
    } else {
      const i = store.state.wpts.findIndex((w) => w.type === 'ext');
      if (i >= 0) store.state.wpts.splice(i, 1);
      store.state.extended = false;
      e.currentTarget.classList.remove('active');
      toast('הרחבה הוסרה');
    }
    renderRoute(false);
  };

  $('btnNew').onclick = () => {
    store.state = { name: 'מסלול חדש', wpts: [], extended: false };
    renderRoute(false);
    setEdit(true);
    toast('מסלול ריק — לחץ על המפה להוספת נקודות');
  };

  $('btnReset').onclick = () => {
    store.state = {
      name: 'הרצליה · צפונה',
      wpts: JSON.parse(JSON.stringify(DEFAULT_WPTS)),
      extended: false,
    };
    store.state.wpts.forEach((w) => (w._id = uid()));
    $('btnExtend').classList.remove('active');
    renderRoute(true);
    map.flyToBounds(getRouteLine().getBounds().pad(0.4), { duration: 0.8 });
    toast('שוחזר מסלול ברירת המחדל');
  };
}
