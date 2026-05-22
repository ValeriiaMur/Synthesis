import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { PaperState } from './types';
import {
  FOLDS_BY_COUNT,
  type CornerSpec,
  type FoldCount,
  cornerStyleFor,
  countFromFolds,
  dragProgressFor,
  dropStyleFor,
  foldHint,
  nextFold,
  partFracFor,
  partsCountFor,
  specFor,
} from './paperFoldLogic';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';

export type DragState = {
  readonly startX: number;
  readonly startY: number;
  readonly x: number;
  readonly y: number;
  /** Offset inside the corner element where the pointer landed. */
  readonly gx: number;
  readonly gy: number;
  readonly w: number;
  readonly h: number;
  /** Workspace dimensions captured at pointerdown. The workspace can't
   *  resize mid-drag, so caching this avoids reading the ref during
   *  render (which would trip react-hooks/refs). */
  readonly wsWidth: number;
  readonly wsHeight: number;
};

export type UsePaperFoldArgs = {
  readonly value?: PaperState;
  readonly onChange?: (state: PaperState) => void;
  readonly disabled: boolean;
};

export type PaperFoldView = {
  readonly workspaceRef: RefObject<HTMLDivElement | null>;
  readonly folds: FoldCount;
  readonly drag: DragState | null;
  readonly dragProgress: number;
  readonly dragDirection: 'h' | 'v' | null;
  readonly cornerSpec: CornerSpec | null;
  readonly justFolded: boolean;
  readonly hint: string;
  readonly partsCount: number;
  readonly partFrac: string;
  readonly dropStyle: CSSProperties | null;
  readonly cornerStyle: CSSProperties | null;
  readonly dropActive: boolean;
  readonly onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  readonly onCornerKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  readonly unfold: () => void;
  readonly reset: () => void;
};

/**
 * Owns the PaperFold interaction: fold state, the live pointer-drag, the
 * keyboard fallback, the post-commit "just folded" flash, the onChange
 * bridge, and the fold SFX. Pure transforms live in `paperFoldLogic`; this
 * hook is the stateful shell so `PaperFold.tsx` only renders.
 */
export function usePaperFold({
  value,
  onChange,
  disabled,
}: UsePaperFoldArgs): PaperFoldView {
  const [folds, setFolds] = useState<FoldCount>(() => countFromFolds(value?.folds));
  const [drag, setDrag] = useState<DragState | null>(null);
  /** True for ~1.5s right after a fold commits. Lets the hint line briefly
   *  read in success-green ("yes — one fold…") before settling back to the
   *  observational idle copy. */
  const [justFolded, setJustFolded] = useState(false);
  const justFoldedTimerRef = useRef<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => () => {
      if (justFoldedTimerRef.current !== null) {
        window.clearTimeout(justFoldedTimerRef.current);
      }
    },
    [],
  );

  const flashJustFolded = useCallback(() => {
    if (justFoldedTimerRef.current !== null) {
      window.clearTimeout(justFoldedTimerRef.current);
    }
    setJustFolded(true);
    justFoldedTimerRef.current = window.setTimeout(() => {
      setJustFolded(false);
      justFoldedTimerRef.current = null;
    }, 1500);
  }, []);

  /* Stable ref for onChange so re-renders in the parent don't loop. */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ kind: 'paper', folds: FOLDS_BY_COUNT[folds] });
  }, [folds]);

  /* Play the paper-fold SFX whenever the fold count actually advances.
   * Effect-based so a single commit fires the sound once (vs. inlining
   * inside `setFolds`'s updater, which React may invoke twice in
   * StrictMode). The initial render is silent because the ref starts at
   * `folds` — a hydrated restore won't replay sounds for past folds. */
  const prevFoldsRef = useRef(folds);
  useEffect(() => {
    if (folds > prevFoldsRef.current) {
      getSfxPlayer().play('paperFold');
    }
    prevFoldsRef.current = folds;
  }, [folds]);

  const cornerSpec = useMemo(() => specFor(folds), [folds]);

  /* Live drag progress (0..1) — derived per render from cursor travel vs
     paper size. Workspace dimensions were captured at pointerdown so we
     don't read the ref during render. */
  const dragProgress = useMemo(() => {
    if (!drag || !cornerSpec) return 0;
    return dragProgressFor(cornerSpec.direction, drag);
  }, [drag, cornerSpec]);

  const dragDirection: 'h' | 'v' | null =
    drag && cornerSpec ? cornerSpec.direction : null;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled || !cornerSpec) return;
      const ws = workspaceRef.current;
      if (!ws) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const wsRect = ws.getBoundingClientRect();
      setDrag({
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        gx: e.clientX - rect.left,
        gy: e.clientY - rect.top,
        w: rect.width,
        h: rect.height,
        wsWidth: wsRect.width,
        wsHeight: wsRect.height,
      });
    },
    [disabled, cornerSpec],
  );

  /* Keyboard fallback — Enter / Space advances one fold without dragging.
     Mirrors what a successful drag would do. */
  const onCornerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || !cornerSpec) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      setFolds((f) => {
        if (f >= 2) return f;
        flashJustFolded();
        return nextFold(f);
      });
    },
    [disabled, cornerSpec, flashJustFolded],
  );

  /* Window-level pointer listeners drive the live drag + release. */
  useEffect(() => {
    if (!drag || !cornerSpec) return;
    const onMove = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
    };
    const onUp = (ev: PointerEvent) => {
      const progress = dragProgressFor(cornerSpec.direction, {
        ...drag,
        x: ev.clientX,
        y: ev.clientY,
      });
      if (progress > 0.5) {
        setFolds((f) => {
          if (f >= 2) return f;
          flashJustFolded();
          return nextFold(f);
        });
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, cornerSpec, flashJustFolded]);

  const unfold = useCallback(() => {
    if (disabled) return;
    setFolds((f) => (f > 0 ? ((f - 1) as FoldCount) : f));
  }, [disabled]);

  const reset = useCallback(() => {
    if (disabled) return;
    setFolds(0);
  }, [disabled]);

  const hint = foldHint({
    dragging: drag !== null,
    dragProgress,
    justFolded,
    folds,
    cornerHint: cornerSpec?.hint,
  });

  return {
    workspaceRef,
    folds,
    drag,
    dragProgress,
    dragDirection,
    cornerSpec,
    justFolded,
    hint,
    partsCount: partsCountFor(folds),
    partFrac: partFracFor(folds),
    dropStyle: dropStyleFor(folds),
    cornerStyle: cornerSpec ? cornerStyleFor(cornerSpec) : null,
    dropActive: dragProgress > 0.5,
    onPointerDown,
    onCornerKeyDown,
    unfold,
    reset,
  };
}
