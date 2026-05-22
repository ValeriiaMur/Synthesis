import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { useLessonStateMachine } from './useLessonStateMachine';
import type { Beat, ManipulativeState } from './types';
import type { PersistedLessonState } from './lessonPersistence';

/**
 * The lesson "brain": it owns activeIdx + the done set, and exposes a single
 * action (handleManip) that records a manipulative's state and — only when
 * that completes the beat for the first time — advances to the next beat
 * and speaks its prose. These tests pin advancement, idempotency, the
 * end-of-lesson clamp, and resume-from-snapshot.
 */

const BEATS: readonly Beat[] = [
  {
    id: 'whole_intro',
    phase: 'period_1_introduce',
    kindLabel: 'whole',
    prose: 'This is one {y}whole{/y}.',
    manipulative: { kind: 'whole' },
  },
  {
    id: 'recall_name',
    phase: 'period_3_recall',
    kindLabel: 'recall',
    prose: 'What is {y}this{/y}?',
    manipulative: { kind: 'recall', fraction: 'half' },
  },
  {
    id: 'equiv_half_two_quarters',
    phase: 'period_2_recognize',
    kindLabel: 'equivalence',
    prose: 'Fill the whole.',
    manipulative: { kind: 'equivalence', targetCount: 2 },
  },
];

const cellRefs = (): readonly RefObject<HTMLDivElement | null>[] =>
  BEATS.map(() => createRef<HTMLDivElement>());

const wholeDone: ManipulativeState = { kind: 'whole', split: true };
const wholeNotDone: ManipulativeState = { kind: 'whole', split: false };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

function setup(initialState: PersistedLessonState | null = null) {
  const speakAri = vi.fn();
  const view = renderHook(() =>
    useLessonStateMachine({
      beats: BEATS,
      initialState,
      speakAri,
      cellRefs: cellRefs(),
    }),
  );
  return { speakAri, ...view };
}

describe('useLessonStateMachine', () => {
  it('starts at the first beat with nothing done', () => {
    const { result } = setup();
    expect(result.current.activeIdx).toBe(0);
    expect(result.current.doneSet.size).toBe(0);
    expect(result.current.manipStates).toEqual({});
  });

  it('records a manipulative state without advancing when the beat is not complete', () => {
    const { result, speakAri } = setup();
    act(() => result.current.handleManip(0, wholeNotDone));
    expect(result.current.manipStates.whole_intro).toEqual(wholeNotDone);
    expect(result.current.doneSet.has('whole_intro')).toBe(false);
    expect(result.current.activeIdx).toBe(0);
    expect(speakAri).not.toHaveBeenCalled();
  });

  it('marks the beat done and advances, speaking the next beat (markup stripped)', () => {
    const { result, speakAri } = setup();
    act(() => result.current.handleManip(0, wholeDone));
    expect(result.current.doneSet.has('whole_intro')).toBe(true);
    expect(result.current.activeIdx).toBe(1);
    expect(speakAri).toHaveBeenCalledTimes(1);
    expect(speakAri).toHaveBeenCalledWith('What is this?');
  });

  it('does not advance again when an already-completed beat is re-completed', () => {
    const { result, speakAri } = setup();
    act(() => result.current.handleManip(0, wholeDone));
    speakAri.mockClear();
    act(() => result.current.handleManip(0, wholeDone));
    expect(result.current.activeIdx).toBe(1);
    expect(speakAri).not.toHaveBeenCalled();
  });

  it('does not advance past the final beat', () => {
    const { result, speakAri } = setup();
    act(() =>
      result.current.handleManip(2, { kind: 'equivalence', placedCount: 2 }),
    );
    expect(result.current.doneSet.has('equiv_half_two_quarters')).toBe(true);
    expect(result.current.activeIdx).toBe(0);
    expect(speakAri).not.toHaveBeenCalled();
  });

  it('accumulates manipulative states across beats', () => {
    const { result } = setup();
    act(() => result.current.handleManip(0, wholeDone));
    act(() =>
      result.current.handleManip(1, { kind: 'recall', revealed: true }),
    );
    expect(result.current.manipStates.whole_intro).toEqual(wholeDone);
    expect(result.current.manipStates.recall_name).toEqual({
      kind: 'recall',
      revealed: true,
    });
    expect(result.current.doneSet.size).toBe(2);
    expect(result.current.activeIdx).toBe(2);
  });

  it('rehydrates activeIdx, the done set, and manip states from a snapshot', () => {
    const snapshot: PersistedLessonState = {
      schemaVersion: 7,
      lessonId: 'fractions-naming-v1',
      activeIdx: 1,
      doneIds: ['whole_intro'],
      manipStates: { whole_intro: wholeDone },
    };
    const { result } = setup(snapshot);
    expect(result.current.activeIdx).toBe(1);
    expect(result.current.doneSet.has('whole_intro')).toBe(true);
    expect(result.current.manipStates.whole_intro).toEqual(wholeDone);
  });

  it('scrolls the next beat into view after the advance delay', () => {
    const scrollSpy = vi.fn();
    const refs: readonly RefObject<HTMLDivElement | null>[] = BEATS.map(() => {
      const el = document.createElement('div');
      el.scrollIntoView = scrollSpy;
      return { current: el };
    });
    const speakAri = vi.fn();
    const { result } = renderHook(() =>
      useLessonStateMachine({
        beats: BEATS,
        initialState: null,
        speakAri,
        cellRefs: refs,
      }),
    );
    act(() => result.current.handleManip(0, wholeDone));
    expect(scrollSpy).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(250));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });
});
