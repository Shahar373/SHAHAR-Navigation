/* Live track recording (M4): record the GPS track you actually sail, show it on the map,
 * and save it to the "הקלטות" list (IndexedDB) with GPX export. Foreground mode — runs while
 * the app is open with the screen kept awake (via the shared position service). */

import L from 'leaflet';
import { map } from '../map/map.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { subscribe } from '../nav/position.js';
import { saveTextFile } from '../platform/files.js';
import { nm } from '../geo/geo.js';
import { trackStats, toTrackGpx, fmtDur } from './track.js';
import { putTrack, getAllTracks, deleteTrack } from './tracks-db.js';

const MS_TO_KT = 1.94384;

let recording = false;
let points = [];
let unsub = null;
let line = null; // live recording polyline
let viewer = null; // saved-track viewer polyline
let timer = null;

function liveSOG(p) {
  if (p && p.coords && p.coords.speed != null && isFinite(p.coords.speed) && p.coords.speed >= 0)
    return p.coords.speed * MS_TO_KT;
  if (points.length >= 2) {
    const a = points[points.length - 2],
      b = points[points.length - 1];
    const dt = (b.t - a.t) / 3_600_000;
    if (dt > 0) return nm(a, b) / dt;
  }
  return 0;
}

function updateHud(p) {
  const s = trackStats(points);
  $('recDist').textContent = s.distNM.toFixed(2) + ' NM';
  $('recTime').textContent = fmtDur(s.durMs);
  $('recSog').textContent = (p ? liveSOG(p) : 0).toFixed(1) + ' kt';
}

function onPos(p) {
  points.push({ lat: p.coords.latitude, lon: p.coords.longitude, t: Date.now() });
  if (!line)
    line = L.polyline([], {
      color: '#ff5a5f',
      weight: 3,
      opacity: 0.9,
      dashArray: '1,6',
      lineCap: 'round',
    }).addTo(map);
  line.addLatLng([points[points.length - 1].lat, points[points.length - 1].lon]);
  updateHud(p);
}

function start() {
  recording = true;
  points = [];
  if (line) {
    line.remove();
    line = null;
  }
  $('btnRec').classList.add('active');
  $('btnRec').textContent = '■ עצור הקלטה';
  $('recHud').classList.add('on');
  updateHud(null);
  unsub = subscribe(onPos, () => toast('מיקום זמנית לא זמין — ההקלטה תמשיך כשיחזור'));
  timer = setInterval(() => updateHud(null), 1000); // tick the clock between fixes
  toast('הקלטה החלה — המסך יישאר דלוק');
}

async function stop() {
  recording = false;
  if (unsub) unsub();
  unsub = null;
  clearInterval(timer);
  timer = null;
  $('btnRec').classList.remove('active');
  $('btnRec').textContent = '● התחל הקלטה';
  $('recHud').classList.remove('on');
  if (line) {
    line.remove();
    line = null;
  }
  if (points.length < 2) {
    toast('הקלטה קצרה מדי — לא נשמרה');
    return;
  }
  const s = trackStats(points);
  const def =
    'מסלול ' +
    new Date().toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  const name = (prompt('שם להקלטה:', def) || def).trim();
  const rec = {
    id: 'tk_' + Date.now().toString(36),
    name,
    points: points.slice(),
    distanceNM: s.distNM,
    durMs: s.durMs,
    createdAt: Date.now(),
  };
  try {
    await putTrack(rec);
    toast(`נשמרה הקלטה · ${s.distNM.toFixed(2)} NM · ${fmtDur(s.durMs)}`);
    renderList();
  } catch {
    toast('שמירת ההקלטה נכשלה');
  }
}

function viewTrack(rec) {
  if (viewer) viewer.remove();
  viewer = L.polyline(
    rec.points.map((p) => [p.lat, p.lon]),
    { color: '#ff5a5f', weight: 3, opacity: 0.9 }
  ).addTo(map);
  if (rec.points.length) map.fitBounds(viewer.getBounds().pad(0.3));
  toast('מציג: ' + rec.name);
  if (window.matchMedia('(max-width:760px)').matches) $('side').classList.remove('open');
}

async function exportTrack(rec) {
  const r = await saveTextFile(
    rec.name.replace(/\s+/g, '_') + '.gpx',
    toTrackGpx(rec.name, rec.points),
    'application/gpx+xml'
  );
  if (r.native) toast('נשמר: ' + r.path);
}

function renderList() {
  getAllTracks()
    .then((list) => {
      const wrap = $('trkList');
      wrap.innerHTML = '';
      $('trkEmpty').style.display = list.length ? 'none' : 'block';
      list.forEach((rec) => {
        const el = document.createElement('div');
        el.className = 'rt-item';
        const main = document.createElement('div');
        main.className = 'rt-main';
        main.onclick = () => viewTrack(rec);
        const name = document.createElement('div');
        name.className = 'rt-name';
        name.textContent = rec.name;
        const meta = document.createElement('div');
        meta.className = 'rt-meta';
        meta.textContent = `${rec.distanceNM.toFixed(2)} NM · ${fmtDur(rec.durMs)} · ${rec.points.length} נק׳`;
        main.append(name, meta);
        const acts = document.createElement('div');
        acts.className = 'rt-actions';
        const ex = document.createElement('button');
        ex.className = 'rt-act';
        ex.title = 'ייצוא GPX';
        ex.textContent = '↧';
        ex.onclick = (e) => {
          e.stopPropagation();
          exportTrack(rec);
        };
        const del = document.createElement('button');
        del.className = 'rt-act del';
        del.title = 'מחק';
        del.textContent = '🗑';
        del.onclick = (e) => {
          e.stopPropagation();
          if (confirm('למחוק את "' + rec.name + '"?')) deleteTrack(rec.id).then(renderList);
        };
        acts.append(ex, del);
        el.append(main, acts);
        wrap.appendChild(el);
      });
    })
    .catch(() => toast('טעינת ההקלטות נכשלה'));
}

export function init() {
  if (!$('btnRec')) return;
  $('btnRec').onclick = () => (recording ? stop() : start());
  $('btnRecStop').onclick = () => stop();
  renderList();
}
