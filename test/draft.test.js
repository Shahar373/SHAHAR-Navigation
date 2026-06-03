import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft } from '../src/routes/draft.js';

const state = {
  name: 'טיוטה',
  wpts: [
    { _id: 'wp1', lat: 32.1, lon: 34.8, name: 'א', type: 'start', vhf: '11' },
    { _id: 'wp2', lat: 32.2, lon: 34.8, name: 'ב', type: 'cruise', vhf: '16' },
  ],
  extended: true,
};

describe('draft autosave', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips name/extended and strips runtime _id', () => {
    saveDraft(state);
    const d = loadDraft();
    expect(d.name).toBe('טיוטה');
    expect(d.extended).toBe(true);
    expect(d.wpts).toHaveLength(2);
    expect('_id' in d.wpts[0]).toBe(false);
    expect(d.wpts[1].name).toBe('ב');
  });

  it('returns null when nothing is saved', () => {
    expect(loadDraft()).toBeNull();
  });

  it('clearDraft removes the saved draft', () => {
    saveDraft(state);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('returns null for malformed stored data', () => {
    localStorage.setItem('mnp.draft', '{not json');
    expect(loadDraft()).toBeNull();
  });
});
