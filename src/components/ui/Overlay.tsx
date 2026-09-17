import type { ReactNode } from 'react';
import { Dialog as RDialog, Tooltip as RTooltip, Tabs as RTabs, ToggleGroup } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <RTooltip.Root delayDuration={250}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs animate-fade-in rounded-lg bg-ink px-2.5 py-1.5 text-xs leading-snug text-white shadow-pop"
        >
          {content}
          <RTooltip.Arrow className="fill-ink" />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RTooltip.Provider>{children}</RTooltip.Provider>;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-ink/30 backdrop-blur-[2px]" />
        <RDialog.Content
          className={cn(
            'fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 animate-rise-in rounded-2xl border border-line bg-surface shadow-pop focus:outline-none',
            className,
          )}
        >
          <RDialog.Title className={cn('px-5 pt-5 text-base font-semibold text-ink', hideTitle && 'sr-only')}>
            {title}
          </RDialog.Title>
          {description ? (
            <RDialog.Description className={cn('px-5 pt-1 text-sm text-ink-3', hideTitle && 'sr-only')}>
              {description}
            </RDialog.Description>
          ) : (
            <RDialog.Description className="sr-only">{title}</RDialog.Description>
          )}
          {children}
          <RDialog.Close
            className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'right' | 'left';
  className?: string;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-ink/25" />
        <RDialog.Content
          className={cn(
            'fixed top-0 bottom-0 z-50 flex w-[min(100vw,440px)] flex-col border-line bg-surface shadow-pop focus:outline-none',
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
            'animate-fade-in',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <RDialog.Title className="text-base font-semibold text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-sm text-ink-3">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{title}</RDialog.Description>
              )}
            </div>
            <RDialog.Close
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </RDialog.Close>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  className,
  listClassName,
  variant = 'underline',
}: {
  tabs: { value: string; label: ReactNode; content: ReactNode }[];
  value?: string;
  onValueChange?: (v: string) => void;
  defaultValue?: string;
  className?: string;
  listClassName?: string;
  variant?: 'underline' | 'pill';
}) {
  return (
    <RTabs.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue ?? tabs[0]?.value}
      className={className}
    >
      <RTabs.List
        className={cn(
          'scrollbar-thin flex gap-1 overflow-x-auto',
          variant === 'underline' ? 'border-b border-line' : 'rounded-xl bg-subtle p-1',
          listClassName,
        )}
      >
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              'shrink-0 text-sm font-medium whitespace-nowrap text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:shadow-focus',
              variant === 'underline'
                ? '-mb-px border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-brand-600 data-[state=active]:text-ink'
                : 'rounded-lg px-3 py-1.5 data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-xs',
            )}
          >
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {tabs.map((t) => (
        <RTabs.Content key={t.value} value={t.value} className="focus-visible:outline-none">
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn('inline-flex rounded-xl border border-line bg-subtle p-0.5', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[10px] font-medium text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:shadow-focus data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-xs',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
          )}
        >
          {o.icon}
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
