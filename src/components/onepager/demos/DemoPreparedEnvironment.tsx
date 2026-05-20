'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';
import { TrayItem, type TrayItemKind } from './TrayItem';

/** The three Montessori periods (introduce → recognize → recall) — same
 *  framing as Principle 03. Each period gets one distinctive tray so the
 *  visitor sees exactly what reshapes between them. */
type Period = 'introduce' | 'recognize' | 'recall';

const PERIODS: readonly Period[] = ['introduce', 'recognize', 'recall'];

const TRAYS: Readonly<Record<Period, readonly TrayItemKind[]>> = {
  // Chocolate throughout — the same material reshapes per period, which is
  // the whole point of the prepared environment. Introduce: a single half.
  // Recognize: a half beside its four quarters. Recall: four quarters that
  // rebuild the whole (the fill-the-whole beat).
  introduce: ['½'],
  recognize: ['½', '¼', '¼', '¼', '¼'],
  recall: ['¼', '¼', '¼', '¼'],
};

export function DemoPreparedEnvironment() {
  const [period, setPeriod] = useState<Period>('introduce');

  return (
    <DemoFrame label="the tray, per period">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PERIODS.map((p) => (
          <OrderToggle
            key={p}
            label={p}
            active={period === p}
            onClick={() => setPeriod(p)}
          />
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          padding: '22px 22px 18px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          minHeight: 110,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {TRAYS[period].map((item, i) => (
          <TrayItem key={`${period}-${i}-${item}`} item={item} delay={i * 60} />
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-mute)' }}>
        Each Montessori period reshapes the same chocolate. Nothing else is in
        the way.
      </div>
    </DemoFrame>
  );
}
