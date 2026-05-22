import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { EquivalenceConfig, EquivalenceState } from './types';
import { coverStatusText, isCovered, placeQuarter } from './coverLogic';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';

/** Unit-based sizing — one quarter = one UNIT_PX square, four of them
 *  side-by-side make the whole bar (matches the WholeMaterial). */
export const UNIT_PX = 80;
export const HAMMER_PX = 56;
export const PILE_INITIAL = 4;

export const HAMMER_ID = 'equivalence-hammer';
export const TRAY_ID = 'equivalence-tray';
export const QUARTER_ID_PREFIX = 'equivalence-quarter-';

export type UseEquivalenceMaterialArgs = {
  readonly config: EquivalenceConfig;
  readonly value: EquivalenceState | undefined;
  readonly onChange: (state: EquivalenceState) => void;
  readonly disabled: boolean;
};

export type EquivalenceMaterialView = {
  readonly placed: number;
  readonly target: number;
  readonly covered: boolean;
  readonly pileRemaining: number;
  readonly status: string;
  readonly help: string;
  readonly justBroken: boolean;
  readonly sensors: ReturnType<typeof useSensors>;
  readonly handleDragEnd: (event: DragEndEvent) => void;
  readonly placeOne: () => void;
  readonly breakIt: () => void;
};

/**
 * Owns the EquivalenceMaterial interaction: place-a-quarter / break-the-bar
 * actions, the post-break flash, the @dnd-kit sensors, and drop routing.
 * Pure rules live in `coverLogic`; this hook is the stateful shell so
 * `EquivalenceMaterial.tsx` and its draggable sub-components only render.
 */
export function useEquivalenceMaterial({
  config,
  value,
  onChange,
  disabled,
}: UseEquivalenceMaterialArgs): EquivalenceMaterialView {
  const placed = value?.placedCount ?? 0;
  const target = config.targetCount;
  const covered = isCovered({ placedCount: placed }, target);
  const pileRemaining = Math.max(0, PILE_INITIAL - placed);
  const status = coverStatusText({ placedCount: placed }, target);

  const [justBroken, setJustBroken] = useState(false);
  const justBrokenTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (justBrokenTimerRef.current !== null) {
        window.clearTimeout(justBrokenTimerRef.current);
      }
    },
    [],
  );

  const placeOne = useCallback(() => {
    if (disabled) return;
    const result = placeQuarter({ placedCount: placed }, target);
    if (!result.accepted) return;
    getSfxPlayer().play('chocolateSnap');
    onChange({ kind: 'equivalence', placedCount: result.newState.placedCount });
  }, [disabled, placed, target, onChange]);

  const breakIt = useCallback(() => {
    if (disabled) return;
    if (placed <= 0) return;
    getSfxPlayer().play('hammerBreak');
    onChange({ kind: 'equivalence', placedCount: 0 });
    if (justBrokenTimerRef.current !== null) {
      window.clearTimeout(justBrokenTimerRef.current);
    }
    setJustBroken(true);
    justBrokenTimerRef.current = window.setTimeout(() => {
      setJustBroken(false);
      justBrokenTimerRef.current = null;
    }, 900);
  }, [disabled, placed, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.over?.id !== TRAY_ID) return;
      if (String(event.active.id) === HAMMER_ID) breakIt();
      else placeOne();
    },
    [breakIt, placeOne],
  );

  const help = covered
    ? 'drag the hammer onto the bar to break it'
    : 'drag a quarter onto the bar →';

  return {
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
  };
}
