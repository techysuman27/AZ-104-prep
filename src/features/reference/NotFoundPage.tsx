import { Compass } from 'lucide-react';
import { PageContainer } from '@/components/layout/Page';
import { LinkButton } from '@/components/ui/Button';
import { useUi } from '@/store/ui';

export default function NotFoundPage() {
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  return (
    <PageContainer>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Compass className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-[24px] font-semibold text-ink">This page doesn’t exist</h1>
        <p className="mt-2 text-[14.5px] text-ink-3">The link may be outdated. Search for the concept or lesson you were looking for.</p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink-2 hover:bg-subtle"
          >
            Search
          </button>
          <LinkButton to="/">Go to dashboard</LinkButton>
        </div>
      </div>
    </PageContainer>
  );
}
