/* Marina wind widget (Open-Meteo forecast) + go/no-go verdict + SW-storm warning (L671–682).
 * M1: caches the last result and falls back to it (with an "as of" stamp) when offline. */

import { $ } from '../ui/dom.js';
import { store, emit } from '../state/store.js';
import { saveForecast, loadForecast, formatAge } from './forecast-cache.js';

const dirs = [
  'צפונית',
  'צ-מזרחית',
  'מזרחית',
  'ד-מזרחית',
  'דרומית',
  'ד-מערבית',
  'מערבית',
  'צ-מערבית',
];

function renderWind(w, atTs) {
  // publish to shared env for the wind-aware ETA (M4)
  store.env.wind = { spd: w.wind_speed_10m, dir: w.wind_direction_10m };
  emit('env:changed');
  const dn = dirs[Math.round(w.wind_direction_10m / 45) % 8];
  $('windSpd').innerHTML = w.wind_speed_10m.toFixed(1) + '<small> מ׳/ש׳</small>';
  const age = atTs ? ' · נכון ל' + formatAge(atTs) : '';
  $('windMeta').textContent = 'מ' + dn + ' · משבים ' + w.wind_gusts_10m.toFixed(0) + ' מ׳/ש׳' + age;
  $('windArrow').style.transform = 'rotate(' + (w.wind_direction_10m + 180) + 'deg)';
  const sw = w.wind_direction_10m >= 200 && w.wind_direction_10m <= 250,
    s = w.wind_speed_10m;
  let cls, txt, ic;
  if (s < 4) {
    cls = 'v-calm';
    txt = 'ים רגוע — חלון מצוין למתחיל';
    ic = '✓';
  } else if (s < 7) {
    cls = 'v-ok';
    txt = 'נוח — מתאים ליציאה זהירה';
    ic = '◐';
  } else if (s < 10) {
    cls = 'v-care';
    txt = 'ערני — לשקול, במיוחד למתחיל';
    ic = '!';
  } else {
    cls = 'v-no';
    txt = 'חזק — לא מומלץ למשיט 30 מתחיל';
    ic = '✕';
  }
  if (sw && s >= 5) {
    cls = 'v-care';
    txt = 'רוח דרום-מערבית — סימן אזהרה לסערה';
    ic = '!';
  }
  $('verdict').className = 'verdict ' + cls;
  $('vText').textContent = txt;
  $('vIcon').textContent = ic;
}

export async function init() {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=32.163&longitude=34.796&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=ms',
      { signal: ctrl.signal }
    );
    clearTimeout(to);
    const j = await r.json();
    renderWind(j.current);
    saveForecast('wind', j.current);
  } catch {
    clearTimeout(to);
    const cached = loadForecast('wind');
    if (cached) {
      renderWind(cached.data, cached.at);
    } else {
      $('windSpd').innerHTML = '—';
      $('windMeta').textContent = 'נתוני רוח לא זמינים';
      $('vText').textContent = 'בדוק תחזית ים לפני יציאה';
    }
  }
}
