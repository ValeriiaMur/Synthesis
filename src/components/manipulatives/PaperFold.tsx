'use client';

import type { PaperState } from '@/lib/lesson/types';
import { usePaperFold } from '@/lib/lesson/usePaperFold';
import { Paper } from './paper/Paper';
import { QuadLabels } from './paper/QuadLabels';
import { WholeNumber } from './paper/WholeNumber';

export type PaperFoldProps = {
  readonly value?: PaperState;
  readonly onChange?: (state: PaperState) => void;
  readonly disabled?: boolean;
};

/**
 * PaperFold — drag-and-drop folding of a 4-quadrant star-paper square.
 * The student grabs a corner and pulls it across the paper; the paper
 * folds in real time (CSS 3D + sin-curve Z-lift). Past the halfway point
 * on release, the fold commits.
 *
 * Keyboard fallback: pressing Enter or Space on the corner handle advances
 * one fold without dragging (for non-pointer users + tests).
 *
 * All state, drag math, effects, and copy live in `usePaperFold` +
 * `paperFoldLogic`; this component only renders. The external contract is
 * unchanged: `onChange` fires `{ kind: 'paper', folds }` where `folds` is
 * an ordered subset of `['horizontal', 'vertical']`, and the
 * `paper_fold_final` beat completes on `folds.length >= 2`.
 */
export function PaperFold({ value, onChange, disabled = false }: PaperFoldProps) {
  const {
    workspaceRef,
    folds,
    drag,
    dragProgress,
    dragDirection,
    cornerSpec,
    justFolded,
    hint,
    partsCount,
    partFrac,
    dropStyle,
    cornerStyle,
    dropActive,
    onPointerDown,
    onCornerKeyDown,
    unfold,
    reset,
  } = usePaperFold({ value, onChange, disabled });

  return (
    <div className="paper-stage">
      <div className="paper-workspace" ref={workspaceRef}>
        <Paper
          folds={folds}
          dragProgress={dragProgress}
          dragDirection={dragDirection}
        />

        {/* Fraction labels live OUTSIDE the 3D paper so they sit flat on
            top of every part (a label inside the preserve-3d context gets
            hidden behind a folded/lifted quadrant). Hidden mid-drag so
            they don't fight the fold animation. */}
        {!drag && <QuadLabels folds={folds} />}

        <WholeNumber visible={folds === 0 && dragProgress < 0.05} />

        {dropStyle && cornerSpec && (
          <div
            className={`paper-drop-zone${dropActive ? ' is-hover' : ''}`}
            style={dropStyle}
            aria-hidden
          >
            drop here
          </div>
        )}

        {cornerSpec && !drag && (
          <button
            type="button"
            className="paper-corner"
            onPointerDown={onPointerDown}
            onKeyDown={onCornerKeyDown}
            disabled={disabled}
            style={cornerStyle ?? undefined}
            aria-label="Drag this corner to fold the paper"
          >
            {cornerSpec.arrow}
          </button>
        )}

        {drag && cornerSpec && (
          <div
            className="paper-corner is-ghost"
            aria-hidden
            style={{
              position: 'fixed',
              left: drag.x - drag.gx,
              top: drag.y - drag.gy,
              width: drag.w,
              height: drag.h,
              pointerEvents: 'none',
              transform: `scale(1.08) rotate(${cornerSpec.direction === 'h' ? -3 : 3}deg)`,
              boxShadow: '0 14px 28px rgba(0,0,0,0.55)',
              zIndex: 1000,
            }}
          >
            {cornerSpec.arrow}
          </div>
        )}

        <div
          className={`paper-completion-glow${folds === 2 ? ' is-on' : ''}`}
          aria-hidden
        />
      </div>

      <div className="paper-panel">
        <div className="paper-panel-meta">
          <span className="emph">
            {partsCount} {partsCount === 1 ? 'whole' : 'parts'}
          </span>
          {' · '}
          <span>each {partFrac}</span>
        </div>
        <button
          type="button"
          className="paper-btn ghost"
          onClick={unfold}
          disabled={disabled || folds === 0}
        >
          ↩ unfold
        </button>
        <button
          type="button"
          className="paper-btn"
          onClick={reset}
          disabled={disabled || folds === 0}
        >
          start over
        </button>
      </div>

      <div
        className={`paper-hint${justFolded ? ' is-success' : ''}`}
        role="status"
        aria-live="polite"
      >
        {hint}
      </div>
    </div>
  );
}
