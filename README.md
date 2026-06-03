# Marine Nav Pro · ניווט ימי · הרצליה · משיט 30

A marine navigation / route planner for a beginner Israeli **Class‑30 ("Mashit 30")** skipper,
with a fixed departure at **Herzliya Marina**. Vanilla JS + [Leaflet](https://leafletjs.com/),
Hebrew RTL UI, a dark "nautical instrument" theme, and **only free, keyless, open data sources**.

> ⚠️ **Planning aid, not certified navigation.** Always verify official charts and regulations.

## Features

- Base layers (OSM / Esri satellite / OpenTopo) + OpenSeaMap **seamark** overlay.
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

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Vite dev server                            |
| `npm run build`   | Production build → `dist/`                 |
| `npm run preview` | Serve the production build                 |
| `npm run lint`    | ESLint                                     |
| `npm run format`  | Prettier (write); `format:check` to verify |
| `npm test`        | Vitest unit/smoke tests                    |

## Install it on your phone (PWA)

Once deployed (see below), open the live URL in your phone's browser and choose **"Add to Home
Screen" / "Install"** (the app also shows an **"התקן את האפליקציה"** button when installable). It
then runs full-screen like a native app and works **offline**: the app itself, the last fetched
wind/marine forecast (shown with an "as of" stamp), and any map areas you've already viewed are
cached. Live data refreshes automatically whenever you're back online.

> Full offline map coverage for areas you haven't browsed yet (a downloadable vector basemap) is
> the next step — **M1b**.

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub
Pages. **One-time setup:** in the GitHub repo go to **Settings → Pages → Build and deployment →
Source: "GitHub Actions"**. After the first run the app is live at:

```
https://shahar373.github.io/SHAHAR-Navigation/
```

## Project status

Milestones **M0** (modularization, no behavior change), **M1** (installable, offline-capable PWA +
auto-deploy) and **M2** (IndexedDB saved-routes library + working-route autosave) are done. The
original single file is kept at `reference/marine_nav_pro.html` for parity diffing. Upcoming:
**M1b** offline vector basemap + "download area", **M3** Android APK (Capacitor), **M4** live
tracking & richer marine features, **M5** polish.

See [`CLAUDE.md`](./CLAUDE.md) for the architecture and the binding project constraints
(keyless/free data only, Hebrew RTL, offline-first, OSM tile-policy compliance, NM/knots/DM units).

## Tech & data sources

Vanilla JS, Leaflet 1.9.4 (bundled via npm), self-hosted fonts (`@fontsource`). Data: Open-Meteo
(forecast + marine), OpenSeaMap, OSM, Esri/OpenTopo tiles, Windy (keyless embed). No API keys, no
secrets.
