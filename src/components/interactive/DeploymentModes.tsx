import { useState } from 'react';
import { ArrowRight, CircleCheck, Database, Globe, Server, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

type Mode = 'Incremental' | 'Complete';

interface Res {
  id: string;
  name: string;
  type: string;
  icon: 'net' | 'storage' | 'vm';
  /** Already deployed in the resource group. */
  existing: boolean;
}

const EXISTING: Res[] = [
  { id: 'vnet', name: 'vnet-app', type: 'Microsoft.Network/virtualNetworks', icon: 'net', existing: true },
  { id: 'st', name: 'stappdata001', type: 'Microsoft.Storage/storageAccounts', icon: 'storage', existing: true },
  { id: 'vm', name: 'vm-legacy01', type: 'Microsoft.Compute/virtualMachines', icon: 'vm', existing: true },
];

const NEW: Res = { id: 'lb', name: 'lb-web', type: 'Microsoft.Network/loadBalancers', icon: 'net', existing: false };

const ALL = [...EXISTING, NEW];

const ICONS = { net: Globe, storage: Database, vm: Server } as const;

type Outcome = 'create' | 'modify' | 'delete' | 'ignore';

const OUTCOME_STYLE: Record<Outcome, { label: string; className: string }> = {
  create: { label: 'Create', className: 'bg-success-100 text-success-700' },
  modify: { label: 'Modify', className: 'bg-brand-100 text-brand-700' },
  delete: { label: 'Delete', className: 'bg-danger-100 text-danger-700' },
  ignore: { label: 'Ignore', className: 'bg-neutral-100 text-ink-3' },
};

export default function DeploymentModes() {
  const [mode, setMode] = useState<Mode>('Incremental');
  const [inTemplate, setInTemplate] = useState<string[]>(['vnet', 'lb']);

  const toggle = (id: string) => setInTemplate((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const rows = ALL.map((r) => {
    const included = inTemplate.includes(r.id);
    let outcome: Outcome;
    let why: string;
    if (included && r.existing) {
      outcome = 'modify';
      why = 'The resource exists and is in the template, so Resource Manager applies the template’s desired state. Properties the template omits are reset to their defaults.';
    } else if (included && !r.existing) {
      outcome = 'create';
      why = 'The resource is in the template but not in the resource group, so it is created.';
    } else if (!included && r.existing) {
      if (mode === 'Complete') {
        outcome = 'delete';
        why = 'Complete mode treats the template as the definition of the resource group: anything not in the template is deleted.';
      } else {
        outcome = 'ignore';
        why = 'Incremental mode leaves resources that are not in the template untouched.';
      }
    } else {
      outcome = 'ignore';
      why = 'Not in the template and not in the resource group — nothing happens.';
    }
    return { r, included, outcome, why };
  });

  const deletions = rows.filter((x) => x.outcome === 'delete');

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <fieldset>
          <legend className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Deployment mode</legend>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Deployment mode">
            {(['Incremental', 'Complete'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn('h-9 flex-1 rounded-lg border text-[13px] font-medium', mode === m ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-ink-2')}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            {mode === 'Incremental'
              ? 'The default. Resources not in the template are left alone.'
              : 'Resources in the resource group that are not in the template are deleted. Not supported at subscription scope or in the portal; nested deployments always run incrementally.'}
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Resources in the template</legend>
          <div className="space-y-1.5">
            {ALL.map((r) => (
              <label key={r.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-ink-2">
                <input type="checkbox" checked={inTemplate.includes(r.id)} onChange={() => toggle(r.id)} className="accent-[var(--color-brand-600)]" />
                <span className="font-mono text-[12.5px] text-ink">{r.name}</span>
                {!r.existing && <span className="ml-auto rounded bg-brand-50 px-1.5 py-0.5 text-2xs font-semibold text-brand-700">new</span>}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="min-w-0 space-y-4 p-4">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">What-if result for rg-app</div>
        <div className="space-y-2">
          {rows.map(({ r, outcome, why }) => {
            const Icon = ICONS[r.icon];
            return (
              <div key={r.id} className={cn('rounded-xl border p-3', outcome === 'delete' ? 'border-danger-100 bg-danger-50/40' : 'border-line bg-surface')}>
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-ink-3" aria-hidden="true" />
                  <span className="font-mono text-[13px] text-ink">{r.name}</span>
                  <ArrowRight className="size-3.5 text-ink-4" aria-hidden="true" />
                  <span className={cn('rounded-md px-1.5 py-0.5 text-2xs font-semibold', OUTCOME_STYLE[outcome].className)}>{OUTCOME_STYLE[outcome].label}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{why}</p>
              </div>
            );
          })}
        </div>

        <div aria-live="polite" className={cn('rounded-xl px-4 py-3', deletions.length > 0 ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700')}>
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            {deletions.length > 0 ? <TriangleAlert className="size-5" aria-hidden="true" /> : <CircleCheck className="size-5" aria-hidden="true" />}
            {deletions.length > 0 ? `${deletions.length} existing resource${deletions.length > 1 ? 's' : ''} would be deleted` : 'No resources would be deleted'}
          </div>
          <p className="mt-1 text-[13px] text-ink-2">
            {deletions.length > 0
              ? `Complete mode would remove ${deletions.map((d) => d.r.name).join(', ')}. Run az deployment group what-if before any deployment that could delete something.`
              : 'Existing resources outside the template are preserved. Note that properties omitted from a resource the template does define are still reset to their defaults.'}
          </p>
        </div>
      </div>
    </div>
  );
}
