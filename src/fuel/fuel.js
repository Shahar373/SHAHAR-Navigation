/* Fuel calculator (L685–754). The arithmetic is extracted into a pure `computeFuel()`
 * (unit-tested); `updFuel()` reads the DOM, calls it, and renders. Behavior is unchanged. */

import { store, on } from '../state/store.js';
import { nm, hm } from '../geo/geo.js';
import { $ } from '../ui/dom.js';

const fuelMode = { cur: 'lph' },
  resMode = { cur: 'thirds' };

function spdApp() {
  return parseFloat($('spd').value) || 7;
}
function num(id, d) {
  const el = $(id);
  if (!el) return d;
  const v = parseFloat(el.value);
  return isFinite(v) ? v : d;
}
function fmtL(x) {
  if (!isFinite(x)) return '—';
  return (x < 10 ? x.toFixed(1) : Math.round(x)) + ' L';
}

/** Pure fuel computation. All inputs are plain numbers / strings already read from the UI. */
export function computeFuel({
  tank,
  now,
  condPct,
  mode,
  lph,
  spdLph,
  lnm,
  cruiseSpd,
  fuelType,
  hp,
  load,
  spdHp,
  reserveMode,
  resPct,
  resFix,
  D,
  pricePerL = 0,
}) {
  const cond = 1 + condPct / 100;
  let baseLph, Lnm;
  if (mode === 'lph') {
    baseLph = lph;
    Lnm = spdLph > 0 ? lph / spdLph : 0;
  } else if (mode === 'lnm') {
    Lnm = lnm;
    baseLph = lnm * cruiseSpd;
  } else {
    const per = fuelType === 'diesel' ? 0.21 : 0.38;
    baseLph = hp * (load / 100) * per;
    Lnm = spdHp > 0 ? baseLph / spdHp : 0;
  }
  const eLnm = Lnm * cond,
    eLph = baseLph * cond;
  const working = D * eLnm;
  let reserve;
  if (reserveMode === 'thirds') reserve = working / 2;
  else if (reserveMode === 'pct') reserve = (tank * resPct) / 100;
  else reserve = resFix;
  const required = working + reserve,
    surplus = now - required;
  const rangeNM = eLnm > 0 ? now / eLnm : 0,
    endur = eLph > 0 ? now / eLph : 0;
  const usable = Math.max(0, now - reserve),
    maxRound = eLnm > 0 ? usable / eLnm : 0,
    maxOut = maxRound / 2;
  const go = working > 0 && now >= required;
  const workingCost = working * pricePerL,
    requiredCost = required * pricePerL;
  return {
    eLnm,
    eLph,
    working,
    reserve,
    required,
    surplus,
    rangeNM,
    endur,
    maxOut,
    go,
    workingCost,
    requiredCost,
  };
}

function segBind(wrap, key, st, onpick) {
  document.querySelectorAll('#' + wrap + ' button').forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll('#' + wrap + ' button')
          .forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        st.cur = b.dataset[key];
        onpick(st.cur);
        updFuel();
      })
  );
}

function updFuel() {
  if (!$('fTank')) return;
  const tank = num('fTank', 60),
    now = num('fNow', 0),
    condPct = num('fCond', 0);
  $('condVal').textContent = '+' + condPct + '%';

  const {
    eLnm,
    eLph,
    working,
    reserve,
    required,
    surplus,
    rangeNM,
    endur,
    maxOut,
    go,
    requiredCost,
  } = computeFuel({
    tank,
    now,
    condPct,
    mode: fuelMode.cur,
    lph: num('fLph', 20),
    spdLph: num('fSpd', 7),
    lnm: num('fLnm', 1.2),
    cruiseSpd: spdApp(),
    fuelType: $('fFuel').value,
    hp: num('fHp', 150),
    load: num('fLoad', 60),
    spdHp: num('fSpd2', 18),
    reserveMode: resMode.cur,
    resPct: num('fResPct', 25),
    resFix: num('fResFix', 15),
    D: store.oneWay * 2,
    pricePerL: num('fPrice', 0),
  });

  // fuel bar
  const cl = (v) => Math.max(0, Math.min(100, v));
  const onP = cl((now / tank) * 100),
    reP = cl((reserve / tank) * 100),
    rqP = cl((required / tank) * 100);
  const fillC = go
    ? 'linear-gradient(90deg,#2e9e6b,#4bc983)'
    : 'linear-gradient(90deg,#c0392b,#ff5a5f)';
  $('fbar').innerHTML =
    `<div class="fill" style="width:${onP}%;background:${fillC}"></div>` +
    `<div class="reserve" style="width:${reP}%"></div>` +
    (required <= tank
      ? `<div class="reqline" style="left:${rqP}%"></div><div class="reqtag" style="left:${rqP}%">נדרש ${fmtL(required)}</div>`
      : `<div class="reqtag" style="left:96%;color:#ff5a5f">חורג מהטנק!</div>`);

  // verdict
  const v = $('fVerdict');
  if (working <= 0) {
    v.style.background = 'rgba(123,167,199,.12)';
    v.innerHTML = '<span class="ic">◐</span><span>אין מסלול — הוסף נקודות</span>';
  } else if (go) {
    v.style.background = 'rgba(75,201,131,.14)';
    v.innerHTML = `<span class="ic">✓</span><span>מספיק דלק — עודף ${fmtL(surplus)} מעל הרזרבה</span>`;
  } else if (required > tank) {
    v.style.background = 'rgba(255,90,95,.16)';
    v.innerHTML = `<span class="ic">✕</span><span>הטנק קטן מדי למסלול הזה (נדרש ${fmtL(required)} מתוך ${fmtL(tank)})</span>`;
  } else {
    v.style.background = 'rgba(255,90,95,.16)';
    v.innerHTML = `<span class="ic">✕</span><span>חסר דלק — תדלק עוד ${fmtL(-surplus)} לפני יציאה</span>`;
  }

  // results
  $('fRes').innerHTML =
    [
      ['דלק עבודה (הלוך-חזור)', fmtL(working), 'var(--amber)'],
      ['רזרבה', fmtL(reserve), 'var(--steel)'],
      ['נדרש ביציאה', fmtL(required), 'var(--text)'],
      ['יש בטנק', fmtL(now), 'var(--cyan)'],
      [
        surplus >= 0 ? 'עודף מעל הנדרש' : 'חוסר',
        fmtL(Math.abs(surplus)),
        surplus >= 0 ? 'var(--green)' : 'var(--red)',
      ],
      [
        'טווח על הדלק הנוכחי',
        isFinite(rangeNM) ? rangeNM.toFixed(1) + ' מייל' : '—',
        'var(--text)',
      ],
      ['שהייה (endurance)', isFinite(endur) ? hm(endur) : '—', 'var(--text)'],
      ['מרחק מרבי החוצה*', isFinite(maxOut) ? maxOut.toFixed(1) + ' מייל' : '—', 'var(--amber)'],
      ['עלות דלק נדרש', requiredCost > 0 ? '₪' + Math.round(requiredCost) : '—', 'var(--green)'],
    ]
      .map(
        (r) =>
          `<div class="item"><div class="v" style="color:${r[2]}">${r[1]}</div><div class="k">${r[0]}</div></div>`
      )
      .join('') +
    `<div class="item" style="grid-column:1/3"><div class="k">* המרחק שאפשר להתרחק מנקודת היציאה ועדיין לחזור עם הרזרבה (point of no return). צריכה אפקטיבית: ${eLnm.toFixed(2)} L/מייל · ${eLph.toFixed(1)} L/h.</div></div>`;

  // per-leg breakdown (outbound legs; "remaining if you turn back here")
  let rows = '',
    cumOut = 0,
    lastSafe = -1;
  for (let i = 0; i < store.state.wpts.length - 1; i++) {
    const leg = nm(store.state.wpts[i], store.state.wpts[i + 1]);
    const fl = leg * eLnm;
    cumOut += fl;
    const usedIfTurn = 2 * cumOut,
      remain = now - usedIfTurn,
      ok = remain >= reserve;
    if (ok) lastSafe = i;
    rows += `<tr data-i="${i}" class="${ok ? '' : 'warn'}"><td>→ ${store.state.wpts[i + 1].name.split('—')[0].trim().slice(0, 16)}</td><td>${leg.toFixed(2)}</td><td>${fl.toFixed(1)}</td><td>${usedIfTurn.toFixed(1)}</td><td>${remain.toFixed(1)}</td></tr>`;
  }
  const tbl =
    `<table class="ftable"><thead><tr><th>עד נקודה</th><th>מייל</th><th>דלק רגל</th><th>נצרך הו״ח</th><th>יישאר</th></tr></thead><tbody>${rows}</tbody></table>` +
    (lastSafe >= 0
      ? `<div class="hint">הנקודה הרחוקה ביותר שאפשר להגיע אליה ולחזור עם הרזרבה: <b style="color:var(--amber)">${store.state.wpts[lastSafe + 1].name.split('—')[0].trim()}</b>.</div>`
      : `<div class="hint" style="color:var(--red)">הדלק לא מספיק אפילו לרגל הראשונה עם רזרבה.</div>`);
  $('fLegTable').innerHTML = tbl;
  const lsRow = document.querySelector(`.ftable tr[data-i="${lastSafe}"]`);
  if (lsRow) lsRow.classList.add('last-safe');
}

export function init() {
  segBind('fuelMode', 'm', fuelMode, (m) => {
    $('modeLph').style.display = m === 'lph' ? '' : 'none';
    $('modeLnm').style.display = m === 'lnm' ? '' : 'none';
    $('modeHp').style.display = m === 'hp' ? '' : 'none';
  });
  segBind('resMode', 'r', resMode, (r) => {
    $('resExtra').style.display = r === 'thirds' ? 'none' : '';
    $('resPctWrap').style.display = r === 'pct' ? '' : 'none';
    $('resFixWrap').style.display = r === 'fix' ? '' : 'none';
  });
  [
    'fTank',
    'fNow',
    'fLph',
    'fSpd',
    'fLnm',
    'fFuel',
    'fHp',
    'fLoad',
    'fSpd2',
    'fResPct',
    'fResFix',
    'fCond',
    'fPrice',
  ].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener('input', updFuel);
  });
  $('fLegBtn').onclick = () => {
    const t = $('fLegTable');
    const open = t.style.display !== 'none';
    t.style.display = open ? 'none' : '';
    $('fLegBtn').textContent = 'פירוט דלק לפי רגל ' + (open ? '▾' : '▴');
  };
  on('stats:changed', updFuel);
}
