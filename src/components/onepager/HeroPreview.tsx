'use client';

import { useState, type CSSProperties } from 'react';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

const UNIT_PX = 56;

type QuarterProps = {
  readonly onTap: () => void;
  readonly placed?: boolean;
};

/**
 * One tappable quarter. Rendered seamless (no per-piece radius/shadow) so
 * neighbouring quarters merge into one continuous chocolate slab — matches
 * the lesson's WholeMaterial styling. The interaction-side hygiene
 * (border-radius, no-select, hover guard, focus-visible) lives in the
 * `.hero-quarter` class in globals.css.
 */
function Quarter({ onTap, placed = false }: QuarterProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Quarter piece"
      className="hero-quarter"
    >
      <ChocolatePiece size={UNIT_PX} placed={placed} alt="" seamless />
    </button>
  );
}

/** A traditional stacked fraction: number on top, horizontal rule, number
 *  on bottom. The rule is just a border-top on the denominator span — no
 *  separate element, no risk of layout collapsing it to zero width. */
function StackedFraction({
  top,
  bot,
  fontSize = 36,
  style,
}: {
  readonly top: string;
  readonly bot: string;
  readonly fontSize?: number;
  readonly style?: CSSProperties;
}) {
  return (
    <span className="stacked-frac" style={{ fontSize, ...style }}>
      <span className="stacked-frac-top">{top}</span>
      <span className="stacked-frac-bot">{bot}</span>
    </span>
  );
}

/**
 * Mini chocolate-bar interactive shown next to the hero copy.
 *
 * Visual model matches the lesson's WholeMaterial: the four quarters sit
 * flush as a single chocolate rectangle (the "1" — one whole). Tapping a
 * quarter lifts it into the half-space below. When exactly two land in
 * the half-space they read as one half — labeled with the stacked
 * fraction 1⁄2.
 */
export function HeroPreview() {
  const [placed, setPlaced] = useState(0);
  const remaining = 4 - placed;
  const isHalfFit = placed === 2;
  const wholeIsFull = remaining === 4;

  return (
    <div className="hero-preview">
      <div className="hero-preview-label">
        <span>live · try it</span>
        <span className="ln" />
        <span
          style={{
            color: isHalfFit ? 'var(--green)' : 'var(--ink-mute)',
          }}
        >
          {isHalfFit ? 'perfect fit' : `${placed}/4 placed`}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        {/* Top row — the whole bar with its side labels. "1" identifies
            the whole; "1⁄2" appears once the visitor has placed two
            quarters in the half-space, marking the matching half on the
            bar itself (the bar's left half = the half-space's contents). */}
        <div className="hero-tray-row">
          <div className="hero-tray hero-tray--bar">
            {Array.from({ length: remaining }, (_, i) => (
              <Quarter
                key={i}
                onTap={() => setPlaced((p) => Math.min(4, p + 1))}
              />
            ))}
            {remaining === 0 && (
              <span className="hero-tray-empty">(empty)</span>
            )}
          </div>
          <div className="hero-tray-labels">
            {wholeIsFull && <span className="hero-label-big">1</span>}
            {isHalfFit && <StackedFraction top="1" bot="2" fontSize={26} />}
          </div>
        </div>

        <div className="hero-tray-divider">HALF-SPACE ↓</div>

        {/* Bottom row — the half-space with its "1⁄2" side label. The
            tray is exactly half the bar's width and shares its left
            edge, so it visually "shadows" the left half of the whole. */}
        <div className="hero-tray-row">
          <div
            className={`hero-tray hero-tray--half${
              isHalfFit ? ' is-fit' : ''
            }`}
          >
            {placed === 0 && (
              <span className="hero-tray-cta">TAP A PIECE ↑</span>
            )}
            {Array.from({ length: placed }, (_, i) => (
              <Quarter
                key={i}
                onTap={() => setPlaced((p) => Math.max(0, p - 1))}
                placed
              />
            ))}
          </div>
          <div className="hero-tray-labels">
            <StackedFraction top="1" bot="2" fontSize={26} />
          </div>
        </div>

        <div className="hero-tray-caption">
          {placed === 0 && 'Tap a quarter to place it on the half-space.'}
          {placed === 1 && 'One quarter on the space. Try another.'}
          {placed === 2 && 'Two quarters cover exactly one half.'}
          {placed === 3 && 'Three is more than a half. One is hanging over.'}
          {placed === 4 && 'Four quarters covers the whole bar.'}
        </div>
      </div>
    </div>
  );
}
