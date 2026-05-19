export type OutroProps = {
  readonly done: boolean;
};

/**
 * Past-tense, descriptive log of what the kid did at each of the six stops.
 * One line per beat, numbered, no praise, no badges. The closing line names
 * the pattern the kid uncovered without telling them they "did great" —
 * the discovery is the reward (Montessori principle 04: description, not
 * praise; principle 07: aesthetic minimalism). The story-card / green-pill
 * / gradient celebration treatment was removed to keep the close from
 * reading like a video-game "achievement unlocked".
 */
const ENTRIES: readonly { readonly idx: string; readonly text: string }[] = [
  { idx: '01', text: 'Tray loaded — 2 quarter-squares filled half the bar.' },
  { idx: '02', text: 'Logged — 2 squares on the half-tray.' },
  { idx: '03', text: 'Pizza cut — 2 halves became 4 slices.' },
  { idx: '04', text: 'Share confirmed — 2 slices covered 1 half.' },
  { idx: '05', text: 'Star-map folded — 1 half held 2 quarters.' },
  { idx: '06', text: 'Warp-lock built — 1 whole, two ways.' },
];

/**
 * Closing block. While the trip is in progress, a quiet caption nudges the
 * pilot forward. When all six cells are done, the mission log replaces it —
 * a calm, descriptive recap of what the kid actually did at each stop.
 */
export function Outro({ done }: OutroProps) {
  if (!done) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 0 20px',
          color: 'var(--ink-faint)',
          fontSize: 13,
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        — finish the stops above —
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 48,
        padding: '8px 30px 56px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.22em',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
          marginBottom: 32,
        }}
      >
        delivery manifest · spirit
      </div>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          textAlign: 'left',
        }}
      >
        {ENTRIES.map((entry) => (
          <li
            key={entry.idx}
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                fontSize: 11,
                letterSpacing: '0.16em',
                color: 'var(--ink-faint)',
                minWidth: 28,
                flexShrink: 0,
              }}
            >
              {entry.idx}
            </span>
            <span
              style={{
                fontSize: 15,
                color: 'var(--ink-soft)',
                fontWeight: 300,
                lineHeight: 1.55,
              }}
            >
              {entry.text}
            </span>
          </li>
        ))}
      </ol>
      <div
        style={{
          marginTop: 36,
          fontSize: 16,
          color: 'var(--ink)',
          fontWeight: 300,
        }}
      >
        Same amount, every stop.
      </div>
    </div>
  );
}
