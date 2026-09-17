import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const chunkError =
    error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed/i.test(error.message);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-warning-50 text-warning-700">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold text-ink">
        {notFound ? 'Page not found' : chunkError ? 'A new version is available' : 'Something went wrong'}
      </h1>
      <p className="mt-2 text-ink-3">
        {notFound
          ? 'The page you were looking for does not exist.'
          : chunkError
            ? 'Stratus was updated while this tab was open. Reload to get the latest version.'
            : 'This page hit an unexpected error. Your progress is saved locally and is not affected.'}
      </p>
      {!notFound && !chunkError && error instanceof Error && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-subtle px-3 py-2 text-left text-xs text-ink-3">{error.message}</pre>
      )}
      <div className="mt-6 flex gap-2">
        <Button icon={<RotateCcw className="size-4" />} onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Link to="/" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-ink-2 hover:bg-subtle">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
