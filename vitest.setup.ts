import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// jsdom installs its own `Blob` global, but the global `fetch` (Node's
// undici-backed implementation) returns a `Response.blob()` whose
// constructor is *not* the jsdom Blob. That makes
// `expect(blob).toBeInstanceOf(Blob)` fail for legitimate blobs coming
// off `fetch`. Align `globalThis.Blob` with whatever class `Response.blob()`
// returns so `instanceof Blob` matches in tests.
beforeAll(async () => {
  const probe = await new Response(new Uint8Array([0])).blob();
  if (probe.constructor !== globalThis.Blob) {
    (globalThis as { Blob: typeof Blob }).Blob = probe.constructor as typeof Blob;
  }
});

// jsdom doesn't implement HTMLMediaElement.play() — components that fire SFX
// via `new Audio(src).play()` would otherwise spam stderr with "Not
// implemented" warnings on every tap. Stub it to a resolved Promise so the
// audio path is silent + non-throwing under tests.
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {
    /* no-op */
  };
}

afterEach(() => {
  cleanup();
});
