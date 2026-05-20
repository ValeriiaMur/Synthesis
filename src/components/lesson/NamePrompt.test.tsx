import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

let resolveSetMuted: (() => void) | null = null;
let rejectSetMuted: ((e: Error) => void) | null = null;
const setMutedMock = vi.fn<(muted: boolean) => Promise<void>>();

vi.mock('@/lib/audio/ambientPlayer', () => ({
  getAmbientPlayer: () => ({
    setMuted: (muted: boolean) => setMutedMock(muted),
    isMuted: () => true,
    start: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    subscribe: () => () => {},
  }),
}));

import { NamePrompt } from './NamePrompt';

beforeEach(() => {
  setMutedMock.mockReset();
  setMutedMock.mockImplementation(
    () =>
      new Promise<void>((resolve, reject) => {
        resolveSetMuted = resolve;
        rejectSetMuted = reject;
      }),
  );
  resolveSetMuted = null;
  rejectSetMuted = null;
});

describe('NamePrompt', () => {
  it('renders an input and a submit button', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start|go|begin/i }),
    ).toBeInTheDocument();
  });

  it('uses neutral copy — no "Ari" or "story" anywhere', () => {
    const { container } = render(<NamePrompt onSubmit={() => {}} />);
    expect(container.textContent).not.toMatch(/\bAri\b/);
    expect(container.textContent ?? '').not.toMatch(/story/i);
  });

  it('starts with a sound-check button and the name field disabled', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    expect(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /name/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /start|go|begin/i }),
    ).toBeDisabled();
  });

  it('unmutes the ambient player when the sound check is clicked', () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    expect(setMutedMock).toHaveBeenCalledWith(false);
  });

  it('reveals the "I hear it" confirm button after the ambient player resolves', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );

    // While the promise is pending, no confirm button yet.
    expect(screen.queryByRole('button', { name: /i hear it|yes/i })).toBeNull();

    await act(async () => {
      resolveSetMuted?.();
    });

    expect(
      await screen.findByRole('button', { name: /i hear it|yes/i }),
    ).toBeInTheDocument();
  });

  it('enables the name field after the user confirms they heard the sound', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSetMuted?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /name/i })).not.toBeDisabled();
    });
  });

  it('submits the trimmed name after the audio gate is passed', async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSetMuted?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    const input = await screen.findByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '  Lera  ' } });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));

    expect(onSubmit).toHaveBeenCalledWith('Lera');
  });

  it('lets the user retry when the ambient player rejects', async () => {
    render(<NamePrompt onSubmit={() => {}} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );

    await act(async () => {
      rejectSetMuted?.(new Error('blocked'));
    });

    // After failure, the play button is offered again.
    expect(
      await screen.findByRole('button', {
        name: /play (a )?sound|test sound|try again|hear/i,
      }),
    ).toBeInTheDocument();
    // Name field still disabled — audio not confirmed.
    expect(screen.getByRole('textbox', { name: /name/i })).toBeDisabled();
  });

  it('does not submit when the name is whitespace-only even after audio is confirmed', async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);
    fireEvent.click(
      screen.getByRole('button', { name: /play (a )?sound|test sound|hear/i }),
    );
    await act(async () => {
      resolveSetMuted?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /i hear it|yes/i }));

    const input = await screen.findByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /start|go|begin/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
