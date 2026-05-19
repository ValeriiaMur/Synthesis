import type { LessonPhase } from './types';

export function phaseLabel(p: LessonPhase): string {
  if (p === 'period_1_introduce') return 'P1 · introduce';
  if (p === 'period_2_recognize') return 'P2 · recognize';
  return 'P3 · recall';
}
