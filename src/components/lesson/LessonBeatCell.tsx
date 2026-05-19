import type { RefObject } from 'react';
import type {
  Beat,
  ManipulativeState,
  MCConfig,
  MCOption,
} from '@/lib/lesson/types';
import { phaseLabel } from '@/lib/lesson/phaseLabel';
import { manipSummary } from '@/lib/lesson/manipSummary';
import { isBeatComplete, lookupHint } from '@/lib/lesson/completes';
import { Cell } from './Cell';
import { Prose } from './Prose';
import { MCBlock, type MCStatus } from './MCBlock';
import { HintBubble } from './HintBubble';
import { CelebrationBubble } from './CelebrationBubble';
import { StudentEcho } from './StudentEcho';
import { ManipulativeSlot } from './ManipulativeSlot';

type CellStatus = 'locked' | 'active' | 'done';

export type LessonBeatCellProps = {
  readonly beat: Beat;
  readonly index: number;
  readonly status: CellStatus;
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  readonly manipState: ManipulativeState | undefined;
  readonly liveMC: MCConfig | undefined;
  readonly mcSel: string | undefined;
  readonly mcStatus: MCStatus;
  readonly liveHint: string | undefined;
  readonly hintAttempts: number;
  readonly isScaffolded: boolean;
  readonly showUnlockBanner: boolean;
  readonly onManipChange: (s: ManipulativeState) => void;
  readonly onMCAnswer: (opt: MCOption) => void;
};

export function LessonBeatCell({
  beat,
  index,
  status,
  anchorRef,
  manipState,
  liveMC,
  mcSel,
  mcStatus,
  liveHint,
  hintAttempts,
  isScaffolded,
  showUnlockBanner,
  onManipChange,
  onMCAnswer,
}: LessonBeatCellProps): React.ReactElement {
  const manipDone = beat.manipulative ? isBeatComplete(beat, manipState) : false;
  const showMc =
    !!liveMC &&
    (status === 'active' ||
      status === 'done' ||
      (!!beat.manipulative && manipDone));
  const canonicalHint = liveMC
    ? lookupHint(liveMC.canonicalHints, Math.max(0, hintAttempts - 1))
    : null;

  return (
    <div>
      {showUnlockBanner && (
        <div className="cell-unlock-banner" role="status">
          <span className="cell-unlock-line" />
          <span>▸ cell {String(index).padStart(2, '0')} unlocked</span>
          <span className="cell-unlock-line" />
        </div>
      )}
      <Cell
        index={index}
        phaseLabel={phaseLabel(beat.phase)}
        status={status}
        kind={beat.kindLabel}
        anchorRef={anchorRef}
      >
        <Prose text={beat.prose} />

        {beat.manipulative && (
          <div style={{ marginTop: 24 }}>
            <ManipulativeSlot
              manip={beat.manipulative}
              value={manipState}
              onChange={onManipChange}
              disabled={status === 'locked'}
            />
            {manipDone && manipSummary(manipState) && (
              <StudentEcho done>{manipSummary(manipState)}</StudentEcho>
            )}
          </div>
        )}

        {showMc && liveMC && (
          <div style={{ marginTop: 22 }}>
            {isScaffolded && (
              <div
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: 'var(--ink-mute)',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                ↳ scaffolded
              </div>
            )}
            <MCBlock
              mc={liveMC}
              onAnswer={onMCAnswer}
              locked={status === 'locked'}
              selectedId={mcSel}
              status={mcStatus}
            />
            {mcSel && (mcStatus === 'wrong' || mcStatus === 'correct') && (
              <StudentEcho done={mcStatus === 'correct'}>
                {liveMC.options.find((o) => o.id === mcSel)?.label ?? mcSel}
              </StudentEcho>
            )}
            {mcStatus === 'wrong' && (
              <HintBubble>{liveHint ?? canonicalHint}</HintBubble>
            )}
            {mcStatus === 'correct' && (
              <CelebrationBubble>
                You saw it — the pieces show the same amount.
              </CelebrationBubble>
            )}
          </div>
        )}
      </Cell>
    </div>
  );
}
