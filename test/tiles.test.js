import { describe, it, expect } from 'vitest';
import {
  lon2tile,
  lat2tile,
  tilesForBbox,
  esriTileUrl,
  seamarkTileUrl,
  CENTRAL_COAST,
} from '../src/map/tiles.js';

describe('slippy tile math', () => {
  it('known tile for Herzliya at z12', () => {
    // Herzliya marina ≈ 32.163N, 34.796E
    expect(lon2tile(34.796, 12)).toBe(2443);
    expect(lat2tile(32.163, 12)).toBe(1661);
  });

  it('z0 is a single tile 0,0', () => {
    expect(lon2tile(-180, 0)).toBe(0);
    expect(lat2tile(85, 0)).toBe(0);
  });
});

describe('tilesForBbox', () => {
  it('enumerates a small bbox inclusively', () => {
    const t = tilesForBbox(CENTRAL_COAST, 10, 10);
    expect(t.length).toBeGreaterThan(0);
    expect(t.every((x) => x.z === 10)).toBe(true);
  });

  it('tile count grows with zoom depth', () => {
    const a = tilesForBbox(CENTRAL_COAST, 10, 11).length;
    const b = tilesForBbox(CENTRAL_COAST, 10, 13).length;
    expect(b).toBeGreaterThan(a);
  });

  it('stays bounded for the central-coast preset z10–14', () => {
    const t = tilesForBbox(CENTRAL_COAST, 10, 14);
    expect(t.length).toBeLessThan(1500); // sane offline payload (×2 layers)
  });

  it('clamps tile indices to valid range', () => {
    const t = tilesForBbox({ west: -200, south: -90, east: 200, north: 90 }, 1, 1);
    expect(t.every((x) => x.x >= 0 && x.x <= 1 && x.y >= 0 && x.y <= 1)).toBe(true);
  });
});

describe('tile URLs', () => {
  it('esri uses {z}/{y}/{x} order', () => {
    expect(esriTileUrl({ z: 12, x: 2443, y: 1661 })).toBe(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1661/2443'
    );
  });
  it('seamark uses {z}/{x}/{y}.png order', () => {
    expect(seamarkTileUrl({ z: 12, x: 2443, y: 1661 })).toBe(
      'https://tiles.openseamap.org/seamark/12/2443/1661.png'
    );
  });
});
