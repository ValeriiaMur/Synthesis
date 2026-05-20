import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Prose } from './Prose';

describe('Prose', () => {
  it('renders plain text unchanged when no highlight tokens are present', () => {
    render(<Prose text="A chocolate bar sits on the table." />);
    expect(
      screen.getByText('A chocolate bar sits on the table.'),
    ).toBeInTheDocument();
  });

  it('wraps {y}…{/y} in an <em>', () => {
    render(<Prose text="Here is a {y}half-bar{/y}." />);
    const el = screen.getByText('half-bar');
    expect(el.tagName.toLowerCase()).toBe('em');
  });

  it('wraps {r}…{/r} in a span with the red class', () => {
    render(<Prose text="Take {r}two{/r} pieces." />);
    expect(screen.getByText('two').className).toMatch(/red/i);
  });

  it('wraps {b}…{/b} in a span with the blue class', () => {
    render(<Prose text="Look at {b}four{/b} slices." />);
    expect(screen.getByText('four').className).toMatch(/blue/i);
  });

  it('wraps {g}…{/g} in a span with the green class', () => {
    render(<Prose text="Trace {g}one half{/g}." />);
    expect(screen.getByText('one half').className).toMatch(/green/i);
  });

  it('renders multiple tokens of different colors in one paragraph', () => {
    render(<Prose text="The {r}2{/r} pieces equal {b}1{/b} half." />);
    expect(screen.getByText('2').className).toMatch(/red/i);
    expect(screen.getByText('1').className).toMatch(/blue/i);
  });

  it('preserves text outside any token', () => {
    const { container } = render(
      <Prose text="Here is {y}half{/y}, and that is good." />,
    );
    expect(container.textContent).toBe('Here is half, and that is good.');
  });

  it('leaves an unclosed token literal so content is never lost', () => {
    render(<Prose text="Unclosed {y}token here" />);
    expect(screen.getByText(/Unclosed \{y\}token here/)).toBeInTheDocument();
  });

  it('does not render an "ARI" narrator label — the material is the lesson', () => {
    const { container } = render(<Prose text="hello there" />);
    expect(container.textContent).not.toContain('ARI');
  });
});
