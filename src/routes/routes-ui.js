/* Saved-routes library UI (M2): the "המסלולים שלי" drawer + working-draft autosave.
 *
 * Save model (chosen with the user): manual save of named routes into the IndexedDB
 * library, plus automatic restore of the in-progress working route via the draft.
 * Per-route list row shows name · one-way distance (NM) · last-updated date. */

import { store, uid, on } from '../state/store.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { loadRoute } from '../route/route.js';
import { putRoute, getAllRoutes, deleteRoute } from './routes-db.js';
import { toRecord, recordToState, formatDate } from './route-record.js';
import { saveDraft, loadDraft } from './draft.js';

const isMobile = () => window.matchMedia('(max-width:760px)').matches;

function openDrawer() {
  $('routesDrawer').classList.add('open');
  renderList();
  if (isMobile()) $('side').classList.remove('open');
}
function closeDrawer() {
  $('routesDrawer').classList.remove('open');
}

/** Snapshot the current working route into the library as a new named entry. */
function saveCurrent() {
  if (!store.state.wpts.length) {
    toast('אין נקודות לשמירה');
    return;
  }
  const name = (prompt('שם למסלול:', store.state.name) || '').trim();
  if (!name) return;
  putRoute(toRecord({ ...store.state, name }))
    .then(() => {
      toast('המסלול נשמר ✓');
      renderList();
    })
    .catch(() => toast('שמירה נכשלה'));
}

function loadInto(rec) {
  loadRoute(recordToState(rec));
  toast('נטען: ' + rec.name);
  closeDrawer();
}

function renameRec(rec) {
  const name = (prompt('שם חדש:', rec.name) || '').trim();
  if (!name || name === rec.name) return;
  putRoute({ ...rec, name, updatedAt: Date.now() })
    .then(renderList)
    .catch(() => toast('שינוי השם נכשל'));
}

function duplicateRec(rec) {
  putRoute(toRecord({ ...recordToState(rec), name: rec.name + ' (עותק)' }))
    .then(() => {
      toast('שוכפל ✓');
      renderList();
    })
    .catch(() => toast('שכפול נכשל'));
}

function deleteRec(rec) {
  if (!confirm('למחוק את "' + rec.name + '"?')) return;
  deleteRoute(rec.id)
    .then(() => {
      toast('נמחק');
      renderList();
    })
    .catch(() => toast('מחיקה נכשלה'));
}

function actionBtn(label, title, cls, fn) {
  const b = document.createElement('button');
  b.className = 'rt-act' + (cls ? ' ' + cls : '');
  b.title = title;
  b.textContent = label;
  b.onclick = (e) => {
    e.stopPropagation();
    fn();
  };
  return b;
}

function itemEl(rec) {
  const el = document.createElement('div');
  el.className = 'rt-item';

  const main = document.createElement('div');
  main.className = 'rt-main';
  main.onclick = () => loadInto(rec);
  const name = document.createElement('div');
  name.className = 'rt-name';
  name.textContent = rec.name;
  const meta = document.createElement('div');
  meta.className = 'rt-meta';
  meta.textContent = `${rec.distanceNM.toFixed(1)} מייל · ${rec.wpts.length} נק׳ · עודכן ${formatDate(rec.updatedAt)}`;
  main.append(name, meta);

  const acts = document.createElement('div');
  acts.className = 'rt-actions';
  acts.append(
    actionBtn('✎', 'שנה שם', '', () => renameRec(rec)),
    actionBtn('⧉', 'שכפל', '', () => duplicateRec(rec)),
    actionBtn('🗑', 'מחק', 'del', () => deleteRec(rec))
  );

  el.append(main, acts);
  return el;
}

function renderList() {
  getAllRoutes()
    .then((list) => {
      const wrap = $('rtList');
      wrap.innerHTML = '';
      $('rtEmpty').style.display = list.length ? 'none' : 'block';
      list.forEach((rec) => wrap.appendChild(itemEl(rec)));
    })
    .catch(() => toast('טעינת המסלולים נכשלה'));
}

export function init() {
  // 1. restore the working draft (synchronous) so the first paint shows it.
  const draft = loadDraft();
  if (draft && draft.wpts.length) {
    store.state = {
      name: draft.name || 'מסלול',
      wpts: draft.wpts.map((w) => ({ ...w, _id: uid() })),
      extended: !!draft.extended,
    };
  }

  // 2. autosave the working route on any structural / label change (debounced).
  let t;
  const persist = () => {
    clearTimeout(t);
    t = setTimeout(() => saveDraft(store.state), 400);
  };
  on('route:changed', persist);
  on('legs:changed', persist);

  // 3. drawer + actions.
  $('btnRoutes').onclick = openDrawer;
  $('btnRoutes2').onclick = openDrawer;
  $('routesClose').onclick = closeDrawer;
  $('btnSaveRoute').onclick = saveCurrent;
}
