/* Self-hosted PMTiles vector basemap (M1b) — the OSM-tile-policy-compliant default
 * basemap once a coastal `.pmtiles` archive is available (CLAUDE.md hard constraint #6).
 *
 * Infrastructure-ready but dormant: it activates only when a basemap URL is provided via
 * the build-time env var `VITE_BASEMAP_URL` (e.g. `/SHAHAR-Navigation/coast.pmtiles`,
 * with the file dropped into `public/`). When unset this is a no-op, so the current
 * raster bases keep working unchanged. The heavy deps (protomaps-leaflet + pmtiles) are
 * dynamically imported, so they are code-split out of the default bundle.
 *
 * To produce the archive (network is open on your own machine, blocked in CI sandbox):
 *   npm run build:basemap   →  see scripts/build-basemap.mjs */

const BASEMAP_URL = import.meta.env.VITE_BASEMAP_URL;

/** If a basemap is configured, add it to the layer control and make it the default base.
 * Returns true if the vector basemap was added. Never throws. */
export async function tryAddVectorBasemap(map, layersControl) {
  if (!BASEMAP_URL) return false;
  try {
    const proto = await import('protomaps-leaflet');
    const layer = proto.leafletLayer({
      url: BASEMAP_URL,
      attribution: '© OpenStreetMap · PMTiles',
    });
    layer.addTo(map);
    if (layersControl) layersControl.addBaseLayer(layer, 'מפה ימית (offline)');
    return true;
  } catch (e) {
    // Missing file, unsupported API, etc. — fall back silently to the raster bases.
    console.warn('vector basemap unavailable:', e && e.message);
    return false;
  }
}
