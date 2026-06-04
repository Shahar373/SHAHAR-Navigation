/* Settings (M5): theme (dark / sun-daylight / night) and remembered form defaults — the
 * cruise speed, fuel setup and ₪/litre now survive a reload. Values are restored before the
 * first render so the modules read them straight away. Pure storage lives in settings-store.js. */

import { $ } from './dom.js';
import { loadSettings, patchSettings } from './settings-store.js';

// inputs whose values we remember (the "my boat" setup + cruise speed)
const FIELDS = [
  'spd',
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
];

let theme = 'dark';
export const getTheme = () => theme;

export function setTheme(t) {
  theme = t;
  document.body.classList.remove('night', 'sun');
  if (t === 'night' || t === 'sun') document.body.classList.add(t);
  document
    .querySelectorAll('#themeSeg button')
    .forEach((b) => b.classList.toggle('active', b.dataset.theme === t));
  const nb = $('btnNight');
  if (nb) nb.classList.toggle('active', t === 'night');
  patchSettings({ theme: t });
}

/** Toolbar moon button: flip between night and the previous light theme. */
export function toggleNight() {
  setTheme(theme === 'night' ? 'dark' : 'night');
}

function persist(id) {
  const el = $(id);
  if (!el) return;
  const s = loadSettings();
  patchSettings({ fields: { ...(s.fields || {}), [id]: el.value } });
}

export function init() {
  const saved = loadSettings();
  const f = saved.fields || {};
  FIELDS.forEach((id) => {
    const el = $(id);
    if (el && f[id] != null && f[id] !== '') el.value = f[id];
    if (el) el.addEventListener('input', () => persist(id));
  });

  setTheme(saved.theme || 'dark');
  document
    .querySelectorAll('#themeSeg button')
    .forEach((b) => (b.onclick = () => setTheme(b.dataset.theme)));

  const reset = $('btnResetSettings');
  if (reset)
    reset.onclick = () => {
      if (!confirm('לאפס את כל ההגדרות וברירות המחדל?')) return;
      try {
        localStorage.removeItem('mnp.settings');
      } catch {
        /* ignore */
      }
      location.reload();
    };
}
