import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// posthog-js is dynamically imported only when a key is present. Mock it
// so the "enabled" path can be asserted without the real SDK touching the
// network or the DOM.
const initMock = vi.fn();
const captureMock = vi.fn();
vi.mock('posthog-js', () => ({
  default: { init: initMock, capture: captureMock },
}));

const ORIGINAL_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

beforeEach(() => {
  initMock.mockReset();
  captureMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  else process.env.NEXT_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

describe('captureEvent', () => {
  it('no-ops (no posthog init/capture) when no key is configured', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { captureEvent } = await import('./posthog');
    await captureEvent('lesson_feedback', { choice: 'loved' });
    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('initializes once and forwards the event when a key is set', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    const { captureEvent } = await import('./posthog');

    await captureEvent('lesson_feedback', { choice: 'loved' });
    await captureEvent('lesson_feedback', { choice: 'tricky' });

    expect(initMock).toHaveBeenCalledTimes(1); // init only once
    expect(captureMock).toHaveBeenCalledWith('lesson_feedback', {
      choice: 'loved',
    });
    expect(captureMock).toHaveBeenCalledWith('lesson_feedback', {
      choice: 'tricky',
    });
  });

  it('never throws even if capture blows up', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    captureMock.mockImplementation(() => {
      throw new Error('boom');
    });
    const { captureEvent } = await import('./posthog');
    await expect(captureEvent('lesson_feedback')).resolves.toBeUndefined();
  });
});
