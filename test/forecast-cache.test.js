import { describe, it, expect, beforeEach } from 'vitest';
import { saveForecast, loadForecast, formatAge } from '../src/weather/forecast-cache.js';

describe('forecast cache', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips data with a timestamp', () => {
    saveForecast('wind', { wind_speed_10m: 5 });
    const r = loadForecast('wind');
    expect(r.data.wind_speed_10m).toBe(5);
    expect(typeof r.at).toBe('number');
  });

  it('returns null for a missing key', () => {
    expect(loadForecast('nope')).toBeNull();
  });

  it('formatAge: minutes / hours / days', () => {
    const now = 1_000_000_000_000;
    expect(formatAge(now, now)).toBe('עכשיו');
    expect(formatAge(now - 12 * 60_000, now)).toBe('לפני 12 ד׳');
    expect(formatAge(now - 3 * 3_600_000, now)).toBe('לפני 3 ש׳');
    expect(formatAge(now - 2 * 86_400_000, now)).toBe('לפני 2 ימים');
  });
});
