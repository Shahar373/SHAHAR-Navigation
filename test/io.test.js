import { describe, it, expect } from 'vitest';
import { toJson, toGeoJson, toGpx, parseRoute } from '../src/io/serialize.js';

const state = {
  name: 'מסלול בדיקה',
  wpts: [
    {
      _id: 'a',
      type: 'start',
      vhf: '11',
      lat: 32.16305,
      lon: 34.79624,
      name: 'מרינה',
      action: 'x',
      depth: 'מעגן',
    },
    {
      _id: 'b',
      type: 'cruise',
      vhf: '16',
      lat: 32.19,
      lon: 34.786,
      name: 'אמצע',
      action: '',
      depth: '~20',
    },
    {
      _id: 'c',
      type: 'turn',
      vhf: '16',
      lat: 32.196,
      lon: 34.788,
      name: 'היפוך',
      action: '',
      depth: '~25',
    },
  ],
};

const coords = (wpts) => wpts.map((w) => [+w.lat.toFixed(6), +w.lon.toFixed(6)]);

describe('import/export round-trips', () => {
  it('native JSON preserves count, coordinates and names', () => {
    const { wpts, name } = parseRoute(toJson(state), 'route.json');
    expect(name).toBe(state.name);
    expect(wpts).toHaveLength(3);
    expect(coords(wpts)).toEqual(coords(state.wpts));
    expect(wpts.map((w) => w.name)).toEqual(state.wpts.map((w) => w.name));
  });

  it('GeoJSON preserves count, coordinates, names and types', () => {
    const { wpts, name } = parseRoute(toGeoJson(state), 'route.geojson');
    expect(name).toBe(state.name);
    expect(wpts).toHaveLength(3);
    expect(coords(wpts)).toEqual(coords(state.wpts));
    expect(wpts.map((w) => w.name)).toEqual(state.wpts.map((w) => w.name));
    expect(wpts.map((w) => w.type)).toEqual(state.wpts.map((w) => w.type));
  });

  it('GPX preserves count and coordinates (names become WP## by design)', () => {
    const { wpts } = parseRoute(toGpx(state), 'route.gpx');
    expect(wpts).toHaveLength(3);
    expect(coords(wpts)).toEqual(coords(state.wpts));
  });
});
