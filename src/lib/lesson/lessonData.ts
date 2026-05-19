import type { Lesson } from './types';

/**
 * Six-beat equivalent-fractions lesson, framed as one continuous cosmos
 * adventure for a 9-year-old.
 *
 * Story arc — you and Ari are on a small ship called the Spirit, running a
 * delivery to a moon outpost. Every stop turns into a fraction puzzle:
 *
 *   01  chocolate_intro      The Spirit's snack-ration tray needs to be half-filled.
 *   02  chocolate_check      Ari logs how many ration squares it took.
 *   03  pizza_explore        At the outpost, the cook's moon-pizza is split for
 *                            two — and four more friends just landed.
 *   04  pizza_check          Ari double-checks the share is fair.
 *   05  paper_fold_final     The outpost engineer hands over a star-map. The
 *                            folds reveal the way home.
 *   06  fraction_box_explore Back on the Spirit, the warp-drive's fraction-lock
 *                            needs *two* matching brick patterns to start.
 *
 * Prose carries highlight tokens:
 *   {y}…{/y}  yellow emphasis
 *   {r}…{/r}  red numeral
 *   {b}…{/b}  blue numeral
 *   {g}…{/g}  green numeral
 */
export const lesson: Lesson = {
  id: 'fraction-equivalence-v1',
  beats: [
    {
      id: 'chocolate_intro',
      phase: 'period_1_introduce',
      kindLabel: 'manipulative — ration bar',
      prose:
        "The tray holds {y}half the chocolate bar{/y}. Tap squares onto it until they fit.",
      manipulative: {
        kind: 'chocolate',
        totalPieces: 4,
        referenceFraction: { numerator: 1, denominator: 2 },
      },
    },
    {
      id: 'chocolate_check',
      phase: 'period_2_recognize',
      kindLabel: 'check — flight log',
      prose:
        "Flight log time. How many squares ended up on the tray?",
      enterLine: "Tray's loaded, {name}.",
      mc: {
        question: 'How many quarter-squares ended up on the half-tray?',
        options: [
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
          { id: 'three', label: 'Three' },
          { id: 'four', label: 'Four' },
        ],
        correctOptionId: 'two',
        correctReply: 'Two it is — the half-tray fits perfectly.',
        canonicalHints: [
          'Look at the tray. Slide the squares side by side and count.',
          'Line up two squares on the half-tray. See if they fit.',
          'Place two squares on the tray. Count what is there.',
        ],
        hintByWrongOption: {
          one: 'Look again — more than one square sits on the tray.',
          three: 'Count just what fits — three would hang off the edge.',
          four: 'Four is the whole bar — the tray only holds half.',
        },
        scaffolded: {
          question: 'Two squares fit the half-tray. Was it one square or two?',
          options: [
            { id: 'one', label: 'One' },
            { id: 'two', label: 'Two' },
          ],
          correctOptionId: 'two',
        },
      },
    },
    {
      id: 'pizza_explore',
      phase: 'period_2_recognize',
      kindLabel: 'manipulative — moon-pizza',
      prose:
        "The {y}moon-pizza{/y} is in two halves. Cut each half in two — one slice each.",
      enterLine: 'Locked in, {name}. Pizza next.',
      manipulative: {
        kind: 'pizza',
        initialSlices: 2,
        targetSlices: 4,
      },
    },
    {
      id: 'pizza_check',
      phase: 'period_3_recall',
      kindLabel: 'check — fair share',
      prose:
        "Check the share. Hold one half against {b}two{/b} of the new slices.",
      enterLine: 'Slices look good — double-check the share.',
      mc: {
        question: 'Is two slices out of four the same amount of pizza as one half?',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
        correctOptionId: 'yes',
        correctReply: 'Yes — two slices cover the same space as one half.',
        canonicalHints: [
          'Place two slices against one half. Compare them.',
          'Slide two slices together. Do they cover one half?',
        ],
        hintByWrongOption: {
          no: 'Lay two slices on one half. See if they fit.',
        },
      },
    },
    {
      id: 'paper_fold_final',
      phase: 'period_3_recall',
      kindLabel: 'manipulative + check — star-map',
      prose:
        "Fold the star-paper across the middle — that's {y}one half{/y}. Fold the other way — each half is now {y}two quarters{/y}.",
      enterLine: 'Fair share confirmed. Star-map next.',
      manipulative: {
        kind: 'paper',
        targetFolds: ['horizontal', 'vertical'],
      },
      mc: {
        question: 'What do the folds on the star-map show you?',
        options: [
          {
            id: 'half-equals-two-quarters',
            label: 'One half is the same as two quarters.',
          },
          {
            id: 'half-equals-one-quarter',
            label: 'One half is the same as one quarter.',
          },
          {
            id: 'quarter-bigger-than-half',
            label: 'One quarter is bigger than one half.',
          },
        ],
        correctOptionId: 'half-equals-two-quarters',
        correctReply: 'One half and two quarters — same amount of sky.',
        canonicalHints: [
          'Look at the creases. Count the quarters in one half.',
          'Trace one half. Count the quarters inside it.',
        ],
        hintByWrongOption: {
          'half-equals-one-quarter':
            'Trace one half. How many quarters fit inside — one or two?',
          'quarter-bigger-than-half':
            'A quarter is one of four; a half is one of two. Which is bigger?',
        },
        scaffolded: {
          question:
            'Look at one half of the star-map. How many quarter-sections fit inside it?',
          options: [
            {
              id: 'half-equals-one-quarter',
              label: 'One quarter.',
            },
            {
              id: 'half-equals-two-quarters',
              label: 'Two quarters.',
            },
          ],
          correctOptionId: 'half-equals-two-quarters',
        },
      },
    },
    {
      id: 'fraction_box_explore',
      phase: 'period_3_recall',
      kindLabel: 'manipulative — warp-drive fraction-lock',
      prose:
        "Warp-drive lock — {y}three checkpoints{/y}. Build {y}one whole{/y} two ways, then three short quests.",
      enterLine: "Home stretch, {name}. Warp-drive's waiting.",
      manipulative: {
        kind: 'blockstudio',
        palette: [
          { num: 1, den: 2 },
          { num: 1, den: 3 },
          { num: 1, den: 4 },
          { num: 1, den: 6 },
          { num: 1, den: 8 },
        ],
        steps: ['play', 'compare', 'quest'],
        quests: ['q1', 'q2', 'q3'],
      },
    },
  ],
};
