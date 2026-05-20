'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getAmbientPlayer } from '@/lib/audio/ambientPlayer';

export type NamePromptProps = {
  readonly onSubmit: (name: string) => void;
};

type AudioGateState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'playing' }
  | { readonly kind: 'played' }
  | { readonly kind: 'error' }
  | { readonly kind: 'confirmed' };

/**
 * Neutral pre-lesson modal: collects the learner's name and verifies that
 * audio works. The sound check unmutes the ambient pad — that user
 * gesture also satisfies the browser's autoplay policy, so the lesson's
 * in-flight TTS narration can play later without further interaction.
 *
 * Copy is intentionally generic — no narrator name, no "story". The
 * lesson teaches via the material itself; the name is just for greeting.
 */
export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');
  const [audio, setAudio] = useState<AudioGateState>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const audioConfirmed = audio.kind === 'confirmed';

  useEffect(() => {
    if (audioConfirmed) inputRef.current?.focus();
  }, [audioConfirmed]);

  const trimmed = name.trim();
  const canSubmit = audioConfirmed && trimmed.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Pause the ambient pad on submit so it doesn't compete with the
    // lesson's per-beat narration. The user's mute preference stays
    // intact — the player will resume on the home page next time they
    // visit.
    try {
      const player = getAmbientPlayer();
      void player.setMuted(true);
    } catch {
      // ignore — submit shouldn't fail because of audio cleanup
    }
    onSubmit(trimmed);
  };

  const handlePlay = async () => {
    setAudio({ kind: 'playing' });
    try {
      const player = getAmbientPlayer();
      await player.setMuted(false);
      setAudio({ kind: 'played' });
    } catch {
      setAudio({ kind: 'error' });
    }
  };

  const handleConfirmHeard = () => {
    setAudio({ kind: 'confirmed' });
  };

  return (
    <div
      className="name-prompt cosmos-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-prompt-title"
    >
      <div className="name-prompt-backdrop" aria-hidden />
      <form className="name-prompt-card" onSubmit={handleSubmit} noValidate>
        <div className="name-prompt-tag">
          <span className="dot" aria-hidden />
          before we begin
        </div>
        <h2 id="name-prompt-title">What should we call you?</h2>
        <p className="name-prompt-sub">
          Just a friendly tag so we can greet you during the lesson.
        </p>

        <div className="name-prompt-audio-check" aria-live="polite">
          {audio.kind === 'idle' && (
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePlay}
            >
              Play a sound to test
            </button>
          )}
          {audio.kind === 'playing' && (
            <span className="name-prompt-audio-status">Playing…</span>
          )}
          {audio.kind === 'played' && (
            <div className="name-prompt-audio-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmHeard}
              >
                I hear it
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePlay}
              >
                Play again
              </button>
            </div>
          )}
          {audio.kind === 'error' && (
            <div className="name-prompt-audio-actions">
              <span className="name-prompt-audio-status">
                Couldn&rsquo;t play the sound.
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={handlePlay}
              >
                Try again
              </button>
            </div>
          )}
          {audio.kind === 'confirmed' && (
            <span className="name-prompt-audio-status name-prompt-audio-ok">
              ✓ sound on
            </span>
          )}
        </div>

        <label className="name-prompt-field">
          <span className="sr-only">Your name</span>
          <input
            ref={inputRef}
            type="text"
            aria-label="Your name"
            placeholder="Type your name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="off"
            disabled={!audioConfirmed}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          Let&rsquo;s begin
          <span className="btn-arrow" aria-hidden>
            →
          </span>
        </button>
      </form>
    </div>
  );
}
