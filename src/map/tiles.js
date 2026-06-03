/* Pure slippy-tile math + tile URL builders for the offline "download this area"
 * feature (M1b). No Leaflet / DOM deps, so the enumeration is unit-testable.
 *
 * Only policy-compliant sources are pre-fetched in bulk: Esri World Imagery and the
 * OpenSeaMap seamark overlay. tile.openstreetmap.org is deliberately NOT bulk-fetched
 * (CLAUDE.md hard constraint #6 — respect the OSM tile usage policy). */

export function lon2tile(lon, z) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function lat2tile(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** All {z,x,y} tiles covering a bbox across [zmin..zmax] (inclusive). */
export function tilesForBbox({ west, south, east, north }, zmin, zmax) {
  const tiles = [];
  for (let z = zmin; z <= zmax; z++) {
    const xa = lon2tile(west, z),
      xb = lon2tile(east, z);
    const ya = lat2tile(north, z), // north → smaller y
      yb = lat2tile(south, z);
    const max = 2 ** z - 1;
    const clamp = (v) => Math.max(0, Math.min(max, v));
    for (let x = clamp(Math.min(xa, xb)); x <= clamp(Math.max(xa, xb)); x++)
      for (let y = clamp(Math.min(ya, yb)); y <= clamp(Math.max(ya, yb)); y++)
        tiles.push({ z, x, y });
  }
  return tiles;
}

export const esriTileUrl = ({ z, x, y }) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

export const seamarkTileUrl = ({ z, x, y }) =>
  `https://tiles.openseamap.org/seamark/${z}/${x}/${y}.png`;

/** Central-Israel coast preset (Herzliya ↔ Poleg + offshore margin toward the 12 NM line).
 * Matches the user's stated operating area; keeps the tile count small. */
export const CENTRAL_COAST = { west: 34.55, south: 32.0, east: 34.86, north: 32.45 };
