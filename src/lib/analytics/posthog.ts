// Minimal PostHog wrapper for product analytics. The only event the app
// captures right now is the end-of-lesson feedback choice, so this stays
// deliberately small:
//
//   - Client-only. No-ops during SSR and in tests.
//   - Gated on NEXT_PUBLIC_POSTHOG_KEY. Without it, capture is a no-op and
//     posthog-js is never even imported — the lesson runs identically with
//     no analytics, same posture as the optional ElevenLabs voice.
//   - Lazy: posthog-js is dynamically imported on the first real capture so
//     it never loads for visitors when the key is absent.
//
// To enable: set NEXT_PUBLIC_POSTHOG_KEY (and optionally
// NEXT_PUBLIC_POSTHOG_HOST, defaults to PostHog US cloud) in the
// environment. Then view events in PostHog → Activity, and set up an
// Alert / Destination there to get emailed or Slacked when
// `lesson_feedback` fires.

type PostHogClient = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
};

let client: PostHogClient | null = null;
let initStarted = false;

async function ensureClient(): Promise<PostHogClient | null> {
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (client) return client;
  if (initStarted) return client;
  initStarted = true;
  const mod = await import('posthog-js');
  const ph = mod.default as unknown as PostHogClient;
  ph.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: false,
    autocapture: false,
    person_profiles: 'identified_only',
  });
  client = ph;
  return client;
}

/**
 * Fire-and-forget event capture. Safe to call anywhere on the client;
 * resolves to nothing and never throws. No-ops without a configured key.
 */
export async function captureEvent(
  event: string,
  props?: Record<string, unknown>,
): Promise<void> {
  try {
    const ph = await ensureClient();
    ph?.capture(event, props);
  } catch {
    // Analytics must never break the lesson.
  }
}
