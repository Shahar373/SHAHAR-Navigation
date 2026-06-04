import { describe, it, expect } from 'vitest';
import { trackDistanceNM, trackStats, fmtDur, toTrackGpx } from '../src/track/track.js';

// ~6 NM north over 1 hour (0.1° lat ≈ 6 NM)
const pts = [
  { lat: 32.1, lon: 34.8, t: 0 },
  { lat: 32.2, lon: 34.8, t: 3_600_000 },
];

describe('track stats', () => {
  it('distance ≈ 6 NM for 0.1° latitude', () => {
    expect(trackDistanceNM(pts)).toBeGreaterThan(5.9);
    expect(trackDistanceNM(pts)).toBeLessThan(6.1);
  });

  it('avg speed = distance / hours; duration carries through', () => {
    const s = trackStats(pts);
    expect(s.durMs).toBe(3_600_000);
    expect(s.avgKt).toBeCloseTo(s.distNM, 3); // 1 hour → kt == NM
    expect(s.points).toBe(2);
    expect(s.maxKt).toBeGreaterThan(0);
  });

  it('empty / single-point tracks are zero', () => {
    expect(trackDistanceNM([])).toBe(0);
    expect(trackStats([pts[0]]).durMs).toBe(0);
  });
});

describe('fmtDur', () => {
  it('formats h:mm:ss', () => {
    expect(fmtDur(0)).toBe('0:00:00');
    expect(fmtDur(3_661_000)).toBe('1:01:01');
    expect(fmtDur(125_000)).toBe('0:02:05');
  });
});

describe('toTrackGpx', () => {
  it('emits a <trk> with timestamped <trkpt>s', () => {
    const g = toTrackGpx('בדיקה', pts);
    expect(g).toContain('<trk><name>בדיקה</name>');
    expect((g.match(/<trkpt /g) || []).length).toBe(2);
    expect(g).toContain('lat="32.1"');
    expect(g).toContain('<time>');
  });
  it('escapes XML in the track name', () => {
    expect(toTrackGpx('a & <b>', pts)).toContain('a &amp; &lt;b>');
  });
});
