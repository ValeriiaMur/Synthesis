'use client';

import { type CSSProperties, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { HAMMER_ID, HAMMER_PX } from '@/lib/lesson/useEquivalenceMaterial';

export type HammerDraggableProps = {
  readonly disabled: boolean;
  readonly onKeyboardBreak: () => void;
};

/**
 * Hammer button — same smooth single-draggable pattern as the quarters.
 * Enter/Space breaks the bar without a drag (keyboard fallback + tests).
 */
export function HammerDraggable({
  disabled,
  onKeyboardBreak,
}: HammerDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: HAMMER_ID, disabled });
  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`equivalence-hammer${isDragging ? ' is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onKeyboardBreak();
      }}
      disabled={disabled}
      aria-label="drag the hammer onto the bar to break it"
    >
      <Image
        src="/images/hammer.svg"
        alt=""
        width={HAMMER_PX}
        height={HAMMER_PX}
        draggable={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      />
    </button>
  );
}
