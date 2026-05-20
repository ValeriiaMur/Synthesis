export type PaperFracProps = {
  readonly n: string | number;
  readonly d: string | number;
  /** If true, renders the large hero-sized fraction (clamp 64 → 110px).
   *  Otherwise renders the small mirror size (clamp 32 → 56px). */
  readonly big?: boolean;
};

/**
 * Inline stacked fraction rendered as <span> + <span> (bar) + <span>.
 * Sized via clamp() so it scales with the workspace. Used on each
 * folded quadrant of the paper.
 */
export function PaperFrac({ n, d, big = false }: PaperFracProps) {
  // Smaller than before so the white-on-blue chip fits cleanly inside a
  // quadrant without crowding the paper.
  const fs = big ? 'clamp(40px, 6vmin, 64px)' : 'clamp(26px, 4vmin, 40px)';
  return (
    <span className="paper-frac" style={{ fontSize: fs }}>
      <span>{n}</span>
      <span />
      <span>{d}</span>
    </span>
  );
}
