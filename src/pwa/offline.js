/* PWA glue (M1): registers the auto-updating service worker, shows an offline
 * banner, and wires the "install app" button. */

import { registerSW } from 'virtual:pwa-register';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';

function setOffline(off) {
  const b = $('offlineBanner');
  if (b) b.classList.toggle('on', off);
}

export function init() {
  // auto-updating service worker (precaches the app shell)
  registerSW({
    immediate: true,
    onOfflineReady() {
      toast('מוכן לשימוש לא־מקוון ✓');
    },
  });

  // online / offline banner
  setOffline(!navigator.onLine);
  window.addEventListener('online', () => {
    setOffline(false);
    toast('חיבור הרשת חזר');
  });
  window.addEventListener('offline', () => setOffline(true));

  // install prompt
  let deferred = null;
  const btn = $('btnInstall');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (btn) btn.style.display = '';
  });
  if (btn)
    btn.onclick = async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      btn.style.display = 'none';
    };
  window.addEventListener('appinstalled', () => {
    if (btn) btn.style.display = 'none';
    toast('האפליקציה הותקנה ✓');
  });
}
