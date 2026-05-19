import type { Beat, ManipulativeState } from '@/lib/lesson/types';
import { ChocolateBar } from '@/components/manipulatives/ChocolateBar';
import { PizzaSlicer } from '@/components/manipulatives/PizzaSlicer';
import { PaperFold } from '@/components/manipulatives/PaperFold';
import { FractionBox } from '@/components/manipulatives/FractionBox';
import { BlockStudio } from '@/components/manipulatives/BlockStudio/BlockStudio';

type Manip = NonNullable<Beat['manipulative']>;

export type ManipulativeSlotProps = {
  readonly manip: Manip;
  readonly value: ManipulativeState | undefined;
  readonly onChange: (s: ManipulativeState) => void;
  readonly disabled: boolean;
};

export function ManipulativeSlot({
  manip,
  value,
  onChange,
  disabled,
}: ManipulativeSlotProps): React.ReactElement | null {
  if (manip.kind === 'chocolate') {
    return (
      <ChocolateBar
        value={value?.kind === 'chocolate' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'pizza') {
    return (
      <PizzaSlicer
        value={value?.kind === 'pizza' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'paper') {
    return (
      <PaperFold
        value={value?.kind === 'paper' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'blockstudio') {
    return (
      <BlockStudio
        config={manip}
        value={value?.kind === 'blockstudio' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  return (
    <FractionBox
      config={manip}
      value={value?.kind === 'fractionbox' ? value : undefined}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
