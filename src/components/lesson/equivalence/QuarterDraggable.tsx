'use client';

import { type CSSProperties, type KeyboardEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { UNIT_PX } from '@/lib/lesson/useEquivalenceMaterial';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

export type QuarterDraggableProps = {
  readonly id: string;
  readonly disabled: boolean;
  readonly onKeyboardPlace: () => void;
};

/** A draggable pile quarter. The live drag transform is applied to the
 *  button so it glides under the finger. Enter/Space places one (keyboard
 *  fallback + tests). A plain tap does nothing — placement is by drag. */
export function QuarterDraggable({
  id,
  disabled,
  onKeyboardPlace,
}: QuarterDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });
  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`equivalence-quarter${isDragging ? ' is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onKeyboardPlace();
      }}
      disabled={disabled}
      aria-label="drag a quarter onto the bar"
    >
      <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
    </button>
  );
}
