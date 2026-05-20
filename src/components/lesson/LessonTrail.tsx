export type LessonTrailProps = {
  /** Total number of beats — used to place the tail right after the last
   *  card (the per-beat nodes are gone). */
  readonly total: number;
  /** True once every beat is done — lights the tail + raises the flag. */
  readonly allDone: boolean;
};

const TAIL_W = 40;
const VB_H = 200;

/** A winding (sine) descent so the tail reads as a curly path. */
function buildTailPath(): string {
  const cx = TAIL_W / 2;
  const amp = 13;
  const cycles = 1.5; // ends back at center-bottom (sin(3π) = 0)
  const steps = 60;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const x = (cx + amp * Math.sin(f * cycles * Math.PI * 2)).toFixed(2);
    const y = (f * VB_H).toFixed(1);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

/**
 * A single decorative "trail" that appears ONLY after the last card: a
 * curly, broken (dotted) line winding downward into a destination sign —
 * a pin that raises a little flag once the whole lesson is done ("you got
 * here"). No per-beat nodes, no line threading the cells.
 *
 * Purely visual — `pointer-events: none`, sits behind the cells. The
 * curve is an SVG sine path with a non-scaling dashed stroke; the flag is
 * an HTML overlay anchored to the curve's center-bottom endpoint.
 */
export function LessonTrail({ total, allDone }: LessonTrailProps): React.ReactElement {
  // Vertical fraction just past the last card, where the tail begins.
  const tailTop = (total - 0.4) / (total + 1);

  return (
    <div className="lesson-trail" aria-hidden>
      <div className="lesson-trail-tail" style={{ top: `${tailTop * 100}%` }}>
        <svg
          className="lesson-trail-tail-svg"
          viewBox={`0 0 ${TAIL_W} ${VB_H}`}
          preserveAspectRatio="none"
        >
          <path
            className={`lesson-trail-tail-path${allDone ? ' is-lit' : ''}`}
            d={buildTailPath()}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={`lesson-trail-flag${allDone ? ' is-raised' : ''}`}>
          <span className="lesson-trail-flag-pole" />
          <span className="lesson-trail-flag-cloth" />
          <span className="lesson-trail-flag-pin" />
        </div>
      </div>
    </div>
  );
}
