import { useState } from 'react';
import { CircleCheck, CircleX, FileText, FolderX, Lock, PenLine, RotateCcw, Trash } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';

type Action = 'delete-blob' | 'overwrite-blob' | 'delete-container' | 'delete-account';

const ACTIONS: { id: Action; label: string; icon: typeof Trash }[] = [
  { id: 'delete-blob', label: 'Delete report.pdf', icon: Trash },
  { id: 'overwrite-blob', label: 'Overwrite report.pdf with bad data', icon: PenLine },
  { id: 'delete-container', label: 'Delete the “finance” container', icon: FolderX },
  { id: 'delete-account', label: 'Delete the storage account', icon: Trash },
];

export default function BlobProtection() {
  const [blobSoft, setBlobSoft] = useState(true);
  const [containerSoft, setContainerSoft] = useState(false);
  const [versioning, setVersioning] = useState(false);
  const [lock, setLock] = useState(false);
  const [action, setAction] = useState<Action | null>(null);

  const result = (() => {
    if (!action) return null;
    switch (action) {
      case 'delete-blob': {
        const options: string[] = [];
        if (versioning) options.push('Versioning: the current version became a previous version — copy it back over report.pdf to restore.');
        if (blobSoft) options.push('Blob soft delete: restore the blob with Undelete during the retention period.');
        return { ok: options.length > 0, happened: 'report.pdf was deleted.', options, missing: 'Enable blob soft delete or versioning before the next accident.' };
      }
      case 'overwrite-blob': {
        const options: string[] = [];
        if (versioning) options.push('Versioning: the previous content is kept as a previous version — promote it.');
        if (blobSoft && !versioning) options.push('Blob soft delete: the overwrite created a soft-deleted snapshot of the old content that you can restore.');
        return { ok: options.length > 0, happened: 'report.pdf now contains bad data.', options, missing: 'Without versioning or blob soft delete, the previous content is gone.' };
      }
      case 'delete-container': {
        const options: string[] = [];
        if (containerSoft) options.push('Container soft delete: Restore Container brings back the container and all its blobs — to its original name only.');
        return {
          ok: options.length > 0,
          happened: 'The finance container and every blob in it were deleted.',
          options,
          missing: blobSoft || versioning ? 'Blob soft delete and versioning don’t help here — recovering a deleted container needs container soft delete.' : 'Enable container soft delete.',
        };
      }
      case 'delete-account': {
        if (lock) return { ok: true, happened: 'The delete request was rejected.', options: ['The CanNotDelete lock blocked the deletion for everyone, including Owners.'], missing: '' };
        return { ok: false, happened: 'The storage account was deleted.', options: [], missing: 'Soft delete and versioning live inside the account, so they can’t recover it. Prevent this with a CanNotDelete lock.' };
      }
    }
  })();

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Protection on stfinance</div>
        <Switch checked={blobSoft} onCheckedChange={setBlobSoft} label="Blob soft delete" description="Retention 14 days" />
        <Switch checked={containerSoft} onCheckedChange={setContainerSoft} label="Container soft delete" description="Retention 14 days" />
        <Switch checked={versioning} onCheckedChange={setVersioning} label="Blob versioning" description="Keep previous versions" />
        <Switch checked={lock} onCheckedChange={setLock} label="CanNotDelete lock" description="On the storage account" />
        <div className="border-t border-line pt-4">
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Something goes wrong</div>
          <div className="space-y-1.5">
            {ACTIONS.map((a) => (
              <button key={a.id} type="button" onClick={() => setAction(a.id)} aria-pressed={action === a.id} className={cn('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px]', action === a.id ? 'border-danger-500/50 bg-danger-50 text-danger-700' : 'border-line text-ink-2 hover:border-line-strong')}>
                <a.icon className="size-4 shrink-0" aria-hidden="true" /> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4" aria-live="polite">
        {!result ? (
          <div className="grid h-full min-h-48 place-items-center rounded-xl border border-dashed border-line-strong text-center text-[13.5px] text-ink-3">
            <div>
              <FileText className="mx-auto mb-2 size-6 text-ink-4" aria-hidden="true" />
              Choose protection settings, then pick an accident.
            </div>
          </div>
        ) : (
          <div key={`${action}-${blobSoft}-${containerSoft}-${versioning}-${lock}`} className="animate-rise-in space-y-3">
            <div className="rounded-xl border border-line bg-subtle/60 px-4 py-3 text-[14px] text-ink">
              <span className="font-semibold">What happened: </span>
              {result.happened}
            </div>
            <div className={cn('rounded-xl px-4 py-3', result.ok ? 'bg-success-50' : 'bg-danger-50')}>
              <div className={cn('flex items-center gap-2 text-[15px] font-semibold', result.ok ? 'text-success-700' : 'text-danger-700')}>
                {result.ok ? <CircleCheck className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
                {result.ok ? (action === 'delete-account' ? 'Prevented' : 'Recoverable') : 'Not recoverable'}
              </div>
              {result.options.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {result.options.map((o) => (
                    <li key={o} className="flex gap-2 text-[13.5px] text-ink-2">
                      {action === 'delete-account' ? <Lock className="mt-0.5 size-4 shrink-0 text-success-700" aria-hidden="true" /> : <RotateCcw className="mt-0.5 size-4 shrink-0 text-success-700" aria-hidden="true" />}
                      {o}
                    </li>
                  ))}
                </ul>
              )}
              {result.missing && <p className="mt-2 text-[13px] text-ink-2">{result.missing}</p>}
            </div>
            <p className="text-xs text-ink-3">Microsoft recommends enabling blob soft delete, container soft delete and versioning together — and locking accounts that hold critical data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
