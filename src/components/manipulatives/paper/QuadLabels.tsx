import { PaperFrac } from './PaperFrac';

export type QuadLabelsProps = {
  readonly folds: 0 | 1 | 2;
};

/**
 * Fraction labels stamped on the folded paper:
 *
 *   0 folds → nothing here (the big black "1" is drawn by `WholeNumber`).
 *   1 fold  → two "½" chips, one centered on each half (the horizontal
 *             crease splits the square top/bottom).
 *   2 folds → four "¼" chips, one centered on each quarter.
 *
 * Every label is equally visible — no "confident vs mirror" dimming —
 * because every part is, mathematically, an equal share.
 */
export function QuadLabels({ folds }: QuadLabelsProps) {
  if (folds === 0) return null;

  if (folds === 1) {
    return (
      <div className="paper-quad-labels" data-folds="1" aria-hidden>
        <div className="paper-quad-label">
          <PaperFrac n={1} d={2} big />
        </div>
        <div className="paper-quad-label">
          <PaperFrac n={1} d={2} big />
        </div>
      </div>
    );
  }

  return (
    <div className="paper-quad-labels" data-folds="2" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="paper-quad-label">
          <PaperFrac n={1} d={4} />
        </div>
      ))}
    </div>
  );
}
