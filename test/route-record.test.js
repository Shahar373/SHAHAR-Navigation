import { describe, it, expect } from 'vitest';
import {
  routeDistanceNM,
  toRecord,
  recordToState,
  formatDate,
  newRouteId,
} from '../src/routes/route-record.js';

const wpts = [
  { _id: 'wp1', lat: 32.16, lon: 34.8, name: 'מרינה', type: 'start', vhf: '11' },
  { _id: 'wp2', lat: 32.26, lon: 34.8, name: 'צפון', type: 'cruise', vhf: '16' },
];

describe('routeDistanceNM', () => {
  it('sums leg distances (≈6 NM for 0.1° lat)', () => {
    const d = routeDistanceNM(wpts);
    expect(d).toBeGreaterThan(5.9);
    expect(d).toBeLessThan(6.1);
  });
  it('is zero for a single point', () => {
    expect(routeDistanceNM([wpts[0]])).toBe(0);
  });
});

describe('toRecord', () => {
  it('strips _id, computes distance + timestamps', () => {
    const rec = toRecord({ name: 'מסלול', wpts, extended: false }, { now: 1000, createdAt: 500 });
    expect(rec.name).toBe('מסלול');
    expect(rec.wpts.every((w) => !('_id' in w))).toBe(true);
    expect(rec.distanceNM).toBeGreaterThan(5.9);
    expect(rec.createdAt).toBe(500);
    expect(rec.updatedAt).toBe(1000);
    expect(rec.id).toMatch(/^rt_/);
  });
  it('round-trips through recordToState preserving coords + name', () => {
    const rec = toRecord({ name: 'R', wpts, extended: true });
    const st = recordToState(rec);
    expect(st.name).toBe('R');
    expect(st.extended).toBe(true);
    expect(st.wpts).toHaveLength(2);
    expect(st.wpts[0].lat).toBe(32.16);
    expect(st.wpts[1].name).toBe('צפון');
    expect('_id' in st.wpts[0]).toBe(false);
  });
});

describe('newRouteId', () => {
  it('generates distinct ids', () => {
    expect(newRouteId()).not.toBe(newRouteId());
  });
});

describe('formatDate', () => {
  const now = new Date(2026, 5, 3, 12, 0, 0).getTime();
  it('says "היום" for the same day', () => {
    expect(formatDate(now, now)).toBe('היום');
  });
  it('says "אתמול" for the previous day', () => {
    expect(formatDate(now - 86400000, now)).toBe('אתמול');
  });
  it('gives a Hebrew day+month for older dates this year', () => {
    const older = new Date(2026, 0, 15).getTime();
    expect(formatDate(older, now)).toBe('15 בינו׳');
  });
});
