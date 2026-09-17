import { cn } from '@/lib/cn';
import { clamp } from '@/lib/format';

export function ProgressBar({
  value,
  className,
  tone = 'brand',
  label,
  size = 'md',
}: {
  value: number;
  className?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'ink';
  label?: string;
  size?: 'sm' | 'md';
}) {
  const v = clamp(value, 0, 1);
  const fill =
    tone === 'success'
      ? 'bg-success-600'
      : tone === 'warning'
        ? 'bg-warning-500'
        : tone === 'danger'
          ? 'bg-danger-500'
          : tone === 'ink'
            ? 'bg-ink'
            : 'bg-brand-500';
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  className,
  children,
  label,
  color = 'var(--color-brand-500)',
  track = 'var(--color-muted)',
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  color?: string;
  track?: string;
}) {
  const v = clamp(value, 0, 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(v * 100)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
