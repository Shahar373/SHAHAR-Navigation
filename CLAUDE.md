# CLAUDE.md — Marine Nav Pro project law

Marine navigation / route planner for a beginner Israeli **Class‑30 skipper ("Mashit 30")**,
fixed departure at **Herzliya Marina**. Vanilla JS + Leaflet, Hebrew RTL, dark "nautical
instrument" theme. This file is binding for all future work — read it before changing anything.

## Hard constraints (do not violate)

1. **Keyless, free, open data only.** Allowed sources: Open-Meteo (forecast + marine),
   OpenSeaMap, OSM / PMTiles, Esri & OpenTopo tiles, Windy (keyless embed only). **No paid API
   keys, no secrets committed, ever.**
2. **Hebrew RTL is mandatory.** Keep `dir="rtl"`, Hebrew strings, RTL-correct layout, and the
   fonts Heebo / Frank Ruhl Libre / IBM Plex Mono (self-hosted via `@fontsource`, not a CDN).
3. **Offline-first is a primary requirement** (no cell signal at sea). The app must remain usable
   with no network and degrade gracefully. Offline map tiles + last-forecast caching + an explicit
   "download this area" action land in M1.
4. **Persistence:** use IndexedDB (or Capacitor Filesystem on native) for the saved-routes library
   (M2). Keep file import/export (GPX / GeoJSON / JSON) working too.
5. **Safety disclaimer is permanent and visible:** "planning aid, not certified navigation —
   verify official charts and regulations." It lives in the VHF/safety card in `index.html`. Never
   remove it.
6. **Tile licensing — respect the OSM tile usage policy.** Heavy use of `tile.openstreetmap.org`
   in a distributed app is **not allowed**. The committed tile strategy is a **self-hosted PMTiles
   vector basemap** (default) + runtime caching for the Esri/seamark overlays. Do not ship a build
   that bulk-hits the public OSM tile servers.
7. **Units & geo:** nautical miles, knots, WGS84, coordinates shown in degrees-decimal-minutes
   (DM). Do not change these.
8. **Don't break existing features.** Each milestone must leave `npm run dev` working and keep the
   smoke tests green. Add regression checks where reasonable.

## Conventions

- **Vanilla ES modules**, no UI framework. Reactivity comes from the tiny event bus in
  `src/state/store.js` (`on` / `emit`), not a framework.
- Keep dependencies **minimal** and keyless. No build-time secrets.
- ESLint + Prettier must pass (`npm run lint`, `npm run format:check`).
- Keep pure logic (geo math, fuel math, serialize/parse) **free of Leaflet/DOM-app imports** so it
  stays unit-testable — see `src/geo`, `src/fuel/fuel.js#computeFuel`, `src/io/serialize.js`.

## Architecture (current, after M3)

- `src/main.js` — entry; runs each module's `init()` in a deterministic order.
- `src/state/` — `store.js` (state + event bus + `uid`), `defaults.js` (route data, TYPE).
- `src/geo/geo.js` — pure geodesy (nm, brg, dest, dm, hm, ptSegNM).
- `src/map/` — `map.js` (map + base layers + seamark), `overlays.js` (coast, rings, 12NM, zone),
  `tiles.js` (pure slippy-tile math + tile URLs), `download-area.js` ("download this area" offline
  raster caching of Esri+seamark — never bulk-fetches OSM), `basemap-vector.js` (dormant PMTiles
  vector basemap, activated by `VITE_BASEMAP_URL`; deps are tree-shaken out when unset).
- `src/route/` — `route.js` (render/markers/popups), `legs.js` (stats/ETA/leg list), `editor.js`.
- `src/weather/` — `wind.js`, `marine-field.js`, `windy.js`, `forecast-cache.js` (last-forecast cache).
- `src/fuel/fuel.js` — calculator (`computeFuel` pure + `updFuel` render).
- `src/io/` — `serialize.js` (pure GPX/GeoJSON/JSON), `import-export.js` (DOM/file wiring).
- `src/routes/` (M2) — `route-record.js` (pure: record shape, distance, date), `routes-db.js`
  (IndexedDB library CRUD), `draft.js` (working-route autosave in localStorage), `routes-ui.js`
  (the "המסלולים שלי" drawer + draft restore). `route.js#loadRoute` is the shared route-swap helper.
- `src/nav/locate.js`, `src/measure/measure.js`, `src/pwa/offline.js`, `src/ui/` (dom, toast, chrome).
- `src/platform/` (M3) — native/web adapters: `geolocation.js` (Capacitor Geolocation on device,
  `navigator.geolocation` on web), `files.js` (Filesystem on device, Blob download on web),
  `wakelock.js` (Screen Wake Lock — works in both). Modules pick the path via
  `Capacitor.isNativePlatform()`; native plugins are dynamically imported (off the PWA bundle).
- PWA: `vite-plugin-pwa` (Workbox) generates `manifest.webmanifest` + `sw.js`. Icons in `public/`
  are produced by `scripts/generate-icons.mjs` (sharp). `.github/workflows/deploy.yml` deploys to
  GitHub Pages (production `base` is `/SHAHAR-Navigation/`).
- Native (M3): `capacitor.config.json` (appId `com.shahar.marinenav`, `webDir: dist`). The Android
  project is **not committed** — `.github/workflows/android.yml` regenerates it with `cap add`,
  patches the manifest via `scripts/patch-android.mjs` (location/wake-lock perms + Hebrew label),
  and builds the debug APK in CI; the `CAP_BUILD=1` build uses a relative `base` for the WebView.
  Run that workflow (or push a `v*` tag) to get the APK.

The original single-file app is preserved at `reference/marine_nav_pro.html` for behavioral-parity
diffing and is **not** part of the build.

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # production build → dist/
npm run preview        # serve the built app
npm run lint           # ESLint
npm run format         # Prettier write   (format:check to verify)
npm test               # Vitest unit/smoke tests
```

## Milestone roadmap

- **M0 (done)** — Vite scaffold + lift-and-shift to ES modules, no behavior change, tests/lint.
- **M1 (done)** — installable PWA (manifest + service worker), app shell precached, last forecast
  cached with an "as of" stamp, runtime caching of viewed map tiles, offline-aware UI (banner +
  install button), GitHub Pages auto-deploy.
- **M1b (done)** — explicit "download this area" pre-caches Esri satellite + OpenSeaMap seamark for
  the central-Israel coast (OSM never bulk-fetched). Self-hosted PMTiles vector basemap is wired and
  ready (`basemap-vector.js` + `VITE_BASEMAP_URL`); generate the archive locally with
  `npm run build:basemap` (`scripts/build-basemap.mjs`, Planetiler) — CI can't build it (the sandbox
  blocks OSM data downloads).
- **M2 (done)** — IndexedDB saved-routes library: "המסלולים שלי" drawer with save / load / rename /
  duplicate / delete; the working route autosaves to localStorage and is restored on startup; file
  import/export (GPX/GeoJSON/JSON) stays wired through the shared `loadRoute` helper.
- **M3 (done)** — Capacitor Android shell wrapping the web build; native foreground Geolocation
  (runtime-permission GPS), native Filesystem for GPX/GeoJSON/JSON export, and screen wake-lock,
  all behind `src/platform/` adapters (web build unchanged). The debug APK is built in CI
  (`android.yml`) and downloaded from the run/Release — no Android SDK needed locally.
  (Background track recording lands with M4's live tracking.)
- **M4** — live track recording (incl. background geolocation), per-leg ETA/fuel vs live wind/current,
  fuel cost in ₪.
- **M5** — settings, accessibility, error handling, performance.
