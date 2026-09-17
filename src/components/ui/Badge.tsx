import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { AreaId, ExamTier, Level } from '@/content/schema';
import { LEVEL_NAMES } from '@/content/schema';
import { DOMAIN_META, DOMAIN_INDEX } from '@/content/exam';
import { Icon } from './Icon';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'design' | 'outline';

const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-2 border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-150',
  success: 'bg-success-50 text-success-700 border-success-100',
  warning: 'bg-warning-50 text-warning-700 border-warning-100',
  danger: 'bg-danger-50 text-danger-700 border-danger-100',
  design: 'bg-design-50 text-design-700 border-design-100',
  outline: 'bg-transparent text-ink-3 border-line-strong',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-medium leading-none whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const tierLabel: Record<ExamTier, string> = { must: 'Must know', should: 'Should know', advanced: 'Beyond the exam' };

export function TierBadge({ tier, className }: { tier: ExamTier; className?: string }) {
  const style =
    tier === 'must'
      ? 'bg-brand-600 text-white border-brand-600'
      : tier === 'should'
        ? 'bg-brand-50 text-brand-700 border-brand-150'
        : 'bg-transparent text-ink-3 border-line-strong';
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold leading-none whitespace-nowrap',
        style,
        className,
      )}
      title={
        tier === 'must'
          ? 'Critical for AZ-104'
          : tier === 'should'
            ? 'Useful supporting knowledge'
            : 'Real-world depth beyond the core exam'
      }
    >
      {tierLabel[tier]}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-ink-2',
        className,
      )}
      title={LEVEL_NAMES[level].question}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className={cn('h-2.5 w-1 rounded-full', n <= level ? 'bg-brand-500' : 'bg-muted')} />
        ))}
      </span>
      L{level} · {LEVEL_NAMES[level].name}
    </span>
  );
}

export function AreaChip({ area, className, compact }: { area: AreaId; className?: string; compact?: boolean }) {
  if (area === 'foundations') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-ink-2', className)}>
        <span className="grid size-5 place-items-center rounded-md bg-design-50 text-design-700">
          <Icon name="cloud" className="size-3.5" />
        </span>
        {!compact && 'Foundations'}
      </span>
    );
  }
  const meta = DOMAIN_META[area];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-ink-2', className)}>
      <span className="grid size-5 place-items-center rounded-md" style={{ background: meta.soft, color: meta.ink }}>
        <Icon name={meta.icon} className="size-3.5" />
      </span>
      {!compact && DOMAIN_INDEX[area].shortTitle}
    </span>
  );
}

export function IconTile({
  area,
  icon,
  size = 'md',
  className,
}: {
  area?: AreaId;
  icon: Parameters<typeof Icon>[0]['name'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dims = size === 'sm' ? 'size-8 rounded-lg' : size === 'lg' ? 'size-14 rounded-2xl' : 'size-11 rounded-xl';
  const iconSize = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-7' : 'size-5';
  const style =
    area && area !== 'foundations'
      ? { background: DOMAIN_META[area].soft, color: DOMAIN_META[area].ink }
      : { background: 'var(--color-design-50)', color: 'var(--color-design-700)' };
  return (
    <span className={cn('grid shrink-0 place-items-center', dims, className)} style={style}>
      <Icon name={icon} className={iconSize} />
    </span>
  );
}
