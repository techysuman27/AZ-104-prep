import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0f1729" />
      <path d="M8 11.5h11" stroke="#86b6ef" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 16h16" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 20.5h11" stroke="#3987e5" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-ink">Stratus</span>
        <span className="mt-1 text-2xs font-medium text-ink-3">AZ-104 Azure Administrator</span>
      </span>
    </span>
  );
}
