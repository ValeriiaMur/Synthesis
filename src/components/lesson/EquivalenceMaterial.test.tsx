import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquivalenceMaterial } from './EquivalenceMaterial';
import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';

const config: EquivalenceConfig = { kind: 'equivalence', targetCount: 4 };

function Harness() {
  const [state, setState] = useState<EquivalenceState>({
    kind: 'equivalence',
    placedCount: 0,
  });
  return (
    <>
      <EquivalenceMaterial config={config} value={state} onChange={setState} />
      <div data-testid="placed">{state.placedCount}</div>
    </>
  );
}

describe('EquivalenceMaterial — fill the whole (target = 4)', () => {
  it('renders one tray + a pile of quarter buttons', () => {
    render(<Harness />);
    expect(screen.getByTestId('equivalence-whole')).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/place quarter on the whole/i).length,
    ).toBeGreaterThan(0);
  });

  it('shows four empty slots before any taps', () => {
    render(<Harness />);
    const slots = screen.getAllByTestId('equivalence-slot');
    expect(slots).toHaveLength(4);
    slots.forEach((s) => expect(s.dataset.filled).toBeUndefined());
  });

  it('first tap: placedCount 0 → 1, slot 0 fills', () => {
    render(<Harness />);
    fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    expect(screen.getByTestId('placed').textContent).toBe('1');
    const slots = screen.getAllByTestId('equivalence-slot');
    expect(slots[0].dataset.filled).toBe('true');
    expect(slots[1].dataset.filled).toBeUndefined();
  });

  it('four taps fill all slots and mark the whole as covered', () => {
    render(<Harness />);
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    }
    expect(screen.getByTestId('placed').textContent).toBe('4');
    const slots = screen.getAllByTestId('equivalence-slot');
    slots.forEach((s) => expect(s.dataset.filled).toBe('true'));
    expect(screen.getByTestId('equivalence-whole').dataset.covered).toBe('true');
  });

  it('shows the hammer once the whole is filled (and hides the pile)', () => {
    render(<Harness />);
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    }
    expect(
      screen.getByLabelText(/drag the hammer onto the bar/i),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByLabelText(/place quarter/i).length,
    ).toBe(0);
  });

  it('hammer activation (Enter) breaks the bar — placedCount resets to 0', () => {
    render(<Harness />);
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    }
    expect(screen.getByTestId('placed').textContent).toBe('4');
    fireEvent.keyDown(screen.getByLabelText(/drag the hammer/i), {
      key: 'Enter',
    });
    expect(screen.getByTestId('placed').textContent).toBe('0');
    // Pile comes back so the kid can fill again.
    expect(
      screen.getAllByLabelText(/place quarter/i).length,
    ).toBeGreaterThan(0);
  });

  it('shows observational status at every step', () => {
    render(<Harness />);
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /tap a quarter/,
    );
    fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /3 more/,
    );
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getAllByLabelText(/place quarter/i)[0]);
    }
    expect(screen.getByTestId('equivalence-status').textContent ?? '').toMatch(
      /four quarters fill the whole/,
    );
  });

  it('disabled blocks all taps even when not yet covered', () => {
    render(
      <EquivalenceMaterial
        config={config}
        value={{ kind: 'equivalence', placedCount: 0 }}
        onChange={() => {
          throw new Error('onChange should not fire when disabled');
        }}
        disabled
      />,
    );
    const pile = screen.getAllByLabelText(/place quarter/i);
    pile.forEach((b) => expect(b).toBeDisabled());
    fireEvent.click(pile[0]);
  });
});
