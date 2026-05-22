'use client';

import { useDroppable } from '@dnd-kit/core';
import { TRAY_ID, UNIT_PX } from '@/lib/lesson/useEquivalenceMaterial';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

export type TrayDroppableProps = {
  readonly target: number;
  readonly placed: number;
  readonly covered: boolean;
  readonly justBroken: boolean;
};

/** Tray = the bar being filled; also the drop target for quarters + the
 *  hammer. */
export function TrayDroppable({
  target,
  placed,
  covered,
  justBroken,
}: TrayDroppableProps) {
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
