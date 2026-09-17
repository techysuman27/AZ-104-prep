import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function PageContainer({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9', wide ? 'max-w-[1400px]' : 'max-w-[1180px]', className)}>
      {children}
    </div>
  );
}

export function Breadcrumbs({ items, className }: { items: { label: string; to?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-3">
        {items.map((it, i) => (
          <Fragment key={`${it.label}-${i}`}>
            {i > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="size-3.5 text-ink-4" />
              </li>
            )}
            <li className="min-w-0">
              {it.to && i < items.length - 1 ? (
                <Link to={it.to} className="rounded hover:text-ink hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span aria-current={i === items.length - 1 ? 'page' : undefined} className="block truncate font-medium text-ink-2">
                  {it.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
