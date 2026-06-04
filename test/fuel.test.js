import { describe, it, expect } from 'vitest';
import { computeFuel } from '../src/fuel/fuel.js';

const base = {
  tank: 60,
  now: 45,
  condPct: 0,
  lph: 22,
  spdLph: 7,
  lnm: 1.2,
  cruiseSpd: 7,
  fuelType: 'gas',
  hp: 150,
  load: 60,
  spdHp: 18,
  reserveMode: 'thirds',
  resPct: 25,
  resFix: 15,
  D: 10,
};

describe('computeFuel', () => {
  it('L/h + speed mode derives L/NM = lph/speed', () => {
    const r = computeFuel({ ...base, mode: 'lph' });
    expect(r.eLnm).toBeCloseTo(22 / 7, 5);
    expect(r.eLph).toBeCloseTo(22, 5);
    expect(r.working).toBeCloseTo(10 * (22 / 7), 4); // D * eLnm
    expect(r.reserve).toBeCloseTo(r.working / 2, 5); // thirds
    expect(r.required).toBeCloseTo(r.working + r.reserve, 5);
    expect(r.go).toBe(false); // 45 < required (~47.1)
  });

  it('L/NM mode derives L/h = lnm * cruise speed', () => {
    const r = computeFuel({ ...base, mode: 'lnm' });
    expect(r.eLnm).toBeCloseTo(1.2, 5);
    expect(r.eLph).toBeCloseTo(1.2 * 7, 5);
    expect(r.working).toBeCloseTo(12, 5);
    expect(r.reserve).toBeCloseTo(6, 5);
    expect(r.required).toBeCloseTo(18, 5);
    expect(r.go).toBe(true); // 45 >= 18
  });

  it('engine HP mode: diesel uses 0.21, gas uses 0.38 L per HP·load·h', () => {
    const diesel = computeFuel({ ...base, mode: 'hp', fuelType: 'diesel' });
    expect(diesel.eLph).toBeCloseTo(150 * 0.6 * 0.21, 5);
    expect(diesel.eLnm).toBeCloseTo((150 * 0.6 * 0.21) / 18, 5);
    const gas = computeFuel({ ...base, mode: 'hp', fuelType: 'gas' });
    expect(gas.eLph).toBeCloseTo(150 * 0.6 * 0.38, 5);
  });

  it('reserve policies: percent of tank and fixed litres', () => {
    const pct = computeFuel({ ...base, mode: 'lnm', reserveMode: 'pct', resPct: 25 });
    expect(pct.reserve).toBeCloseTo(15, 5); // 25% of 60
    const fix = computeFuel({ ...base, mode: 'lnm', reserveMode: 'fix', resFix: 15 });
    expect(fix.reserve).toBeCloseTo(15, 5);
  });

  it('sea-condition penalty scales effective consumption by (1 + cond%)', () => {
    const r = computeFuel({ ...base, mode: 'lnm', condPct: 10 });
    expect(r.eLnm).toBeCloseTo(1.2 * 1.1, 5);
    expect(r.eLph).toBeCloseTo(1.2 * 7 * 1.1, 5);
  });

  it('max-distance-out is half of the usable round-trip range', () => {
    const r = computeFuel({ ...base, mode: 'lnm' });
    const usable = Math.max(0, base.now - r.reserve);
    expect(r.maxOut).toBeCloseTo(usable / r.eLnm / 2, 5);
  });

  it('fuel cost in ₪ = litres × price (M4)', () => {
    const r = computeFuel({ ...base, mode: 'lnm', pricePerL: 7.5 });
    expect(r.requiredCost).toBeCloseTo(r.required * 7.5, 5);
    expect(r.workingCost).toBeCloseTo(r.working * 7.5, 5);
    const free = computeFuel({ ...base, mode: 'lnm' }); // price defaults to 0
    expect(free.requiredCost).toBe(0);
  });
});
