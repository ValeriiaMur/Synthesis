import { describe, it, expect } from 'vitest';
import {
  evalTap,
  feedbackMessage,
  pickPromptKind,
  regionCount,
  regionKind,
  type FractionKind,
} from './namingLogic';

describe('regionCount', () => {
  it('returns 2 for halves-only (L1)', () => {
    expect(regionCount(['half'])).toBe(2);
  });
  it('returns 4 for quarters-only (L2)', () => {
    expect(regionCount(['quarter'])).toBe(4);
  });
  it('returns 5 for mixed: 1 half + 4 quarters (L3)', () => {
    expect(regionCount(['half', 'quarter'])).toBe(5);
  });
});

describe('regionKind', () => {
  it('halves-only: every region is a half', () => {
    expect(regionKind(0, ['half'])).toBe('half');
    expect(regionKind(1, ['half'])).toBe('half');
  });
  it('quarters-only: every region is a quarter', () => {
    expect(regionKind(0, ['quarter'])).toBe('quarter');
    expect(regionKind(3, ['quarter'])).toBe('quarter');
  });
  it('mixed: the half-tile is centered at index 2; the rest are quarters', () => {
    expect(regionKind(0, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(1, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(2, ['half', 'quarter'])).toBe('half');
    expect(regionKind(3, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(4, ['half', 'quarter'])).toBe('quarter');
  });
});

describe('pickPromptKind', () => {
  it('halves-only always prompts half', () => {
    expect(pickPromptKind(['half'], [])).toBe('half');
    expect(pickPromptKind(['half'], [0])).toBe('half');
  });
  it('quarters-only always prompts quarter', () => {
    expect(pickPromptKind(['quarter'], [])).toBe('quarter');
  });
  it('mixed: first prompt is half (no tapped indices yet)', () => {
    expect(pickPromptKind(['half', 'quarter'], [])).toBe('half');
  });
  it('mixed: still prompts half if only quarters (not the centered half) are tapped', () => {
    expect(pickPromptKind(['half', 'quarter'], [0])).toBe('half');
    expect(pickPromptKind(['half', 'quarter'], [0, 1])).toBe('half');
  });
  it('mixed: once the centered half (idx 2) is tapped, prompt switches to quarter', () => {
    expect(pickPromptKind(['half', 'quarter'], [2])).toBe('quarter');
    expect(pickPromptKind(['half', 'quarter'], [2, 0, 1])).toBe('quarter');
  });
});

describe('evalTap', () => {
  it('correct tap on a fresh index: accepted + index appended', () => {
    expect(evalTap('half', 'half', 0, [])).toEqual({
      accepted: true,
      nextTapped: [0],
    });
    expect(evalTap('quarter', 'quarter', 3, [1])).toEqual({
      accepted: true,
      nextTapped: [1, 3],
    });
  });
  it('wrong-kind tap: silently rejected, tapped unchanged', () => {
    expect(evalTap('half', 'quarter', 2, [0])).toEqual({
      accepted: false,
      nextTapped: [0],
    });
    expect(evalTap('quarter', 'half', 0, [])).toEqual({
      accepted: false,
      nextTapped: [],
    });
  });
  it('repeat tap of an already-tapped index: silently rejected', () => {
    expect(evalTap('quarter', 'quarter', 1, [1, 2])).toEqual({
      accepted: false,
      nextTapped: [1, 2],
    });
  });
});

describe('feedbackMessage', () => {
  it('correct tap on half-prompt: success tone + names the half', () => {
    const fb = feedbackMessage('half', 'half');
    expect(fb.tone).toBe('success');
    expect(fb.text).toMatch(/half/);
  });
  it('correct tap on quarter-prompt: success tone + names the quarter', () => {
    const fb = feedbackMessage('quarter', 'quarter');
    expect(fb.tone).toBe('success');
    expect(fb.text).toMatch(/quarter/);
  });
  it('wrong tap on half-prompt: observation, names tapped kind, points back', () => {
    const fb = feedbackMessage('half', 'quarter');
    expect(fb.tone).toBe('observation');
    expect(fb.text).toMatch(/quarter/);
    expect(fb.text).toMatch(/find the half/);
  });
  it('wrong tap on quarter-prompt: observation, names tapped kind, points back', () => {
    const fb = feedbackMessage('quarter', 'half');
    expect(fb.tone).toBe('observation');
    expect(fb.text).toMatch(/half/);
    expect(fb.text).toMatch(/find the quarter/);
  });
  it('never uses the word "wrong" — observational, not corrective', () => {
    const fb = feedbackMessage('half', 'quarter');
    expect(fb.text.toLowerCase()).not.toMatch(/\bwrong\b/);
  });
});

describe('type contract', () => {
  it('FractionKind admits only half and quarter', () => {
    const halves: FractionKind[] = ['half'];
    const quarters: FractionKind[] = ['quarter'];
    expect(halves[0]).toBe('half');
    expect(quarters[0]).toBe('quarter');
  });
});
