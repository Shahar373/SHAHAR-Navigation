/* Live waves & currents field from the Open-Meteo Marine API (multi-point, single request),
 * drawn on the map with a legend (L522–561). M1: caches the last field and falls back to it offline. */

import L from 'leaflet';
import { map } from '../map/map.js';
import { store, emit } from '../state/store.js';
import { bindTog, $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { saveForecast, loadForecast, formatAge } from './forecast-cache.js';

// Vector-average the field's currents into one representative value for the wind/current
// ETA (M4). cd is the "toward" direction, matching src/nav/estimate.js.
function publishCurrent(field) {
  let sx = 0,
    sy = 0,
    n = 0;
  (field || []).forEach((p) => {
    if (p.cv == null || p.cd == null) return;
    sx += p.cv * Math.cos((p.cd * Math.PI) / 180);
    sy += p.cv * Math.sin((p.cd * Math.PI) / 180);
    n++;
  });
  if (!n) return;
  const spd = Math.hypot(sx, sy) / n;
  const dir = ((((Math.atan2(sy, sx) * 180) / Math.PI) % 360) + 360) % 360;
  store.env.current = { spd, dir };
  emit('env:changed');
}

const waveLayer = L.layerGroup(),
  currLayer = L.layerGroup();
let fieldData = null,
  fieldBusy = false,
  fieldCachedAt = null;

function gridPoints() {
  const pts = [];
  for (let la = 32.14; la <= 32.3; la += 0.032)
    for (let lo = 34.7; lo <= 34.8; lo += 0.025) pts.push([+la.toFixed(3), +lo.toFixed(3)]);
  return pts;
}

async function fetchField() {
  if (fieldData || fieldBusy) return fieldData;
  fieldBusy = true;
  const pts = gridPoints();
  const lats = pts.map((p) => p[0]).join(','),
    lons = pts.map((p) => p[1]).join(',');
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&hourly=wave_height,wave_direction,ocean_current_velocity,ocean_current_direction&forecast_days=1&cell_selection=sea`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const arr = Array.isArray(j) ? j : [j];
    const now = new Date();
    const parsed = [];
    arr.forEach((o) => {
      if (!o.hourly || !o.hourly.time) return;
      let k = o.hourly.time.findIndex((t) => new Date(t) >= now);
      if (k < 0) k = 0;
      if (k > 0) k--;
      const wh = o.hourly.wave_height?.[k],
        wd = o.hourly.wave_direction?.[k],
        cv = o.hourly.ocean_current_velocity?.[k],
        cd = o.hourly.ocean_current_direction?.[k];
      parsed.push({ lat: o.latitude, lon: o.longitude, wh, wd, cv, cd });
    });
    fieldData = parsed;
    fieldCachedAt = null;
    saveForecast('marine', fieldData);
    publishCurrent(fieldData);
  } catch {
    const cached = loadForecast('marine');
    if (cached) {
      fieldData = cached.data;
      fieldCachedAt = cached.at;
      publishCurrent(fieldData);
      toast('שדה ים: נתונים שמורים · נכון ל' + formatAge(cached.at));
    } else {
      toast('שדה ים לא זמין כעת');
      fieldData = null;
    }
  }
  fieldBusy = false;
  return fieldData;
}

function waveColor(h) {
  return h < 0.3
    ? '#3fa7ff'
    : h < 0.6
      ? '#4bc983'
      : h < 1.0
        ? '#ffd84d'
        : h < 1.5
          ? '#ff8c42'
          : '#ff5a5f';
}
function curColor(v) {
  return v < 0.1 ? '#7aa7c7' : v < 0.25 ? '#41d3cb' : v < 0.5 ? '#ffd84d' : '#ff8c42';
}

async function loadField(kind) {
  const d = await fetchField();
  if (!d) {
    $(kind === 'waves' ? 'tgWaves' : 'tgCurr').checked = false;
    return;
  }
  if (kind === 'waves') {
    waveLayer.clearLayers();
    d.forEach((p) => {
      if (p.wh == null) return;
      const c = waveColor(p.wh);
      L.circleMarker([p.lat, p.lon], {
        radius: 6 + p.wh * 7,
        color: c,
        weight: 1,
        fillColor: c,
        fillOpacity: 0.35,
      })
        .bindTooltip(`גלים ${p.wh.toFixed(2)} מ׳`, { direction: 'top' })
        .addTo(waveLayer);
    });
    waveLayer.addTo(map);
    showLegend('waves');
  } else {
    currLayer.clearLayers();
    d.forEach((p) => {
      if (p.cv == null) return;
      const c = curColor(p.cv);
      const len = 10 + Math.min(1, p.cv * 2) * 14;
      const ic = L.divIcon({
        className: '',
        html: `<div style="transform:rotate(${p.cd || 0}deg);transform-origin:center"><svg width="${len}" height="${len}" viewBox="0 0 24 24"><path d="M12 21 L12 4 M12 4 L7 10 M12 4 L17 10" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg></div>`,
        iconSize: [len, len],
        iconAnchor: [len / 2, len / 2],
      });
      L.marker([p.lat, p.lon], { icon: ic })
        .bindTooltip(`זרם ${p.cv.toFixed(2)} מ׳/ש׳`, { direction: 'top' })
        .addTo(currLayer);
    });
    currLayer.addTo(map);
    showLegend('curr');
  }
}

function showLegend() {
  const w = $('tgWaves').checked,
    c = $('tgCurr').checked;
  const legend = $('legend');
  if (!w && !c) {
    legend.classList.remove('on');
    return;
  }
  legend.classList.add('on');
  let html = '',
    title = '';
  if (w) {
    title = 'גובה גלים (מ׳)';
    [
      ['#3fa7ff', '<0.3 רגוע'],
      ['#4bc983', '0.3–0.6'],
      ['#ffd84d', '0.6–1.0'],
      ['#ff8c42', '1.0–1.5'],
      ['#ff5a5f', '>1.5'],
    ].forEach(
      (x) =>
        (html += `<div class="li"><span class="sw" style="background:${x[0]}"></span>${x[1]}</div>`)
    );
  }
  if (c) {
    title = w ? 'גלים + זרמים' : 'מהירות זרם (מ׳/ש׳)';
    if (w) html += '<div class="li" style="margin-top:6px;color:var(--soft)">זרם →</div>';
    [
      ['#7aa7c7', '<0.1'],
      ['#41d3cb', '0.1–0.25'],
      ['#ffd84d', '0.25–0.5'],
      ['#ff8c42', '>0.5'],
    ].forEach(
      (x) =>
        (html += `<div class="li"><span class="sw" style="background:${x[0]}"></span>${x[1]}</div>`)
    );
  }
  if (fieldCachedAt) {
    html += `<div class="li" style="margin-top:6px;color:var(--amber)">נכון ל${formatAge(fieldCachedAt)}</div>`;
  }
  $('legTitle').textContent = title;
  $('legItems').innerHTML = html;
}

export function init() {
  bindTog(
    'tgWaves',
    () => loadField('waves'),
    () => waveLayer.remove()
  );
  bindTog(
    'tgCurr',
    () => loadField('curr'),
    () => currLayer.remove()
  );
  $('tgWaves').addEventListener('change', () => showLegend());
  $('tgCurr').addEventListener('change', () => showLegend());
}
