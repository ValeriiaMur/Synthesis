'use client';

import { createRef, useMemo, type RefObject } from 'react';
import type { Beat, BeatId, Lesson } from '@/lib/lesson/types';
import { Stars } from '@/components/space/Stars';
import { GridBg } from '@/components/space/GridBg';
import { Doodles } from '@/components/space/Doodles';
import { TopBar, type ProgressSegmentStatus } from './TopBar';
import { Intro } from './Intro';
import { Outro } from './Outro';
import { LessonBeatCell } from './LessonBeatCell';
import type { PersistedLessonState } from '@/lib/lesson/lessonPersistence';
import { useLessonStateMachine } from '@/lib/lesson/useLessonStateMachine';
import { useLessonVoice } from '@/lib/lesson/useLessonVoice';
import { useLessonPersistence } from '@/lib/lesson/useLessonPersistence';

export type LessonPageProps = {
  readonly lesson: Lesson;
  readonly studentName?: string;
  /** Optional restore. When provided, the state machine hydrates from it
   *  instead of starting fresh. */
  readonly initialState?: PersistedLessonState | null;
};

type CellStatus = 'locked' | 'active' | 'done';

/**
 * Top-level lesson screen. Composition only — state, effects, and
 * branching wiring live in extracted hooks:
 *
 *  - `useLessonStateMachine` — state + handleMC / handleManip / advance
 *  - `useLessonVoice` — speakAri + mute + mount-time voice + resume scroll
 *  - `useLessonPersistence` — localStorage snapshot + beforeunload backstop
 *
 * Layout: full-width notebook. The chat rail was retired in favour of a
 * voice-driven, view-driven experience — each cell is one turn in a
 * vertical chat. See `summary.md` for the full architecture.
 */
export function LessonPage({
  lesson,
  studentName = 'Ben',
  initialState = null,
}: LessonPageProps) {
  const beats = lesson.beats;
  const beatCount = beats.length;

  const cellRefs = useMemo<readonly RefObject<HTMLDivElement | null>[]>(
    () => beats.map(() => createRef<HTMLDivElement | null>()),
    [beats],
  );

  const initialActiveIdx = initialState?.activeIdx ?? 0;
  const { speakAri, muted, toggleMuted } = useLessonVoice(
    initialActiveIdx,
    beats,
    studentName,
    cellRefs[initialActiveIdx],
  );

  const machine = useLessonStateMachine({
    beats,
    studentName,
    initialState,
    speakAri,
    cellRefs,
  });

  useLessonPersistence(lesson.id, {
    activeIdx: machine.activeIdx,
    doneSet: machine.doneSet,
    mcSel: machine.mcSel,
    mcStatus: machine.mcStatus,
    hintAttempts: machine.hintAttempts,
    manipStates: machine.manipStates,
    liveHints: machine.liveHints,
    scaffoldedMC: machine.scaffoldedMC,
  });

  const statusFor = (idx: number): CellStatus => {
    const beat = beats[idx];
    if (machine.doneSet.has(beat.id)) return 'done';
    if (idx === machine.activeIdx) return 'active';
    return 'locked';
  };

  const progress = useMemo<readonly ProgressSegmentStatus[]>(
    () =>
      beats.map((b, i) => {
        if (machine.doneSet.has(b.id)) return 'done';
        if (i === machine.activeIdx) return 'active';
        return 'idle';
      }),
    [beats, machine.activeIdx, machine.doneSet],
  );

  return (
    <div className="lesson-app cosmos-bg">
      <Stars count={120} />
      <GridBg />
      <Doodles />

      <TopBar progress={progress} muted={muted} onToggleSound={toggleMuted} />

      <div className="stage">
        <div className="notebook">
          <div className="notebook-inner">
            <Intro studentName={studentName} />

            {beats.map((beat: Beat, idx: number) => (
              <LessonBeatCell
                key={beat.id}
                beat={beat}
                index={idx + 1}
                status={statusFor(idx)}
                anchorRef={cellRefs[idx]}
                manipState={machine.manipStates[beat.id as BeatId]}
                liveMC={machine.liveMCFor(beat)}
                mcSel={machine.mcSel[beat.id as BeatId]}
                mcStatus={machine.mcStatus[beat.id as BeatId] ?? 'idle'}
                liveHint={machine.liveHints[beat.id as BeatId]}
                hintAttempts={machine.hintAttempts[beat.id as BeatId] ?? 1}
                isScaffolded={!!machine.scaffoldedMC[beat.id as BeatId]}
                showUnlockBanner={
                  idx > 0 && machine.unlockedBanners.has(beat.id)
                }
                onManipChange={(s) => machine.handleManip(idx, s)}
                onMCAnswer={(opt) => machine.handleMC(idx, opt)}
              />
            ))}

            <Outro done={machine.doneSet.size === beatCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
