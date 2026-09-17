import { CREATOR } from '@/lib/creator';
import { cn } from '@/lib/cn';

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/** Compact credit card for the sidebar footer. */
export function CreatorCard({ className }: { className?: string }) {
  const initials = CREATOR.name
    .split(' ')
    .map((p) => p[0])
    .join('');
  return (
    <a
      href={CREATOR.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-center gap-2.5 rounded-xl border border-line bg-subtle/60 px-2.5 py-2 transition-colors hover:border-line-strong hover:bg-surface',
        className,
      )}
      aria-label={`Built by ${CREATOR.name}, ${CREATOR.role}. Open LinkedIn profile in a new tab.`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-[11.5px] font-semibold text-white" aria-hidden="true">
        {initials}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-2xs font-medium tracking-wide text-ink-4 uppercase">Built by</span>
        <span className="block truncate text-[13px] font-semibold text-ink">{CREATOR.name}</span>
        <span className="block truncate text-2xs text-ink-3">{CREATOR.role}</span>
      </span>
      <LinkedInMark className="size-4 shrink-0 text-[#0a66c2] opacity-80 group-hover:opacity-100" />
    </a>
  );
}

/** One-line credit for the bottom of every page. */
export function CreatorFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t border-line px-4 py-5 sm:px-8', className)}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12.5px] text-ink-3">
        <p>
          Stratus — an interactive AZ-104 learning platform, designed and built by{' '}
          <a href={CREATOR.linkedin} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 underline-offset-2 hover:text-brand-700 hover:underline">
            {CREATOR.name}
          </a>
          <span className="text-ink-4"> · {CREATOR.role}</span>
        </p>
        <a
          href={CREATOR.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-[#0a66c2] hover:underline"
        >
          <LinkedInMark className="size-3.5" />
          Connect on LinkedIn
        </a>
      </div>
      <p className="mx-auto mt-2 max-w-7xl text-2xs text-ink-4">
        Independent study resource. Not affiliated with or endorsed by Microsoft. Content is verified against Microsoft Learn documentation.
      </p>
    </footer>
  );
}
