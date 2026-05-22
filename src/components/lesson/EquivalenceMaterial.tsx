'use client';

import { DndContext, pointerWithin } from '@dnd-kit/core';
import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';
import {
  QUARTER_ID_PREFIX,
  useEquivalenceMaterial,
} from '@/lib/lesson/useEquivalenceMaterial';
import { TrayDroppable } from './equivalence/TrayDroppable';
import { QuarterDraggable } from './equivalence/QuarterDraggable';
import { HammerDraggable } from './equivalence/HammerDraggable';

export type EquivalenceMaterialProps = {
  readonly config: EquivalenceConfig;
  readonly value: EquivalenceState | undefined;
  readonly onChange: (state: EquivalenceState) => void;
  readonly disabled?: boolean;
};

/**
 * Lesson 05 — "fill the whole, then break it."
 *
 * The kid DRAGS quarters from the pile onto the bar; each drop fills the
 * next empty slot. Four placed = the whole fills (data-covered) and the
 * beat completes. Once filled, a hammer appears; dragging it onto the bar
 * breaks the chocolate (placedCount → 0, pile refills). Enter/Space on a
 * focused piece is the keyboard fallback (and the test path).
 *
 * Render-only: the place/break actions, @dnd-kit sensors, and drop routing
 * live in `useEquivalenceMaterial`; the draggables are their own files.
 */
export function EquivalenceMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: EquivalenceMaterialProps) {
  const {
    placed,
    target,
    covered,
    pileRemaining,
    status,
    help,
    justBroken,
    sensors,
    handleDragEnd,
    placeOne,
    breakIt,
  } = useEquivalenceMaterial({ config, value, onChange, disabled });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <div className="equivalence-stage">
        <div className="equivalence-material" data-covered={covered || undefined}>
          <TrayDroppable
            target={target}
            placed={placed}
            covered={covered}
            justBroken={justBroken}
          />

          <div className="equivalence-rail">
            {!covered && (
              <div className="equivalence-pile" aria-label="pile of quarters">
                {Array.from({ length: pileRemaining }).map((_, i) => (
                  <QuarterDraggable
                    key={i}
                    id={`${QUARTER_ID_PREFIX}${i}`}
                    disabled={disabled}
                    onKeyboardPlace={placeOne}
                  />
                ))}
              </div>
            )}
            {covered && (
              <HammerDraggable disabled={disabled} onKeyboardBreak={breakIt} />
            )}
          </div>
        </div>

        <div
          className={`equivalence-status${covered ? ' is-covered' : ''}`}
          role="status"
          aria-live="polite"
          data-testid="equivalence-status"
        >
          {status}
        </div>
        <div className="equivalence-help" data-testid="equivalence-help">
          {help}
        </div>
      </div>
    </DndContext>
  );
}
