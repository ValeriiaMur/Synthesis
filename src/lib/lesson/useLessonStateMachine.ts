import { useCallback, useState, type RefObject } from 'react';
import type {
  Beat,
  BeatId,
  ManipulativeState,
  MCConfig,
  MCOption,
} from './types';
import type { MCStatus } from '@/components/lesson/MCBlock';
import type { PersistedLessonState } from './lessonPersistence';
import { isBeatComplete } from './completes';
import { enterLineFor, reactToMC } from './branching';
import { stripMarkup } from './stripMarkup';

export type LessonStateMachine = {
  readonly activeIdx: number;
  readonly doneSet: ReadonlySet<BeatId>;
  readonly mcSel: Partial<Record<BeatId, string>>;
  readonly mcStatus: Partial<Record<BeatId, MCStatus>>;
  readonly hintAttempts: Partial<Record<BeatId, number>>;
  readonly manipStates: Partial<Record<BeatId, ManipulativeState>>;
  readonly liveHints: Partial<Record<BeatId, string>>;
  readonly scaffoldedMC: Partial<Record<BeatId, MCConfig>>;
  readonly unlockedBanners: ReadonlySet<BeatId>;
  /** MC the learner currently sees (scaffolded override if present). */
  readonly liveMCFor: (beat: Beat) => MCConfig | undefined;
  readonly handleManip: (idx: number, state: ManipulativeState) => void;
  readonly handleMC: (idx: number, opt: MCOption) => void;
};

export type UseLessonStateMachineDeps = {
  readonly beats: readonly Beat[];
  readonly studentName: string;
  readonly initialState?: PersistedLessonState | null;
  readonly speakAri: (text: string) => void;
  readonly cellRefs: readonly RefObject<HTMLDivElement | null>[];
};

/**
 * Owns the lesson state + the three actions the kid can take (advance,
 * complete a manipulative, answer an MC).
 *
 * The branching layer (`branching.ts`) is the rulebook; this hook is the
 * wiring that applies its decisions to React state + voice. Pure for
 * dispatch — no fetch, no async races.
 *
 * Side-effecting `advanceTo` lives outside the doneSet reducer so React 18
 * StrictMode (which intentionally double-runs reducers in dev) doesn't
 * fire the advance twice.
 */
export function useLessonStateMachine({
  beats,
  studentName,
  initialState = null,
  speakAri,
  cellRefs,
}: UseLessonStateMachineDeps): LessonStateMachine {
  const beatCount = beats.length;

  const [activeIdx, setActiveIdx] = useState(() => initialState?.activeIdx ?? 0);
  const [doneSet, setDoneSet] = useState<ReadonlySet<BeatId>>(
    () => new Set(initialState?.doneIds ?? []),
  );
  const [mcSel, setMcSel] = useState<Partial<Record<BeatId, string>>>(
    () => ({ ...(initialState?.mcSel ?? {}) }),
  );
  const [mcStatus, setMcStatus] = useState<Partial<Record<BeatId, MCStatus>>>(
    () => ({ ...(initialState?.mcStatus ?? {}) }),
  );
  const [hintAttempts, setHintAttempts] = useState<
    Partial<Record<BeatId, number>>
  >(() => ({ ...(initialState?.hintAttempts ?? {}) }));
  const [manipStates, setManipStates] = useState<
    Partial<Record<BeatId, ManipulativeState>>
  >(() => ({ ...(initialState?.manipStates ?? {}) }));
  const [liveHints, setLiveHints] = useState<Partial<Record<BeatId, string>>>(
    () => ({ ...(initialState?.liveHints ?? {}) }),
  );
  const [scaffoldedMC, setScaffoldedMC] = useState<
    Partial<Record<BeatId, MCConfig>>
  >(() => ({ ...(initialState?.scaffoldedMC ?? {}) }));
  const [unlockedBanners, setUnlockedBanners] = useState<ReadonlySet<BeatId>>(
    () => new Set(),
  );

  const advanceTo = useCallback(
    (next: number) => {
      if (next >= beatCount) return;
      const nextBeat = beats[next];
      setActiveIdx(next);
      setUnlockedBanners((s) => {
        if (s.has(nextBeat.id)) return s;
        const ns = new Set(s);
        ns.add(nextBeat.id);
        return ns;
      });

      const enterLine = enterLineFor(nextBeat, studentName);
      const canonicalProse = stripMarkup(nextBeat.prose);
      if (enterLine) speakAri(enterLine);
      speakAri(canonicalProse);

      window.setTimeout(() => {
        cellRefs[next]?.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    },
    [beatCount, beats, cellRefs, speakAri, studentName],
  );

  const liveMCFor = useCallback(
    (beat: Beat): MCConfig | undefined => {
      const override = scaffoldedMC[beat.id];
      return override ?? beat.mc;
    },
    [scaffoldedMC],
  );

  const handleManip = useCallback(
    (idx: number, state: ManipulativeState) => {
      const beat = beats[idx];
      setManipStates((m) => ({ ...m, [beat.id]: state }));
      if (!isBeatComplete(beat, state)) return;

      let wasAlreadyDone = false;
      setDoneSet((s) => {
        if (s.has(beat.id)) {
          wasAlreadyDone = true;
          return s;
        }
        const ns = new Set(s);
        ns.add(beat.id);
        return ns;
      });

      if (wasAlreadyDone) return;
      // Beats with their own MC don't auto-advance — they wait for the answer.
      if (beat.mc) return;
      const next = idx + 1;
      if (next < beatCount) advanceTo(next);
    },
    [advanceTo, beats, beatCount],
  );

  const handleMC = useCallback(
    (idx: number, opt: MCOption) => {
      const beat = beats[idx];
      const mc = liveMCFor(beat);
      if (!mc) return;
      setMcSel((m) => ({ ...m, [beat.id]: opt.id }));

      const prevAttempts = hintAttempts[beat.id] ?? 0;
      const reaction = reactToMC(beat, opt.id, prevAttempts, studentName);

      if (reaction.kind === 'correct') {
        setMcStatus((s) => ({ ...s, [beat.id]: 'correct' }));
        speakAri(reaction.line);
        setDoneSet((s) => {
          const n = new Set(s);
          n.add(beat.id);
          return n;
        });
        if (reaction.nextBeatId) {
          const next = idx + 1;
          window.setTimeout(() => advanceTo(next), 600);
        } else {
          // Final beat — closing line authored inline.
          window.setTimeout(
            () =>
              speakAri(
                "That's the lesson. One half and two quarters are the same amount — same delivery, different packing.",
              ),
            500,
          );
        }
        return;
      }

      // Wrong path: store hint for the bubble, bump attempts, speak it.
      const nextAttemptCount = prevAttempts + 1;
      setMcStatus((s) => ({ ...s, [beat.id]: 'wrong' }));
      setHintAttempts((h) => ({ ...h, [beat.id]: nextAttemptCount }));
      setLiveHints((m) => ({ ...m, [beat.id]: reaction.line }));
      speakAri(reaction.line);

      // Scaffold swap: branching.ts already considered threshold + availability.
      if (reaction.shouldScaffold && !scaffoldedMC[beat.id] && beat.mc) {
        const sc = beat.mc.scaffolded;
        if (sc) {
          const swapped: MCConfig = {
            question: sc.question,
            options: sc.options,
            correctOptionId: sc.correctOptionId,
            canonicalHints: beat.mc.canonicalHints,
            correctReply: beat.mc.correctReply,
            hintByWrongOption: beat.mc.hintByWrongOption,
          };
          setScaffoldedMC((m) => ({ ...m, [beat.id]: swapped }));
          setMcSel((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
          setMcStatus((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
          setLiveHints((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
        }
      }
    },
    [
      advanceTo,
      beats,
      hintAttempts,
      liveMCFor,
      scaffoldedMC,
      speakAri,
      studentName,
    ],
  );

  return {
    activeIdx,
    doneSet,
    mcSel,
    mcStatus,
    hintAttempts,
    manipStates,
    liveHints,
    scaffoldedMC,
    unlockedBanners,
    liveMCFor,
    handleManip,
    handleMC,
  };
}
