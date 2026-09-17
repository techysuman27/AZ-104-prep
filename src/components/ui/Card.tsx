import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, interactive, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        interactive &&
          'transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">{eyebrow}</div>}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-8', className)}>
      {eyebrow && <div className="mb-2 flex flex-wrap items-center gap-2">{eyebrow}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">{title}</h1>
          {description && <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-3 text-ink-4">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-subtle px-1 font-sans text-[11px] font-medium text-ink-3',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse-soft rounded-lg bg-muted', className)} />;
}
