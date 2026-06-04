import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings, patchSettings } from '../src/ui/settings-store.js';

describe('settings store', () => {
  beforeEach(() => localStorage.clear());

  it('returns {} when nothing is saved', () => {
    expect(loadSettings()).toEqual({});
  });

  it('round-trips a settings object', () => {
    saveSettings({ theme: 'sun', fields: { spd: '8' } });
    const s = loadSettings();
    expect(s.theme).toBe('sun');
    expect(s.fields.spd).toBe('8');
  });

  it('patch merges into existing settings', () => {
    saveSettings({ theme: 'dark', fields: { spd: '7' } });
    const n = patchSettings({ theme: 'night' });
    expect(n.theme).toBe('night');
    expect(n.fields.spd).toBe('7'); // preserved
    expect(loadSettings().theme).toBe('night');
  });

  it('survives malformed stored data', () => {
    localStorage.setItem('mnp.settings', '{bad');
    expect(loadSettings()).toEqual({});
  });
});
