'use client';

import { useState } from 'react';
import Link from 'next/link';
import { captureEvent } from '@/lib/analytics/posthog';
import { titleCaseName } from '@/lib/lesson/titleCaseName';

export type OutroProps = {
  readonly done: boolean;
  /** Learner's name, used for a warm greeting in the finished state.
   *  Optional / empty falls back to the un-named closing copy. */
  readonly studentName?: string;
};

type Feedback = 'loved' | 'ok' | 'tricky';

const FEEDBACK_OPTIONS: readonly { readonly id: Feedback; readonly label: string }[] = [
  { id: 'loved', label: 'Loved it' },
  { id: 'ok', label: 'It was ok' },
  { id: 'tricky', label: 'A bit tricky' },
];

/**
 * Closing block for the lesson.
 *
 * Before the lesson is finished it shows a quiet "keep going" cue. Once
 * every beat is done it opens into a warm ending that stays true to the
 * Montessori principles the rest of the lesson follows — description, not
 * praise; an off-ramp into the real world — and then a finish CTA: a
 * light-touch feedback choice and a way back home.
 *
 * The feedback is intentionally low-stakes (three plain choices, no
 * scores). It's captured in local state only — there's no backend in
 * this build — and acknowledged with a quiet "thanks".
 */
export function Outro({ done, studentName = '' }: OutroProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const name = titleCaseName(studentName);

  if (!done) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '56px 0 32px',
          color: 'var(--ink-faint)',
          fontSize: 13,
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        — keep going above —
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 64,
        marginBottom: 24,
        padding: '48px 32px 64px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--green)',
        }}
      >
        lesson complete
      </div>

      <h2
        style={{
          fontSize: 'clamp(26px, 4vw, 40px)',
          fontWeight: 200,
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
          margin: 0,
          maxWidth: 620,
        }}
      >
        {name ? `Nice work, ${name} — you ` : 'You '}
        split a whole into halves, named the quarters, and saw that{' '}
        <span style={{ color: 'var(--green)' }}>
          four quarters make one whole
        </span>
        .
      </h2>

      <p
        style={{
          fontSize: 16,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--ink-soft)',
          maxWidth: 540,
          margin: 0,
        }}
      >
        Now find something at home you can split — a cracker, an apple, a
        sheet of paper — and see how many halves and quarters you can make.
      </p>

      {/* Finish CTA — quick feedback, then a way home. */}
      <div className="outro-finish">
        <div className="outro-feedback-q">How did this lesson feel?</div>
        <div className="outro-feedback-row" role="group" aria-label="Lesson feedback">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`outro-feedback-btn${feedback === opt.id ? ' is-selected' : ''}`}
              aria-pressed={feedback === opt.id}
              onClick={() => {
                setFeedback(opt.id);
                // Fire-and-forget — captured in PostHog as `lesson_feedback`.
                // No-ops when NEXT_PUBLIC_POSTHOG_KEY isn't configured.
                void captureEvent('lesson_feedback', { choice: opt.id });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="outro-feedback-thanks" aria-live="polite">
          {feedback ? 'Thanks for telling us.' : ' '}
        </div>

        <Link className="btn-primary" href="/">
          Back to home
          <span className="btn-arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
