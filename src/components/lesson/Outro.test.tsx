import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Outro } from './Outro';

describe('Outro — final section', () => {
  it('shows the quiet "keep going" cue before the lesson is done', () => {
    const { container } = render(<Outro done={false} studentName="Lera" />);
    expect(container.textContent).toContain('keep going');
    // No personalized greeting until the lesson is finished.
    expect(container.textContent).not.toContain('Nice work');
  });

  it('greets the learner by name in the finished state', () => {
    const { container } = render(<Outro done studentName="Lera" />);
    expect(container.textContent).toContain('Nice work, Lera');
    expect(container.textContent).toContain('four quarters make one whole');
  });

  it('title-cases the name in the greeting', () => {
    const { container } = render(<Outro done studentName="lera" />);
    expect(container.textContent).toContain('Nice work, Lera');
  });

  it('falls back to the un-named closing copy when no name is given', () => {
    const { container } = render(<Outro done studentName="" />);
    expect(container.textContent).toContain('You split a whole');
    expect(container.textContent).not.toContain('Nice work');
  });
});
