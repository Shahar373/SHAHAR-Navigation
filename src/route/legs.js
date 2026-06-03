/* Sidebar leg list + route stats + cruise-speed/ETA (L498–512). Subscribes to bus events. */

import { store, on, emit } from '../state/store.js';
import { TYPE } from '../state/defaults.js';
import { nm, brg, hm } from '../geo/geo.js';
import { $ } from '../ui/dom.js';
import { focusWaypoint } from './route.js';

function buildLegs() {
  const legsEl = $('legs');
  legsEl.innerHTML = '';
  store.state.wpts.forEach((w, i) => {
    const t = TYPE[w.type] || TYPE.cruise;
    const nx = store.state.wpts[i + 1];
    const det = nx
      ? `${Math.round(brg(w, nx))}° · ${nm(w, nx).toFixed(2)} NM`
      : i === store.state.wpts.length - 1
        ? 'נקודת היפוך / סוף'
        : '';
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
  emit('stats:changed');
}

export function init() {
  on('route:changed', () => {
    buildLegs();
    updateStats();
  });
  on('legs:changed', buildLegs);
  $('spd').oninput = updEta;
}
