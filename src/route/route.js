/* Route rendering: glow/route polylines, typed waypoint markers, view/edit popups,
 * reference markers, line draw animation (L442–495). Emits bus events instead of
 * calling buildLegs/updateStats directly, to keep the import graph acyclic. */

import L from 'leaflet';
import { map } from '../map/map.js';
import { store, uid, emit } from '../state/store.js';
import { TYPE, REFS } from '../state/defaults.js';
import { nm, brg, dm } from '../geo/geo.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';

let glowLine = null,
  routeLine = null,
  routeMarkers = [],
  refMarkers = [];

/** The current route polyline (used by fit-to-bounds callers). */
export const getRouteLine = () => routeLine;

function wpIcon(w, idx) {
  const t = TYPE[w.type] || TYPE.cruise;
  const g = t.g || (idx != null ? idx + 1 : '');
  const pulse = w.type === 'start' ? `<span class="pulse" style="color:${t.c}"></span>` : '';
  return L.divIcon({
    className: '',
    html: `<div class="wp ${w.type}">${pulse}<div class="ring" style="background:${t.c}">${g}</div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function viewPopup(w, idx) {
  const t = TYPE[w.type] || TYPE.cruise;
  const nx = store.state.wpts[idx + 1];
  let extra = '';
  if (nx) {
    extra = `<span class="g"><b>→ הבא</b>${Math.round(brg(w, nx))}° · ${nm(w, nx).toFixed(2)}NM</span>`;
  }
  return `<div class="pop" data-id="${w._id}"><div class="ph"><div class="badge" style="background:${t.c}">${t.g || idx + 1}</div><h3>${w.name}</h3></div><div class="act">${w.action || ''}</div><div class="grid"><span class="g"><b>VHF</b>${w.vhf}</span><span class="g">${dm(w.lat, w.lon)}</span><span class="g"><b>עומק</b>${w.depth || '—'}</span>${extra}</div></div>`;
}

function editPopup(w) {
  const opts = Object.keys(TYPE)
    .map((k) => `<option value="${k}" ${k === w.type ? 'selected' : ''}>${TYPE[k].l}</option>`)
    .join('');
  return `<div class="pop" data-id="${w._id}"><h3 style="margin-bottom:5px">עריכת נקודה</h3>
   <input class="e-name" value="${(w.name || '').replace(/"/g, '&quot;')}" placeholder="שם">
   <input class="e-act" value="${(w.action || '').replace(/"/g, '&quot;')}" placeholder="פעולה/הערה">
   <div style="display:flex;gap:6px"><select class="e-type">${opts}</select>
   <select class="e-vhf"><option ${w.vhf === '16' ? 'selected' : ''}>16</option><option ${w.vhf === '11' ? 'selected' : ''}>11</option></select></div>
   <div class="grid" style="margin-top:6px"><span class="g">${dm(w.lat, w.lon)}</span></div>
   <div class="erow"><button class="ebtn ins">＋ הוסף אחרי</button><button class="ebtn del">🗑 מחק</button></div></div>`;
}

function clearRoute() {
  if (glowLine) glowLine.remove();
  if (routeLine) routeLine.remove();
  routeMarkers.forEach((m) => m.remove());
  routeMarkers = [];
}

function animateLine(poly) {
  const el = poly.getElement();
  if (!el || !el.getTotalLength) return;
  const len = el.getTotalLength();
  el.style.transition = 'none';
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = len;
  el.getBoundingClientRect();
  el.style.transition = 'stroke-dashoffset 1.4s ease';
  el.style.strokeDashoffset = 0;
  setTimeout(() => {
    el.style.strokeDasharray = '';
    el.style.transition = '';
  }, 1600);
}

export function renderRoute(animate) {
  clearRoute();
  const ll = store.state.wpts.map((w) => [w.lat, w.lon]);
  glowLine = L.polyline(ll, { color: '#41d3cb', weight: 9, opacity: 0.16, lineCap: 'round' }).addTo(
    map
  );
  routeLine = L.polyline(ll, {
    color: '#ffb84d',
    weight: 3.4,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);
  store.state.wpts.forEach((w, idx) => {
    const m = L.marker([w.lat, w.lon], {
      icon: wpIcon(w, idx),
      draggable: store.editMode,
    }).addTo(map);
    m._id = w._id;
    m.bindPopup(() => (store.editMode ? editPopup(w) : viewPopup(w, idx)));
    if (store.editMode) {
      m.dragging && m.dragging.enable();
      m.on('dragend', (e) => {
        const p = e.target.getLatLng();
        w.lat = p.lat;
        w.lon = p.lng;
        renderRoute(false);
      });
    }
    routeMarkers.push(m);
  });
  if (animate) setTimeout(() => animateLine(routeLine), 120);
  emit('route:changed');
  $('routeName').textContent = store.state.name;
  $('wpCount').textContent = store.state.wpts.length + ' נק׳';
}

/** Fly to a waypoint and open its popup (used by the sidebar leg list). */
export function focusWaypoint(i) {
  const w = store.state.wpts[i];
  if (!w) return;
  map.flyTo([w.lat, w.lon], 15, { duration: 0.7 });
  setTimeout(() => routeMarkers[i] && routeMarkers[i].openPopup(), 600);
}

/** Static reference markers (hazards, reserves) (L493–495). */
export function renderRefs() {
  refMarkers.forEach((m) => m.remove());
  refMarkers = [];
  REFS.forEach((r) => {
    const m = L.marker([r.lat, r.lon], { icon: wpIcon(r, null) }).addTo(map);
    m.bindPopup(
      `<div class="pop"><div class="ph"><div class="badge" style="background:${TYPE[r.type].c}">${TYPE[r.type].g}</div><h3>${r.name}</h3></div><div class="act">${r.action}</div></div>`
    );
    refMarkers.push(m);
  });
}

export function init() {
  map.on('popupopen', (ev) => {
    const el = ev.popup.getElement();
    if (!el) return;
    const pop = el.querySelector('.pop');
    if (!pop) return;
    const id = pop.getAttribute('data-id');
    const idx = store.state.wpts.findIndex((x) => x._id === id);
    if (idx < 0) return;
    const w = store.state.wpts[idx];
    const nameI = pop.querySelector('.e-name'),
      actI = pop.querySelector('.e-act'),
      typeI = pop.querySelector('.e-type'),
      vhfI = pop.querySelector('.e-vhf');
    if (nameI)
      nameI.oninput = () => {
        w.name = nameI.value;
        emit('legs:changed');
      };
    if (actI) actI.oninput = () => (w.action = actI.value);
    if (typeI)
      typeI.onchange = () => {
        w.type = typeI.value;
        routeMarkers[idx] && routeMarkers[idx].setIcon(wpIcon(w, idx));
        emit('legs:changed');
      };
    if (vhfI)
      vhfI.onchange = () => {
        w.vhf = vhfI.value;
        emit('legs:changed');
      };
    const del = pop.querySelector('.del'),
      ins = pop.querySelector('.ins');
    if (del)
      del.onclick = () => {
        map.closePopup();
        store.state.wpts.splice(idx, 1);
        renderRoute(false);
        toast('נקודה נמחקה');
      };
    if (ins)
      ins.onclick = () => {
        map.closePopup();
        const a = store.state.wpts[idx],
          b = store.state.wpts[idx + 1];
        const nlat = b ? (a.lat + b.lat) / 2 : a.lat + 0.01,
          nlon = b ? (a.lon + b.lon) / 2 : a.lon - 0.005;
        store.state.wpts.splice(idx + 1, 0, {
          _id: uid(),
          type: 'cruise',
          vhf: '16',
          lat: nlat,
          lon: nlon,
          name: 'נקודה חדשה',
          action: '',
          depth: '—',
        });
        renderRoute(false);
        toast('נקודה נוספה');
      };
  });
}
