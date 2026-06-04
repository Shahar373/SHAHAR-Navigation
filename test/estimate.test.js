import { describe, it, expect } from 'vitest';
import { legSOG, routeHours, hasEnv } from '../src/nav/estimate.js';

// two points ~6 NM apart, heading due north (bearing ≈ 0°)
const wpts = [
  { lat: 32.1, lon: 34.8 },
  { lat: 32.2, lon: 34.8 },
];

describe('legSOG', () => {
  it('equals cruise speed with no wind/current', () => {
    expect(legSOG(7, 0, null, null)).toBeCloseTo(7, 6);
  });

  it('a following current (toward the heading) adds to SOG', () => {
    // 1 m/s ≈ 1.94 kt; current flowing due north (toward 0°) on a 0° course
    expect(legSOG(7, 0, null, { spd: 1, dir: 0 })).toBeCloseTo(7 + 1.94384, 3);
  });

  it('an opposing current subtracts from SOG', () => {
    // current toward south (180°) on a north (0°) course
    expect(legSOG(7, 0, null, { spd: 1, dir: 180 })).toBeCloseTo(7 - 1.94384, 3);
  });

  it('headwind slows more than tailwind helps', () => {
    const head = legSOG(7, 0, { spd: 10, dir: 0 }, null); // wind FROM north = headwind going north
    const tail = legSOG(7, 0, { spd: 10, dir: 180 }, null); // wind FROM south = tailwind
    expect(head).toBeLessThan(7);
    expect(tail).toBeGreaterThan(7);
    expect(7 - head).toBeGreaterThan(tail - 7);
  });

  it('never returns below the 1 kt floor', () => {
    expect(legSOG(2, 0, null, { spd: 10, dir: 180 })).toBe(1);
  });
});

describe('routeHours', () => {
  it('round trip with no env = 2 × oneway / cruise', () => {
    const oneWayNM = 6; // approx
    const h = routeHours(wpts, 6, null, null, true);
    // ~12 NM at 6 kt ≈ 2 h
    expect(h).toBeGreaterThan(1.9);
    expect(h).toBeLessThan(2.1);
    expect(h).toBeCloseTo((2 * oneWayNM) / 6, 1);
  });

  it('one-way is half the round trip when env is symmetric', () => {
    const rt = routeHours(wpts, 7, null, null, true);
    const ow = routeHours(wpts, 7, null, null, false);
    expect(ow).toBeCloseTo(rt / 2, 6);
  });
});

describe('hasEnv', () => {
  it('true only with meaningful wind or current', () => {
    expect(hasEnv(null, null)).toBe(false);
    expect(hasEnv({ spd: 0.1, dir: 0 }, null)).toBe(false);
    expect(hasEnv({ spd: 5, dir: 0 }, null)).toBe(true);
    expect(hasEnv(null, { spd: 0.2, dir: 0 })).toBe(true);
  });
});
