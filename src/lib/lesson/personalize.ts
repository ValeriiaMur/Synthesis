import type { Lesson } from './types';
import { titleCaseName } from './titleCaseName';

/**
 * Name personalization for beat prose.
 *
 * Beat prose can carry a single inline token, `{name}`, marking the spot
 * where the learner's name reads naturally (e.g. a greeting on the opening
 * beat, the direct address at the recall moment). Substitution happens once,
 * at the `LessonPage` level, so the on-screen prose AND both voice-narration
 * paths (mount + advance) stay in sync — see `personalizeLesson`.
 *
 * The token is intentionally *not* one of the `{y}/{r}/{b}/{g}` highlight
 * tokens the `Prose` renderer understands, and substitution runs before the
 * prose reaches that renderer, so the name is always resolved to plain text.
 */
const NAME_TOKEN = /\{name\}/g;

/**
 * Token plus any leading comma / whitespace. Used to excise the token
 * cleanly when there is no name, turning "…one whole, {name}. Tap." into
 * "…one whole. Tap." rather than leaving a dangling comma.
 */
const NAME_TOKEN_WITH_SEP = /[,\s]*\{name\}/g;

/**
 * Resolve the `{name}` token in a single prose string.
 *
 * With a name: every token becomes the title-cased name.
 * Without one (empty / whitespace-only): the token and any leading
 * separator are removed, and incidental double spaces are collapsed, so the
 * sentence reads as if the name had never been there.
 */
export function personalizeProse(text: string, name: string): string {
  const display = titleCaseName(name);
  if (!display) {
    return text.replace(NAME_TOKEN_WITH_SEP, '').replace(/\s{2,}/g, ' ').trim();
  }
  return text.replace(NAME_TOKEN, display);
}

/**
 * Return a copy of the lesson with every beat's prose personalized for
 * `name`. Lesson id, beat order, and all non-prose fields are preserved, so
 * persistence (keyed by lesson id) and the state machine are unaffected.
 */
export function personalizeLesson(lesson: Lesson, name: string): Lesson {
  return {
    ...lesson,
    beats: lesson.beats.map((beat) => ({
      ...beat,
      prose: personalizeProse(beat.prose, name),
    })),
  };
}
