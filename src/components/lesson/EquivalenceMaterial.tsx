'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';
import { coverStatusText, isCovered, placeQuarter } from '@/lib/lesson/coverLogic';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';

/** Unit-based sizing — one quarter = one UNIT_PX square, four of them
 *  side-by-side make the whole bar (matches the WholeMaterial). */
const UNIT_PX = 80;
const PILE_INITIAL = 4;
/** Hammer icon (inner image) size, and the draggable button box size.
 *  The drag ghost MUST match the button box (72) — dnd-kit positions the
 *  overlay using the source element's rect, so a smaller ghost made the
 *  hammer drift away from the finger ("not matching"). */
const HAMMER_PX = 56;
const HAMMER_BTN_PX = 72;

const HAMMER_ID = 'equivalence-hammer';
const TRAY_ID = 'equivalence-tray';

export type EquivalenceMaterialProps = {
  readonly config: EquivalenceConfig;
  readonly value: EquivalenceState | undefined;
  readonly onChange: (state: EquivalenceState) => void;
  readonly disabled?: boolean;
};

/**
 * Lesson 05 — "fill the whole, then break it."
 *
 * Tray: same width as the WholeMaterial bar (4 quarter-units, no
 * frame). The kid taps quarters from the pile on the right; each tap
 * drops a quarter into the next empty slot. Four placed = the whole
 * fills (data-covered=true → glow), and the beat completes.
 *
 * Once filled, a small square hammer icon appears next to the tray.
 * Drag the hammer onto the bar → the chocolate "breaks" (placedCount
 * resets to 0, pile refills). The kid can fill-and-break repeatedly
 * to explore the equivalence; the beat stays done once first hit.
 *
 * Drag-and-drop is wired through @dnd-kit/core (Mouse + Touch sensors,
 * pointerWithin collision). Keyboard activation is handled manually so a
 * single Enter/Space on the focused hammer breaks the bar (matching the
 * test surface and giving non-pointer users a path).
 */
export function EquivalenceMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: EquivalenceMaterialProps) {
  const placed = value?.placedCount ?? 0;
  const target = config.targetCount;
  const covered = isCovered({ placedCount: placed }, target);
  const pileRemaining = Math.max(0, PILE_INITIAL - placed);
  const status = coverStatusText({ placedCount: placed }, target);

  const [isDragging, setIsDragging] = useState(false);
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

  const handleTap = (): void => {
    if (disabled) return;
    getSfxPlayer().play('chocolateSnap');
    const result = placeQuarter({ placedCount: placed }, target);
    if (!result.accepted) return;
    onChange({ kind: 'equivalence', placedCount: result.newState.placedCount });
  };

  const breakIt = useCallback(() => {
    if (disabled) return;
    if (placed <= 0) return;
    getSfxPlayer().play('chocolateSnap');
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

  // Tablet-first sensor setup:
  //  - TouchSensor with a short press-delay + movement tolerance so a
  //    finger drag starts cleanly without fighting page scroll, and a
  //    quick tap doesn't accidentally pick the hammer up.
  //  - MouseSensor with a small activation distance for desktop.
  // Combined with `touch-action: none` on the hammer (globals.css), this
  // is the standard dnd-kit recipe for reliable touch dragging.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      // `pointerWithin` collision detection means `over` is set whenever
      // the finger/cursor is inside the tray on release — intuitive for
      // "bring the hammer to the chocolate". Fall back to breaking on any
      // release while covered would be too loose, so we require the tray.
      if (event.over?.id === TRAY_ID) breakIt();
    },
    [breakIt],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setIsDragging(false)}
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
                  <button
                    key={i}
                    type="button"
                    className="equivalence-quarter"
                    aria-label="place quarter on the whole"
                    onClick={handleTap}
                    disabled={disabled}
                  >
                    <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
                  </button>
                ))}
              </div>
            )}
            {covered && (
              <HammerDraggable
                disabled={disabled}
                isDragging={isDragging}
                onKeyboardBreak={breakIt}
              />
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
      </div>

      {/* Drag ghost — dnd-kit handles cursor positioning; we only style
          the contents to read as a tilted hammer card. */}
      <DragOverlay dropAnimation={null}>
        {isDragging ? (
          <span
            className="equivalence-hammer-ghost"
            aria-hidden
            style={{ width: HAMMER_BTN_PX, height: HAMMER_BTN_PX }}
          >
            <HammerImage />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Tray = the bar being filled; also the drop target for the hammer. */
function TrayDroppable({
  target,
  placed,
  covered,
  justBroken,
}: {
  readonly target: number;
  readonly placed: number;
  readonly covered: boolean;
  readonly justBroken: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_ID });
  return (
    <div
      ref={setNodeRef}
      className={`equivalence-whole${justBroken ? ' is-breaking' : ''}`}
      data-testid="equivalence-whole"
      aria-label="the whole"
      data-covered={covered || undefined}
      data-over={isOver || undefined}
    >
      {Array.from({ length: target }).map((_, i) => (
        <div
          key={i}
          className="equivalence-slot"
          data-testid="equivalence-slot"
          data-filled={placed > i || undefined}
        >
          {placed > i && (
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
          )}
        </div>
      ))}
    </div>
  );
}

/** Hammer button — dnd-kit pointer drag + manual Enter/Space keyboard
 *  fallback (single press → break, no two-step pick-up dance). */
function HammerDraggable({
  disabled,
  isDragging,
  onKeyboardBreak,
}: {
  readonly disabled: boolean;
  readonly isDragging: boolean;
  readonly onKeyboardBreak: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: HAMMER_ID,
    disabled,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`equivalence-hammer${isDragging ? ' is-dragging' : ''}`}
      {...listeners}
      {...attributes}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onKeyboardBreak();
      }}
      disabled={disabled}
      aria-label="drag the hammer onto the bar to break it"
      style={isDragging ? { visibility: 'hidden' } : undefined}
    >
      <HammerImage />
    </button>
  );
}

function HammerImage() {
  return (
    <Image
      src="/images/hammer.svg"
      alt=""
      width={HAMMER_PX}
      height={HAMMER_PX}
      draggable={false}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    />
  );
}
