import type { CSSProperties } from 'react';

/**
 * Pure folding logic for the PaperFold manipulative. Extracted out of the
 * component so the contract is unit-testable without rendering: how a
 * stored fold list maps to a step, which corner is grabbable at each step,
 * the live drag-progress math, and the observational hint copy.
 *
 * Contract preserved from the component: a fold is an ordered subset of
 * `['horizontal', 'vertical']`; the `paper_fold_final` beat completes on
 * `folds.length >= 2`.
 */

export type FoldDirection = 'horizontal' | 'vertical';
export type FoldCount = 0 | 1 | 2;

export type CornerSpec = {
  readonly from: 'tl' | 'tr' | 'bl' | 'br';
  readonly to: 'tl' | 'tr' | 'bl' | 'br';
  readonly direction: 'h' | 'v';
  /** Arrow glyph rendered on the corner handle. */
  readonly arrow: '↑' | '←';
  /** Hint copy shown while idle on this fold step. */
  readonly hint: string;
};

/** Pointer travel captured at pointerdown plus the live cursor position.
 *  Workspace dimensions are snapshotted so progress never reads the DOM. */
export type DragTravel = {
  readonly startX: number;
  readonly startY: number;
  readonly x: number;
  readonly y: number;
  readonly wsWidth: number;
  readonly wsHeight: number;
};

export type FoldHintInput = {
  readonly dragging: boolean;
  readonly dragProgress: number;
  readonly justFolded: boolean;
  readonly folds: FoldCount;
  readonly cornerHint: string | undefined;
};

export const FOLDS_BY_COUNT: Record<FoldCount, readonly FoldDirection[]> = {
  0: [],
  1: ['horizontal'],
  2: ['horizontal', 'vertical'],
};

export function countFromFolds(
  folds: readonly FoldDirection[] | undefined,
): FoldCount {
  if (!folds) return 0;
  if (folds.length >= 2) return 2;
  if (folds.length >= 1) return 1;
  return 0;
}

export function specFor(folds: FoldCount): CornerSpec | null {
  if (folds === 0) {
    return {
      from: 'br',
      to: 'tr',
      direction: 'h',
      arrow: '↑',
      hint: 'Drag this corner up to the top — crease the paper across the middle.',
    };
  }
  if (folds === 1) {
    return {
      from: 'tr',
      to: 'tl',
      direction: 'v',
      arrow: '←',
      hint: 'Now drag this corner left — crease the paper the other way.',
    };
  }
  return null;
}

export function cornerStyleFor(spec: CornerSpec): CSSProperties {
  if (spec.from === 'br')
    return { left: 'calc(100% - 26px)', top: 'calc(100% - 26px)' };
  if (spec.from === 'tr') return { left: 'calc(100% - 26px)', top: '-22px' };
  if (spec.from === 'tl') return { left: '-22px', top: '-22px' };
  return { left: '-22px', top: 'calc(100% - 26px)' };
}

export function dropStyleFor(folds: FoldCount): CSSProperties | null {
  if (folds === 0) return { left: '50%', top: '0%', width: '50%', height: '50%' };
  if (folds === 1) return { left: '0%', top: '0%', width: '50%', height: '50%' };
  return null;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Live fold progress (0..1): upward travel for a horizontal fold,
 *  leftward travel for a vertical one, normalised by workspace size. */
export function dragProgressFor(
  direction: 'h' | 'v',
  travel: DragTravel,
): number {
  if (direction === 'h') {
    return clamp01((travel.startY - travel.y) / travel.wsHeight);
  }
  return clamp01((travel.startX - travel.x) / travel.wsWidth);
}

/** Advance one fold, clamped at the two-fold maximum. */
export function nextFold(f: FoldCount): FoldCount {
  return f >= 2 ? f : ((f + 1) as FoldCount);
}

export function partsCountFor(folds: FoldCount): number {
  return folds === 0 ? 1 : folds === 1 ? 2 : 4;
}

export function partFracFor(folds: FoldCount): string {
  return folds === 0 ? '1' : folds === 1 ? '½' : '¼';
}

export function foldHint({
  dragging,
  dragProgress,
  justFolded,
  folds,
  cornerHint,
}: FoldHintInput): string {
  if (dragging) {
    if (dragProgress < 0.3) return 'Pull it across…';
    if (dragProgress < 0.7) return 'Almost there…';
    return 'Release to crease the paper.';
  }
  if (justFolded && folds === 1)
    return 'yes — one fold. two halves, one on top of the other.';
  if (justFolded && folds === 2)
    return 'yes — two folds. four quarters, and two of them cover one half.';
  if (folds === 0) return cornerHint ?? '';
  if (folds === 1)
    return 'One fold. The paper is now in two halves — one half on top of the other.';
  return 'Two folds. The paper is in four quarters — and two of them cover one half.';
}
