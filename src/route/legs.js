/* Sidebar leg list + route stats + cruise-speed/ETA (L498–512). Subscribes to bus events. */

import { store, on, emit } from '../state/store.js';
import { TYPE } from '../state/defaults.js';
import { nm, brg, hm } from '../geo/geo.js';
import { legSOG, routeHours, hasEnv } from '../nav/estimate.js';
import { $ } from '../ui/dom.js';
import { focusWaypoint } from './route.js';

function buildLegs() {
  const legsEl = $('legs');
  legsEl.innerHTML = '';
  const spd = parseFloat($('spd').value) || 7;
  const { wind, current } = store.env;
  store.state.wpts.forEach((w, i) => {
    const t = TYPE[w.type] || TYPE.cruise;
    const nx = store.state.wpts[i + 1];
    let det = '';
    if (nx) {
      const d = nm(w, nx);
      const min = Math.round((d / legSOG(spd, brg(w, nx), wind, current)) * 60);
      det = `${Math.round(brg(w, nx))}° · ${d.toFixed(2)} NM · ~${min}ד׳`;
    } else if (i === store.state.wpts.length - 1) {
      det = 'נקודת היפוך / סוף';
    }
    const row = document.createElement('div');
    row.className = 'leg';
    row.innerHTML = `<div class="pin" style="background:${t.c}">${t.g || i + 1}</div><div class="txt"><div class="nm">${w.name}</div><div class="det">${det}</div></div><span class="vhf vhf${w.vhf}">VHF ${w.vhf}</span>`;
    row.onclick = () => {
      focusWaypoint(i);
      if (window.matchMedia('(max-width:760px)').matches) $('side').classList.remove('open');
    };
    legsEl.appendChild(row);
  });
}

function updateStats() {
  let oneWay = 0;
  for (let i = 0; i < store.state.wpts.length - 1; i++)
    oneWay += nm(store.state.wpts[i], store.state.wpts[i + 1]);
  store.oneWay = oneWay;
  $('stOne').innerHTML = oneWay.toFixed(1) + '<small> מייל</small>';
  $('stRound').innerHTML = (oneWay * 2).toFixed(1) + '<small> מייל</small>';
  updEta();
}

function updEta() {
  const s = parseFloat($('spd').value);
  $('spdVal').textContent = s + ' קשר';
  $('etaRound').textContent = hm((store.oneWay * 2) / s);

  // wind/current-aware round-trip estimate (M4) — shown only when there's live data
  const { wind, current } = store.env;
  const row = $('etaAdjRow');
  if (row) {
    if (hasEnv(wind, current) && store.state.wpts.length > 1) {
      const h = routeHours(store.state.wpts, s, wind, current, true);
      $('etaAdj').textContent = hm(h);
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }
  emit('stats:changed');
}

export function init() {
  on('route:changed', () => {
    buildLegs();
    updateStats();
  });
  on('legs:changed', buildLegs);
  // live wind/current arrived or changed → refresh ETA + per-leg minutes
  on('env:changed', () => {
    buildLegs();
    updEta();
  });
  $('spd').oninput = updEta;
}
