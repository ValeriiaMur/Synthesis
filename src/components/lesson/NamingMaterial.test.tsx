import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NamingMaterial } from './NamingMaterial';
import type { NamingConfig, NamingState } from '@/lib/lesson/types';

function Harness({ config }: { config: NamingConfig }) {
  const [state, setState] = useState<NamingState>({ kind: 'naming', tapped: [] });
  return (
    <>
      <NamingMaterial config={config} value={state} onChange={setState} />
      <div data-testid="tapped-count">{state.tapped.length}</div>
    </>
  );
}

const halvesOnly: NamingConfig = { kind: 'naming', fractions: ['half'] };
const quartersOnly: NamingConfig = { kind: 'naming', fractions: ['quarter'] };
const mixed: NamingConfig = {
  kind: 'naming',
  fractions: ['half', 'quarter'],
};

describe('NamingMaterial layout', () => {
  it('L1 halves-only: renders 2 half-tagged regions, no prompt label', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(2);
    pieces.forEach((p) => expect(p.dataset.kind).toBe('half'));
    expect(screen.queryByText(/tap the/i)).toBeNull();
  });

  it('L2 quarters-only: renders 4 quarter-tagged regions, no prompt label', () => {
    render(<Harness config={quartersOnly} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(4);
    pieces.forEach((p) => expect(p.dataset.kind).toBe('quarter'));
    expect(screen.queryByText(/tap the/i)).toBeNull();
  });

  it('L3 mixed: renders 4 quarters with the half centered, shows the prompt label', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    expect(pieces).toHaveLength(5);
    // Half is centered at index 2; the rest are quarters.
    expect(pieces[2].dataset.kind).toBe('half');
    [0, 1, 3, 4].forEach((i) => expect(pieces[i].dataset.kind).toBe('quarter'));
    expect(screen.getByText(/tap the/i)).toBeInTheDocument();
  });
});

describe('NamingMaterial tap-each-piece behaviour', () => {
  it('L1: each unique half tap adds to tapped, repeats are silent', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    expect(screen.getByTestId('tapped-count').textContent).toBe('1');
    fireEvent.click(pieces[0]); // repeat — should be silent
    expect(screen.getByTestId('tapped-count').textContent).toBe('1');
    fireEvent.click(pieces[1]); // the other half
    expect(screen.getByTestId('tapped-count').textContent).toBe('2');
  });

  it('L2: each unique quarter tap adds to tapped', () => {
    render(<Harness config={quartersOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[2]);
    expect(screen.getByTestId('tapped-count').textContent).toBe('1');
    fireEvent.click(pieces[2]); // repeat
    expect(screen.getByTestId('tapped-count').textContent).toBe('1');
    fireEvent.click(pieces[0]);
    expect(screen.getByTestId('tapped-count').textContent).toBe('2');
  });

  it('L3: tapping the centered half on a "half" prompt adds it to tapped', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[2]); // the half tile (centered)
    expect(screen.getByTestId('tapped-count').textContent).toBe('1');
  });

  it('L3: tapping a quarter on a "half" prompt is silent (tapped unchanged)', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]); // a quarter on the half-prompt
    expect(screen.getByTestId('tapped-count').textContent).toBe('0');
  });

  it('L3: prompt switches to quarter once the half has been tapped', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    expect(screen.getByText('half')).toBeInTheDocument();
    fireEvent.click(pieces[2]); // the centered half
    expect(screen.getByText('quarter')).toBeInTheDocument();
    fireEvent.click(pieces[0]); // a quarter
    expect(screen.getByTestId('tapped-count').textContent).toBe('2');
    // Quarter prompt persists until all 4 quarters are tapped.
    expect(screen.getByText('quarter')).toBeInTheDocument();
  });

  it('marks tapped pieces with a data-tapped attribute', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    expect(pieces[0].dataset.tapped).toBe('true');
    expect(pieces[1].dataset.tapped).toBeUndefined();
  });

  it('disabled prop blocks all taps', () => {
    render(
      <NamingMaterial
        config={halvesOnly}
        value={{ kind: 'naming', tapped: [] }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const pieces = screen.getAllByRole('button');
    pieces.forEach((p) => expect(p).toBeDisabled());
    fireEvent.click(pieces[0]);
  });

  it('lift animation marks the tapped region', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    expect(pieces[0].dataset.lifted).toBe('true');
  });
});

describe('NamingMaterial observational feedback', () => {
  it('L1: correct tap shows a success feedback line naming the half', () => {
    render(<Harness config={halvesOnly} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[0]);
    const fb = screen.getByTestId('naming-feedback');
    expect(fb.textContent ?? '').toMatch(/half/i);
    expect(fb.className).toMatch(/is-success/);
  });

  it('L3 wrong tap: observation feedback names the tapped kind + points back', () => {
    render(<Harness config={mixed} />);
    const pieces = screen.getAllByRole('button');
    fireEvent.click(pieces[1]); // quarter on a half-prompt
    const fb = screen.getByTestId('naming-feedback');
    expect(fb.textContent ?? '').toMatch(/quarter/i);
    expect(fb.textContent ?? '').toMatch(/find the half/i);
    expect(fb.className).toMatch(/is-observation/);
    expect(screen.getByTestId('tapped-count').textContent).toBe('0');
  });
});
