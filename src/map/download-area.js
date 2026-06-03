/* "Download this area" — offline raster coverage (M1b). Pre-fetches Esri satellite +
 * OpenSeaMap seamark tiles for a bbox/zoom range so the service worker (CacheFirst,
 * see vite.config.js) stores them for use at sea with no signal. OSM is intentionally
 * never bulk-fetched here (CLAUDE.md hard constraint #6).
 *
 * In this build the actual tile hosts may be unreachable (sandbox/offline); fetches are
 * best-effort and failures never crash the flow — on a real device/online they populate
 * the cache. A record of downloaded areas is kept in localStorage for the UI. */

import { map } from './map.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { tilesForBbox, esriTileUrl, seamarkTileUrl, CENTRAL_COAST } from './tiles.js';

const AREAS_KEY = 'mnp.offlineAreas';
const CONCURRENCY = 6;
const CONFIRM_OVER = 1500; // ask before very large downloads

let aborter = null;

function loadAreas() {
  try {
    return JSON.parse(localStorage.getItem(AREAS_KEY)) || [];
  } catch {
    return [];
  }
}
function saveAreas(list) {
  try {
    localStorage.setItem(AREAS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Build the {url} job list for a tile set across both allowed layers. */
function jobsFor(tiles, withSeamark) {
  const jobs = tiles.map((t) => esriTileUrl(t));
  if (withSeamark) tiles.forEach((t) => jobs.push(seamarkTileUrl(t)));
  return jobs;
}

async function runPool(urls, onProgress, signal) {
  let i = 0,
    done = 0;
  async function worker() {
    while (i < urls.length && !signal.aborted) {
      const url = urls[i++];
      try {
        await fetch(url, { mode: 'no-cors', signal });
      } catch {
        /* best-effort: offline / blocked tiles are skipped */
      }
      onProgress(++done, urls.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return done;
}

function setBusy(busy) {
  $('dlProgress').style.display = busy ? 'block' : 'none';
  $('btnDlView').disabled = busy;
  $('btnDlCoast').disabled = busy;
}

function progress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('dlBar').style.width = pct + '%';
  $('dlText').textContent = `מוריד… ${done}/${total} (${pct}%)`;
}

async function download(name, bbox, zmin, zmax) {
  if (aborter) return;
  const tiles = tilesForBbox(bbox, zmin, zmax);
  const urls = jobsFor(tiles, true);
  if (urls.length > CONFIRM_OVER && !confirm(`הורדה של ${urls.length} אריחים — להמשיך?`)) return;

  aborter = new AbortController();
  setBusy(true);
  progress(0, urls.length);
  const done = await runPool(urls, progress, aborter.signal);
  const aborted = aborter.signal.aborted;
  aborter = null;
  setBusy(false);

  if (aborted) {
    toast('ההורדה בוטלה');
  } else {
    const areas = loadAreas();
    areas.unshift({
      id: 'a' + Date.now().toString(36),
      name,
      bbox,
      zmin,
      zmax,
      tiles: tiles.length,
      at: Date.now(),
    });
    saveAreas(areas);
    renderAreas();
    toast(`האזור נשמר למצב לא־מקוון ✓ (${done} אריחים)`);
  }
}

function downloadCurrentView() {
  const b = map.getBounds();
  const z = Math.round(map.getZoom());
  const zmin = Math.max(8, z - 1);
  const zmax = Math.min(17, z + 2);
  download(
    'תצוגה נוכחית',
    { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() },
    zmin,
    zmax
  );
}

function renderAreas() {
  const wrap = $('dlAreas');
  const areas = loadAreas();
  $('dlEmpty').style.display = areas.length ? 'none' : 'block';
  wrap.innerHTML = '';
  areas.forEach((a) => {
    const row = document.createElement('div');
    row.className = 'dl-area';
    const txt = document.createElement('div');
    txt.className = 'dl-area-txt';
    txt.textContent = `${a.name} · z${a.zmin}–${a.zmax} · ${a.tiles} אריחים`;
    const del = document.createElement('button');
    del.className = 'rt-act del';
    del.title = 'הסר מהרשימה';
    del.textContent = '🗑';
    del.onclick = () => {
      saveAreas(loadAreas().filter((x) => x.id !== a.id));
      renderAreas();
    };
    row.append(txt, del);
    wrap.appendChild(row);
  });
}

export function init() {
  $('btnDlView').onclick = downloadCurrentView;
  $('btnDlCoast').onclick = () => download('חוף מרכז הארץ', CENTRAL_COAST, 10, 14);
  $('btnDlCancel').onclick = () => aborter && aborter.abort();
  renderAreas();
}
