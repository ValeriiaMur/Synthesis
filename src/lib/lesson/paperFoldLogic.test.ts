import { describe, it, expect } from 'vitest';
import {
  FOLDS_BY_COUNT,
  countFromFolds,
  specFor,
  cornerStyleFor,
  dropStyleFor,
  dragProgressFor,
  nextFold,
  partsCountFor,
  partFracFor,
  foldHint,
} from './paperFoldLogic';

/**
 * Pure folding logic extracted out of PaperFold.tsx. These functions own
 * the contract the component renders against: how many folds a stored
 * value represents, which corner is draggable at each step, the live
 * drag-progress math, and the hint copy. The component is now render-only,
 * so this is where the behaviour is pinned.
 */
describe('countFromFolds', () => {
  it('treats undefined as zero folds', () => {
    expect(countFromFolds(undefined)).toBe(0);
  });

  it('maps an empty list to 0', () => {
    expect(countFromFolds([])).toBe(0);
  });

  it('maps one fold to 1', () => {
    expect(countFromFolds(['horizontal'])).toBe(1);
  });

  it('maps two folds to 2', () => {
    expect(countFromFolds(['horizontal', 'vertical'])).toBe(2);
  });

  it('clamps three-or-more folds to 2', () => {
    expect(countFromFolds(['horizontal', 'vertical', 'horizontal'])).toBe(2);
  });
});

describe('FOLDS_BY_COUNT', () => {
  it('round-trips each fold count back to an ordered direction list', () => {
    expect(FOLDS_BY_COUNT[0]).toEqual([]);
    expect(FOLDS_BY_COUNT[1]).toEqual(['horizontal']);
    expect(FOLDS_BY_COUNT[2]).toEqual(['horizontal', 'vertical']);
  });
});

describe('specFor', () => {
  it('returns the horizontal-fold corner at step 0', () => {
    const spec = specFor(0);
    expect(spec).not.toBeNull();
    expect(spec?.direction).toBe('h');
    expect(spec?.arrow).toBe('↑');
    expect(spec?.from).toBe('br');
  });

  it('returns the vertical-fold corner at step 1', () => {
    const spec = specFor(1);
    expect(spec?.direction).toBe('v');
    expect(spec?.arrow).toBe('←');
    expect(spec?.from).toBe('tr');
  });

  it('returns null once both folds are done', () => {
    expect(specFor(2)).toBeNull();
  });
});

describe('cornerStyleFor', () => {
  it('positions the bottom-right corner handle', () => {
    const spec = specFor(0);
    expect(spec).not.toBeNull();
    if (spec) {
      expect(cornerStyleFor(spec)).toEqual({
        left: 'calc(100% - 26px)',
        top: 'calc(100% - 26px)',
      });
    }
  });

  it('positions the top-right corner handle', () => {
    const spec = specFor(1);
    if (spec) {
      expect(cornerStyleFor(spec)).toEqual({
        left: 'calc(100% - 26px)',
        top: '-22px',
      });
    }
  });
});

describe('dropStyleFor', () => {
  it('drops the top-right quadrant at step 0', () => {
    expect(dropStyleFor(0)).toEqual({
      left: '50%',
      top: '0%',
      width: '50%',
      height: '50%',
    });
  });

  it('drops the top-left quadrant at step 1', () => {
    expect(dropStyleFor(1)).toEqual({
      left: '0%',
      top: '0%',
      width: '50%',
      height: '50%',
    });
  });

  it('has no drop zone once folding is complete', () => {
    expect(dropStyleFor(2)).toBeNull();
  });
});

describe('dragProgressFor', () => {
  const travel = {
    startX: 200,
    startY: 200,
    x: 200,
    y: 200,
    wsWidth: 100,
    wsHeight: 100,
  };

  it('is 0 when the pointer has not moved', () => {
    expect(dragProgressFor('h', travel)).toBe(0);
  });

  it('measures upward travel for a horizontal fold', () => {
    expect(dragProgressFor('h', { ...travel, y: 150 })).toBeCloseTo(0.5);
  });

  it('measures leftward travel for a vertical fold', () => {
    expect(dragProgressFor('v', { ...travel, x: 175 })).toBeCloseTo(0.25);
  });

  it('clamps below 0 (pointer moved the wrong way)', () => {
    expect(dragProgressFor('h', { ...travel, y: 260 })).toBe(0);
  });

  it('clamps above 1 (pointer overshot)', () => {
    expect(dragProgressFor('h', { ...travel, y: 0 })).toBe(1);
  });
});

describe('nextFold', () => {
  it('advances 0 -> 1 -> 2', () => {
    expect(nextFold(0)).toBe(1);
    expect(nextFold(1)).toBe(2);
  });

  it('never advances past 2', () => {
    expect(nextFold(2)).toBe(2);
  });
});

describe('partsCountFor / partFracFor', () => {
  it('describes a single whole at 0 folds', () => {
    expect(partsCountFor(0)).toBe(1);
    expect(partFracFor(0)).toBe('1');
  });

  it('describes two halves at 1 fold', () => {
    expect(partsCountFor(1)).toBe(2);
    expect(partFracFor(1)).toBe('½');
  });

  it('describes four quarters at 2 folds', () => {
    expect(partsCountFor(2)).toBe(4);
    expect(partFracFor(2)).toBe('¼');
  });
});

describe('foldHint', () => {
  const base = {
    dragging: false,
    dragProgress: 0,
    justFolded: false,
    folds: 0 as const,
    cornerHint: 'corner copy',
  };

  it('coaches "pull it across" early in a drag', () => {
    expect(foldHint({ ...base, dragging: true, dragProgress: 0.1 })).toBe(
      'Pull it across…',
    );
  });

  it('coaches "almost there" mid-drag', () => {
    expect(foldHint({ ...base, dragging: true, dragProgress: 0.5 })).toBe(
      'Almost there…',
    );
  });

  it('coaches "release" near the drop threshold', () => {
    expect(foldHint({ ...base, dragging: true, dragProgress: 0.8 })).toBe(
      'Release to crease the paper.',
    );
  });

  it('celebrates the first fold just after committing', () => {
    expect(
      foldHint({ ...base, justFolded: true, folds: 1 }),
    ).toMatch(/^yes — one fold/);
  });

  it('celebrates the second fold just after committing', () => {
    expect(
      foldHint({ ...base, justFolded: true, folds: 2 }),
    ).toMatch(/^yes — two folds/);
  });

  it('falls back to the corner hint at idle step 0', () => {
    expect(foldHint(base)).toBe('corner copy');
  });

  it('returns an empty string at idle step 0 with no corner hint', () => {
    expect(foldHint({ ...base, cornerHint: undefined })).toBe('');
  });

  it('describes the resting one-fold state', () => {
    expect(foldHint({ ...base, folds: 1 })).toMatch(/two halves/);
  });

  it('describes the resting two-fold state', () => {
    expect(foldHint({ ...base, folds: 2 })).toMatch(/four quarters/);
  });
});
