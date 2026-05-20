'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

export type TrayItemKind = '½' | '¼';

export type TrayItemProps = {
  readonly item: TrayItemKind;
  readonly delay: number;
};

/**
 * One staggered-pop-in chocolate item on the prepared-environment tray.
 * Only two kinds — a ½ slab (96×44) and a ¼ square (44×44) — so the demo
 * stays chocolate-only and the relationship reads directly (the half is
 * twice the width of the quarter).
 */
export function TrayItem({ item, delay }: TrayItemProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  const base: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'scale(1)' : 'scale(0.6)',
    transition: 'all .4s cubic-bezier(.2,1.5,.4,1)',
    borderRadius: 8,
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    fontWeight: 300,
  };

  // ½ is a wider chocolate slab (96×44); ¼ is square (44×44).
  const width = item === '½' ? 96 : 44;
  return (
    <div
      style={{
        ...base,
        position: 'relative',
        width,
        height: 44,
        color: 'rgba(255,255,255,0.95)',
        fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
        fontWeight: 500,
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
      }}
    >
      <ChocolatePiece
        size={44}
        width={width}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 8,
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{item}</span>
    </div>
  );
}
