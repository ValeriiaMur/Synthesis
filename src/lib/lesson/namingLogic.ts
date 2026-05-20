/**
 * Pure helpers for the NamingMaterial tap-mastery interaction.
 *
 * Three layouts driven entirely by `NamingConfig.fractions`:
 *
 *   ['half']             — 2-region chocolate bar (L1)
 *   ['quarter']          — 4-region chocolate bar (L2)
 *   ['half', 'quarter']  — pre-separated mat: 1 half-tile + 4 quarter-tiles (L3)
 *
 * Tap-mastery contract:
 *   - Correct tap (region kind matches the active prompt) → streak increments,
 *     prompt cycles for L3.
 *   - Wrong tap → silent rejection. No streak change, no penalty, no error
 *     signal. The Montessori "control of error in the material" principle:
 *     the absence of the expected response IS the feedback.
 */

export type FractionKind = 'half' | 'quarter';

export function regionCount(fractions: readonly FractionKind[]): number {
  if (fractions.length === 1 && fractions[0] === 'half') return 2;
  if (fractions.length === 1 && fractions[0] === 'quarter') return 4;
  // Mixed layout: 1 half-tile + 4 quarter-tiles.
  return 5;
}

/** Index of the half-tile in the mixed layout — centered between the
 *  quarters (e.g. q q ½ q q for 5 pieces) so the half visually anchors
 *  the middle of the mat. */
export function halfIndex(fractions: readonly FractionKind[]): number {
  return Math.floor(regionCount(fractions) / 2);
}

export function regionKind(
  idx: number,
  fractions: readonly FractionKind[],
): FractionKind {
  if (fractions.length === 1) return fractions[0];
  // Mixed: the half-tile sits in the MIDDLE; every other tile is a quarter.
  return idx === halfIndex(fractions) ? 'half' : 'quarter';
}

/**
 * Decide which fraction the next prompt asks for.
 *
 * Single-fraction lessons (L1, L2) always prompt the same kind. Mixed
 * lessons (L3) prompt for the kind that still has untapped pieces on the
 * tray, biasing toward `half` first so the kid meets the half before
 * working through the quarters. This naturally keeps the prompt useful:
 * once a kind has been fully tapped, the prompt switches to whatever's
 * still untapped.
 */
export function pickPromptKind(
  fractions: readonly FractionKind[],
  tapped: readonly number[] = [],
): FractionKind {
  if (fractions.length === 1) return fractions[0];
  // Prompt for the half until its (centered) tile has been tapped, then
  // switch to the quarters.
  const halfUntapped = !new Set(tapped).has(halfIndex(fractions));
  if (halfUntapped) return 'half';
  return 'quarter';
}

/** Result of evaluating one tap on a piece.
 *  - `accepted` — the tap matched the prompted kind AND the piece hadn't
 *    been tapped already. The caller should advance the `tapped` array.
 *  - `nextTapped` — the new tapped-indices array (with the new index
 *    pushed when accepted, unchanged otherwise). */
export type TapResult = {
  readonly accepted: boolean;
  readonly nextTapped: readonly number[];
};

/**
 * Evaluate a tap on a region.
 *
 * Accepts only when (a) the tapped kind matches the prompt AND (b) the
 * tapped index isn't already in the `tapped` set. Wrong-kind taps and
 * repeat-tap-of-the-same-piece are both silently rejected — the kid is
 * exploring every distinct piece on the tray once.
 */
export function evalTap(
  promptKind: FractionKind,
  tappedKind: FractionKind,
  tappedIdx: number,
  prevTapped: readonly number[],
): TapResult {
  if (promptKind !== tappedKind) {
    return { accepted: false, nextTapped: prevTapped };
  }
  if (prevTapped.includes(tappedIdx)) {
    return { accepted: false, nextTapped: prevTapped };
  }
  return { accepted: true, nextTapped: [...prevTapped, tappedIdx] };
}

/**
 * Observational feedback for the kid after a tap. Two tones:
 *
 *  - `success` — they tapped the right kind. We *describe* what they got
 *    ("one half") rather than praise ("nice job!"). The visible label is
 *    the math, not the validation.
 *  - `observation` — they tapped a different kind than the prompt asked
 *    for. We *name* what they tapped and re-issue the prompt softly
 *    ("that's a quarter — find the half"). No "wrong", no "try again".
 *
 * Single-kind layouts (L1 halves-only, L2 quarters-only) can never
 * mis-tap, so callers only get a `success` message back.
 */
export type FeedbackTone = 'success' | 'observation';
export type Feedback = { readonly tone: FeedbackTone; readonly text: string };

function indef(kind: FractionKind): string {
  return kind === 'half' ? 'a half' : 'a quarter';
}

export function feedbackMessage(
  promptKind: FractionKind,
  tappedKind: FractionKind,
): Feedback {
  if (promptKind === tappedKind) {
    return { tone: 'success', text: `yes — that's ${indef(tappedKind)}.` };
  }
  return {
    tone: 'observation',
    text: `that's ${indef(tappedKind)} — find the ${promptKind}.`,
  };
}
