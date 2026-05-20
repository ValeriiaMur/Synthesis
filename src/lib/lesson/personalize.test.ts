import { describe, it, expect } from 'vitest';
import { personalizeProse, personalizeLesson } from './personalize';
import { lesson } from './lessonData';
import type { Lesson } from './types';

describe('personalizeProse', () => {
  it('substitutes the {name} token with the learner name', () => {
    expect(personalizeProse('This is one whole, {name}. Tap it.', 'Lera')).toBe(
      'This is one whole, Lera. Tap it.',
    );
  });

  it('title-cases the inserted name', () => {
    expect(personalizeProse('Hi, {name}!', 'lera')).toBe('Hi, Lera!');
  });

  it('replaces every occurrence of the token', () => {
    expect(personalizeProse('Hi {name}, go {name}', 'Sam')).toBe(
      'Hi Sam, go Sam',
    );
  });

  it('leaves prose without a token unchanged', () => {
    expect(personalizeProse('Tap each half.', 'Lera')).toBe('Tap each half.');
  });

  it('drops the token and its leading separator when the name is empty', () => {
    expect(personalizeProse('This is one whole, {name}. Tap it.', '')).toBe(
      'This is one whole. Tap it.',
    );
  });

  it('treats a whitespace-only name as empty', () => {
    expect(personalizeProse('What is this, {name}?', '   ')).toBe(
      'What is this?',
    );
  });

  it('never leaves a literal token behind', () => {
    expect(personalizeProse('Go, {name}!', 'Ana')).not.toContain('{name}');
    expect(personalizeProse('Go, {name}!', '')).not.toContain('{name}');
  });
});

describe('personalizeLesson', () => {
  const fixture: Lesson = {
    id: 'fractions-naming-v1',
    beats: [
      {
        id: 'whole_intro',
        phase: 'period_1_introduce',
        kindLabel: 'one whole',
        prose: 'This is one whole, {name}. Tap to split it in half.',
        manipulative: { kind: 'whole' },
      },
      {
        id: 'name_half',
        phase: 'period_1_introduce',
        kindLabel: 'one half',
        prose: 'Tap each half.',
        manipulative: { kind: 'naming', fractions: ['half'] },
      },
    ],
  };

  it('personalizes tokenized prose and leaves other beats untouched', () => {
    const out = personalizeLesson(fixture, 'Lera');
    expect(out.beats[0].prose).toBe(
      'This is one whole, Lera. Tap to split it in half.',
    );
    expect(out.beats[1].prose).toBe('Tap each half.');
  });

  it('preserves lesson id, beat count, and non-prose beat fields', () => {
    const out = personalizeLesson(fixture, 'Lera');
    expect(out.id).toBe(fixture.id);
    expect(out.beats).toHaveLength(fixture.beats.length);
    expect(out.beats[0].id).toBe('whole_intro');
    expect(out.beats[0].manipulative).toEqual({ kind: 'whole' });
  });

  it('falls back to clean prose with no token artifacts when name is empty', () => {
    const out = personalizeLesson(fixture, '');
    expect(out.beats[0].prose).toBe('This is one whole. Tap to split it in half.');
  });

  it('leaves no literal {name} token anywhere in the real lesson', () => {
    for (const name of ['Lera', '']) {
      const out = personalizeLesson(lesson, name);
      for (const beat of out.beats) {
        expect(beat.prose).not.toContain('{name}');
      }
    }
  });
});
