import { useMemo, type ReactNode } from 'react';

export type ProseProps = {
  /** Text with inline highlight tokens: `{y}…{/y}`, `{r}…{/r}`, `{b}`, `{g}`. */
  readonly text: string;
};

type TokenColor = 'y' | 'r' | 'b' | 'g';

type Segment =
  | { readonly kind: 'plain'; readonly text: string }
  | { readonly kind: 'mark'; readonly color: TokenColor; readonly text: string };

const TOKEN_RE = /\{([yrbg])\}([\s\S]*?)\{\/\1\}/g;

function tokenize(input: string): readonly Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  TOKEN_RE.lastIndex = 0;
  for (let m = TOKEN_RE.exec(input); m !== null; m = TOKEN_RE.exec(input)) {
    if (m.index > cursor) {
      segments.push({ kind: 'plain', text: input.slice(cursor, m.index) });
    }
    segments.push({ kind: 'mark', color: m[1] as TokenColor, text: m[2] });
    cursor = m.index + m[0].length;
  }
  if (cursor < input.length) {
    segments.push({ kind: 'plain', text: input.slice(cursor) });
  }
  return segments;
}

const CLASS_FOR: Readonly<Record<TokenColor, string>> = {
  y: '',
  r: 'num-red',
  b: 'num-blue',
  g: 'num-green',
};

function renderSegment(seg: Segment, i: number): ReactNode {
  if (seg.kind === 'plain') return <span key={i}>{seg.text}</span>;
  if (seg.color === 'y') return <em key={i}>{seg.text}</em>;
  return (
    <span key={i} className={CLASS_FOR[seg.color]}>
      {seg.text}
    </span>
  );
}

/**
 * Renders the beat's prose, expanding the inline highlight tokens into
 * colored spans. The narrator-name label that used to prefix each line
 * ("ARI") was removed — the material does the talking now; the prose is
 * just a single observational instruction.
 *
 * Matches the cosmos-palette design: yellow emphasis via `<em>`, numerals via
 * `.num-red` / `.num-blue` / `.num-green` (color rules live in globals.css).
 */
export function Prose({ text }: ProseProps) {
  const segments = useMemo(() => tokenize(text), [text]);
  return <p className="prose">{segments.map(renderSegment)}</p>;
}
