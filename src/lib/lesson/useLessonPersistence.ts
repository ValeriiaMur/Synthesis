import { useCallback, useEffect, useRef } from 'react';
import type {
  BeatId,
  ManipulativeState,
  MCConfig,
} from './types';
import type { MCStatus } from '@/components/lesson/MCBlock';
import { snapshotLesson, storageKey } from './lessonPersistence';

export type LessonStateForPersistence = {
  readonly activeIdx: number;
  readonly doneSet: ReadonlySet<BeatId>;
  readonly mcSel: Partial<Record<BeatId, string>>;
  readonly mcStatus: Partial<Record<BeatId, MCStatus>>;
  readonly hintAttempts: Partial<Record<BeatId, number>>;
  readonly manipStates: Partial<Record<BeatId, ManipulativeState>>;
  readonly liveHints: Partial<Record<BeatId, string>>;
  readonly scaffoldedMC: Partial<Record<BeatId, MCConfig>>;
};

/**
 * Persists the lesson snapshot to localStorage on every meaningful state
 * change, plus a beforeunload/pagehide flush so the freshest in-memory
 * state lands on disk if the user closes the tab between a React commit
 * and the effect firing.
 *
 * Synchronous write — no rAF batching. The rAF gap used to lose the most
 * recent advance when the user closed the tab in the ~16ms between the
 * state update committing and the rAF callback running.
 */
export function useLessonPersistence(
  lessonId: string,
  state: LessonStateForPersistence,
): void {
  const buildSnapshot = useCallback(
    () =>
      snapshotLesson(lessonId, {
        activeIdx: state.activeIdx,
        doneIds: Array.from(state.doneSet),
        mcSel: state.mcSel,
        mcStatus: state.mcStatus,
        hintAttempts: state.hintAttempts,
        manipStates: state.manipStates,
        liveHints: state.liveHints,
        scaffoldedMC: state.scaffoldedMC,
        chat: [],
      }),
    [
      lessonId,
      state.activeIdx,
      state.doneSet,
      state.mcSel,
      state.mcStatus,
      state.hintAttempts,
      state.manipStates,
      state.liveHints,
      state.scaffoldedMC,
    ],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey(lessonId),
        JSON.stringify(buildSnapshot()),
      );
    } catch {
      // localStorage can throw if disabled / over quota; ignore.
    }
  }, [lessonId, buildSnapshot]);

  const buildSnapshotRef = useRef(buildSnapshot);
  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flush = (): void => {
      try {
        window.localStorage.setItem(
          storageKey(lessonId),
          JSON.stringify(buildSnapshotRef.current()),
        );
      } catch {
        // ignore — best effort on unload
      }
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [lessonId]);
}
