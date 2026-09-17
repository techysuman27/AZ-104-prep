import { useId } from 'react';
import { Switch as RSwitch } from 'radix-ui';
import { cn } from '@/lib/cn';

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  className,
  hideLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={hideLabel ? label : undefined}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-line-strong transition-colors focus-visible:outline-none focus-visible:shadow-focus data-[state=checked]:bg-brand-600"
      >
        <RSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-xs transition-transform duration-200 data-[state=checked]:translate-x-[18px]" />
      </RSwitch.Root>
      {!hideLabel && (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="block text-[13px] font-medium text-ink-2">{label}</span>
          {description && <span className="block text-2xs text-ink-3">{description}</span>}
        </label>
      )}
    </div>
  );
}
