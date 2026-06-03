/* Build the self-hosted PMTiles vector basemap for the central-Israel coast (M1b).
 *
 * Run this ON YOUR OWN MACHINE (open network + Java 17+). It downloads the OSM extract
 * and Planetiler, builds a small vector-tile archive clipped to the operating area, and
 * writes it to public/coast.pmtiles. Then set VITE_BASEMAP_URL and rebuild:
 *
 *   npm run build:basemap
 *   VITE_BASEMAP_URL=/SHAHAR-Navigation/coast.pmtiles npm run build
 *
 * The committed app is OSM-tile-policy compliant either way: without the file it uses the
 * raster bases (no OSM bulk pre-fetch); with the file the vector basemap becomes default.
 * Generation is intentionally NOT done in CI (the sandbox blocks OSM data downloads). */

import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PLANETILER_VERSION = '0.8.3';
const JAR = `planetiler-${PLANETILER_VERSION}.jar`;
const JAR_URL = `https://github.com/onthegomap/planetiler/releases/download/v${PLANETILER_VERSION}/planetiler.jar`;

// Central-Israel coast: Herzliya ↔ Poleg + offshore margin (matches src/map/tiles.js).
const BOUNDS = '34.55,32.0,34.86,32.45';
const OUT = 'public/coast.pmtiles';

function run(cmd, args) {
  console.log('›', cmd, args.join(' '));
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nCommand failed (${r.status}). Is Java 17+ installed and the network open?`);
    process.exit(r.status || 1);
  }
}

mkdirSync('public', { recursive: true });

if (!existsSync(JAR)) {
  console.log(`Downloading Planetiler ${PLANETILER_VERSION}…`);
  run('curl', ['-L', '-o', JAR, JAR_URL]);
}

// Planetiler fetches the geofabrik israel-and-palestine extract and clips to BOUNDS.
run('java', [
  '-Xmx2g',
  '-jar',
  JAR,
  '--download',
  '--area=israel-and-palestine',
  `--bounds=${BOUNDS}`,
  `--output=${OUT}`,
  '--force',
]);

console.log(`\n✓ Wrote ${OUT}`);
console.log('Next: VITE_BASEMAP_URL=/SHAHAR-Navigation/coast.pmtiles npm run build');
