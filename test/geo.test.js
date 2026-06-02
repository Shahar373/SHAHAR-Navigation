import { describe, it, expect } from 'vitest';
import { nm, brg, dest, dm, hm, ptSegNM, R_NM, D2R } from '../src/geo/geo.js';

const ONE_DEG_NM = (R_NM * Math.PI) / 180; // ≈ 60.04 NM per degree of latitude

describe('geo helpers', () => {
  it('nm: zero for identical points, ~60 NM per degree latitude', () => {
    expect(nm({ lat: 32, lon: 34 }, { lat: 32, lon: 34 })).toBe(0);
    expect(nm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(ONE_DEG_NM, 2);
  });

  it('brg: north is 0°, east is 90°', () => {
    expect(brg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 5);
    expect(brg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 5);
  });

  it('dest: travelling due north by ~60 NM lands ~1° north', () => {
    const [lat, lon] = dest(0, 0, 0, ONE_DEG_NM);
    expect(lat).toBeCloseTo(1, 4);
    expect(lon).toBeCloseTo(0, 4);
  });

  it('dm: formats degrees-decimal-minutes with hemispheres', () => {
    expect(dm(32.16305, 34.79624)).toBe("32°09.783'N 034°47.774'E");
  });

  it('hm: formats hours as H:MM', () => {
    expect(hm(2.5)).toBe('2:30 שעות');
  });

  it('ptSegNM: distance from a point to a segment it lies on is ~0', () => {
    const onSeg = ptSegNM({ lat: 0.5, lon: 0 }, { lat: 0, lon: 0 }, { lat: 1, lon: 0 });
    expect(onSeg).toBeCloseTo(0, 5);
  });

  it('exports the expected constants', () => {
    expect(R_NM).toBeCloseTo(3440.065, 3);
    expect(D2R).toBeCloseTo(Math.PI / 180, 10);
  });
});
