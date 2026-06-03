/* App entry point. Imports styles + self-hosted fonts, then runs each module's init()
 * in a deterministic order (replaces the original end-of-file init at L757–758). */

import './styles/main.css';

// self-hosted fonts (replaces the Google Fonts CDN — required for offline-first)
import '@fontsource/heebo/300.css';
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/700.css';
import '@fontsource/frank-ruhl-libre/500.css';
import '@fontsource/frank-ruhl-libre/700.css';
import '@fontsource/frank-ruhl-libre/900.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import { map, init as initMap } from './map/map.js';
import { init as initOverlays } from './map/overlays.js';
import { init as initMarineField } from './weather/marine-field.js';
import { init as initLegs } from './route/legs.js';
import { init as initFuel } from './fuel/fuel.js';
import { init as initRoute, renderRefs, renderRoute, getRouteLine } from './route/route.js';
import { init as initEditor } from './route/editor.js';
import { init as initIO } from './io/import-export.js';
import { init as initMeasure } from './measure/measure.js';
import { init as initLocate } from './nav/locate.js';
import { init as initWindy } from './weather/windy.js';
import { init as initChrome } from './ui/chrome.js';
import { init as initWind } from './weather/wind.js';
import { init as initPwa } from './pwa/offline.js';

// 0. PWA: register service worker + offline/install UI (independent of the map)
initPwa();

// 1. map must exist before anything else touches it
initMap();
// 2. static + field layers and their toggles
initOverlays();
initMarineField();
// 3. bus subscribers (legs + fuel) must be registered before the first render
initLegs();
initFuel();
// 4. route popup handler + remaining DOM handlers
initRoute();
initEditor();
initIO();
initMeasure();
initLocate();
initWindy();
initChrome();

// 5. first paint (replaces L757–758)
renderRefs();
renderRoute(true);
setTimeout(() => {
  const rl = getRouteLine();
  if (rl) map.flyToBounds(rl.getBounds().pad(0.4), { duration: 1.0 });
}, 350);

// 6. independent fire-and-forget forecast
initWind();
