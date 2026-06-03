# Marine Nav Pro · ניווט ימי · הרצליה · משיט 30

A marine navigation / route planner for a beginner Israeli **Class‑30 ("Mashit 30")** skipper,
with a fixed departure at **Herzliya Marina**. Vanilla JS + [Leaflet](https://leafletjs.com/),
Hebrew RTL UI, a dark "nautical instrument" theme, and **only free, keyless, open data sources**.

> ⚠️ **Planning aid, not certified navigation.** Always verify official charts and regulations.

## Features

- Base layers (OSM / Esri satellite / OpenTopo) + OpenSeaMap **seamark** overlay.
- **Offline maps:** "download this area" pre-caches Esri satellite + seamark for your region (or a
  central-Israel coast preset) so the map works with no signal; an optional self-hosted PMTiles
  vector basemap can be generated with `npm run build:basemap`.
- Route with typed waypoints, animated track, RTL popups (VHF, DM coords, depth, bearing/distance).
- Route stats (one-way / round-trip NM), cruise-speed slider → live ETA, clickable leg list.
- Live **wind** widget (Open-Meteo) with a go/no-go verdict + SW-storm warning.
- Live **waves & currents** field (Open-Meteo Marine API) drawn on the map with a legend.
- **Windy** embed (wind / waves / currents).
- **Route editor:** drag, click-to-insert, delete, rename, edit type/VHF, new / reset / extend-to-Poleg.
- 12 NM limit line + allowed-zone shading, coast reference, 1‑NM rings.
- Measure tool (NM), live geolocation with distance/bearing to target, day/night, fullscreen.
- **Saved-routes library** (IndexedDB): a "My Routes" drawer to save / load / rename / duplicate /
  delete multiple routes; the working route autosaves on-device and is restored next time you open.
- Import / export: **GPX, GeoJSON, JSON**.
- **Fuel calculator:** 3 consumption modes, reserve policies (thirds / % / fixed), sea-condition
  penalty, fuel bar, go/no-go verdict, per-leg turn-back table, point-of-no-return.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command                 | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Vite dev server                                                 |
| `npm run build`         | Production build → `dist/`                                      |
| `npm run preview`       | Serve the production build                                      |
| `npm run lint`          | ESLint                                                          |
| `npm run format`        | Prettier (write); `format:check` to verify                      |
| `npm test`              | Vitest unit/smoke tests                                         |
| `npm run build:basemap` | Generate the offline PMTiles vector basemap (local; needs Java) |

## Install it on your phone (PWA)

Once deployed (see below), open the live URL in your phone's browser and choose **"Add to Home
Screen" / "Install"** (the app also shows an **"התקן את האפליקציה"** button when installable). It
then runs full-screen like a native app and works **offline**: the app itself, the last fetched
wind/marine forecast (shown with an "as of" stamp), and any map areas you've already viewed are
cached. Live data refreshes automatically whenever you're back online.

### Offline map coverage (download an area)

Open the sidebar → **"מפה לא־מקוונת (הורדת אזור)"** and tap **"חוף מרכז הארץ"** (or **"הורד תצוגה
נוכחית"**). This pre-fetches Esri satellite + OpenSeaMap seamark tiles for that region into the
offline cache so the map renders with no signal. Do it from home (Wi-Fi) before heading out.

> To stay within the OSM tile usage policy, `tile.openstreetmap.org` is **never** bulk-downloaded —
> only Esri + seamark are pre-cached. For a true offline **vector** street basemap, generate a
> self-hosted PMTiles archive on your own machine (open network, Java 17+):
>
> ```bash
> npm run build:basemap   # → public/coast.pmtiles (central-Israel coast)
> VITE_BASEMAP_URL=/SHAHAR-Navigation/coast.pmtiles npm run build
> ```
>
> When `VITE_BASEMAP_URL` is set the app loads the vector basemap as the default; when unset the
> PMTiles code is tree-shaken out entirely (zero bundle cost).

## Android app (APK)

The app also ships as a native **Android APK** (Capacitor) with real GPS, file export, and a
screen wake-lock. The APK is built **in CI** (GitHub's runners have the Android SDK) — you don't
need Android Studio:

1. GitHub repo → **Actions → "Build Android APK" → "Run workflow"**.
2. When it finishes, download the **`marinenav-debug-apk`** artifact from the run.
3. Copy `app-debug.apk` to your phone and open it (enable "install from unknown sources").

Pushing a `v*` tag (e.g. `git tag v0.3.0 && git push --tags`) also attaches the APK to a GitHub
Release. The same `src/` codebase powers the web and native builds; native vs web behavior is
selected at runtime through the adapters in `src/platform/`.

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub
Pages. **One-time setup:** in the GitHub repo go to **Settings → Pages → Build and deployment →
Source: "GitHub Actions"**. After the first run the app is live at:

```
https://shahar373.github.io/SHAHAR-Navigation/
```

## Project status

Milestones **M0** (modularization), **M1** (installable PWA + auto-deploy), **M2** (IndexedDB
saved-routes library), **M1b** ("download this area" offline caching + ready PMTiles basemap) and
**M3** (Capacitor Android APK with native GPS / file export / wake-lock, built in CI) are done. The
original single file is kept at `reference/marine_nav_pro.html` for parity diffing. Upcoming: **M4**
live tracking & richer marine features, **M5** polish.

See [`CLAUDE.md`](./CLAUDE.md) for the architecture and the binding project constraints
(keyless/free data only, Hebrew RTL, offline-first, OSM tile-policy compliance, NM/knots/DM units).

## Tech & data sources

Vanilla JS, Leaflet 1.9.4 (bundled via npm), self-hosted fonts (`@fontsource`), Capacitor for the
Android shell, PMTiles/protomaps-leaflet for the optional offline vector basemap. Data: Open-Meteo
(forecast + marine), OpenSeaMap, OSM, Esri/OpenTopo tiles, Windy (keyless embed). No API keys, no
secrets.
