import { useState } from 'react';
import { CircleCheck, CircleX, Lock } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import type { IconKey } from '@/content/schema';

type LockLevel = 'none' | 'CanNotDelete' | 'ReadOnly';
type Target = 'sub' | 'rg' | 'vm' | 'st' | 'plan';

const TARGETS: { id: Target; label: string; kind: string; icon: IconKey; indent: number }[] = [
  { id: 'sub', label: 'Prod subscription', kind: 'Subscription', icon: 'subscription', indent: 0 },
  { id: 'rg', label: 'rg-app', kind: 'Resource group', icon: 'resource-group', indent: 1 },
  { id: 'vm', label: 'vm-app01', kind: 'Virtual machine', icon: 'vm', indent: 2 },
  { id: 'st', label: 'stappdata', kind: 'Storage account', icon: 'storage', indent: 2 },
  { id: 'plan', label: 'plan-app', kind: 'App Service plan', icon: 'app-service', indent: 2 },
];

interface Operation {
  id: string;
  label: string;
  resource: 'vm' | 'st' | 'plan' | 'rg';
  /** Minimum lock level that blocks it. null = never blocked by locks (data plane). */
  blockedBy: LockLevel | null;
  note: string;
  onlyResourceGroupScope?: boolean;
}

const OPERATIONS: Operation[] = [
  { id: 'del-st', label: 'Delete the storage account', resource: 'st', blockedBy: 'CanNotDelete', note: 'Deletion is blocked by both lock types.' },
  { id: 'redundancy', label: 'Change storage redundancy', resource: 'st', blockedBy: 'ReadOnly', note: 'A configuration update: allowed with CanNotDelete, blocked by ReadOnly.' },
  { id: 'keys', label: 'List storage account keys', resource: 'st', blockedBy: 'ReadOnly', note: 'Listing keys is a POST operation, so ReadOnly blocks it — tools that use keys break.' },
  { id: 'blob', label: 'Upload or delete a blob', resource: 'st', blockedBy: null, note: 'A data plane operation. Locks only apply to the control plane.' },
  { id: 'start', label: 'Start or restart the VM', resource: 'vm', blockedBy: 'ReadOnly', note: 'Start and restart are POST operations blocked by ReadOnly.' },
  { id: 'resize', label: 'Resize the VM', resource: 'vm', blockedBy: 'ReadOnly', note: 'A write operation — blocked by ReadOnly.' },
  { id: 'del-vm', label: 'Delete the VM', resource: 'vm', blockedBy: 'CanNotDelete', note: 'Blocked by both lock types.' },
  { id: 'scale', label: 'Scale out the App Service plan', resource: 'plan', blockedBy: 'ReadOnly', note: 'Scaling is an update; ReadOnly blocks it.' },
  { id: 'add-role', label: 'Add a role assignment on rg-app', resource: 'rg', blockedBy: 'ReadOnly', note: 'Creating a role assignment writes to the scope; ReadOnly blocks it.' },
  { id: 'remove-role', label: 'Remove a role assignment on rg-app', resource: 'rg', blockedBy: 'CanNotDelete', note: 'Deleting a role assignment counts as a delete at that scope, so CanNotDelete blocks it too.' },
  { id: 'del-rg', label: 'Delete rg-app', resource: 'rg', blockedBy: 'CanNotDelete', note: 'A lock on the resource group, the subscription, or ANY resource inside blocks the whole deletion.' },
];

const rank: Record<LockLevel, number> = { none: 0, CanNotDelete: 1, ReadOnly: 2 };

export default function LockEvaluator() {
  const [locks, setLocks] = useState<Record<Target, LockLevel>>({ sub: 'none', rg: 'ReadOnly', vm: 'none', st: 'none', plan: 'none' });

  const effectiveFor = (resource: Operation['resource']): { level: LockLevel; from: string } => {
    const chainIds: Target[] = resource === 'rg' ? ['sub', 'rg'] : ['sub', 'rg', resource];
    let best: { level: LockLevel; from: string } = { level: 'none', from: '' };
    for (const id of chainIds) {
      if (rank[locks[id]] > rank[best.level]) best = { level: locks[id], from: TARGETS.find((t) => t.id === id)!.label };
    }
    return best;
  };

  const evaluate = (op: Operation) => {
    if (op.blockedBy === null) return { blocked: false, why: op.note };
    if (op.id === 'del-rg') {
      const any = (['sub', 'rg', 'vm', 'st', 'plan'] as Target[]).find((t) => locks[t] !== 'none');
      return any
        ? { blocked: true, why: `${TARGETS.find((t) => t.id === any)!.label} has a ${locks[any]} lock. ${op.note}` }
        : { blocked: false, why: 'No locks anywhere in the chain or inside the resource group.' };
    }
    const eff = effectiveFor(op.resource);
    const blocked = rank[eff.level] >= rank[op.blockedBy];
    return {
      blocked,
      why: blocked ? `${eff.level} lock inherited from ${eff.from}. ${op.note}` : eff.level === 'none' ? 'No lock applies.' : `${eff.level} from ${eff.from} doesn’t block this. ${op.note}`,
    };
  };

  return (
    <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Place locks</div>
        <ul className="space-y-1.5">
          {TARGETS.map((t) => (
            <li key={t.id} style={{ paddingLeft: t.indent * 16 }}>
              <div className={cn('rounded-xl border p-2', locks[t.id] === 'none' ? 'border-line' : locks[t.id] === 'ReadOnly' ? 'border-danger-500/40 bg-danger-50/50' : 'border-warning-500/50 bg-warning-50/60')}>
                <div className="flex items-center gap-2">
                  <Icon name={t.icon} className="size-4 text-ink-3" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{t.label}</span>
                  {locks[t.id] !== 'none' && <Lock className="size-3.5 text-ink-2" aria-label="Locked" />}
                </div>
                <div className="mt-1.5 flex gap-1" role="radiogroup" aria-label={`Lock on ${t.label}`}>
                  {(['none', 'CanNotDelete', 'ReadOnly'] as LockLevel[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={locks[t.id] === l}
                      onClick={() => setLocks((x) => ({ ...x, [t.id]: l }))}
                      className={cn('flex-1 rounded-md border px-1 py-0.5 text-[11px] font-medium', locks[t.id] === l ? 'border-ink bg-ink text-white' : 'border-line text-ink-3 hover:border-line-strong')}
                    >
                      {l === 'none' ? 'None' : l === 'CanNotDelete' ? 'Delete' : 'Read-only'}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-2xs leading-relaxed text-ink-4">Portal labels: Delete (CanNotDelete) and Read-only (ReadOnly). The most restrictive lock in the chain applies.</p>
      </div>
      <div className="p-4">
        <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">What can an Owner still do?</div>
        <ul className="divide-y divide-line rounded-xl border border-line" aria-live="polite">
          {OPERATIONS.map((op) => {
            const r = evaluate(op);
            return (
              <li key={op.id} className="flex gap-3 px-3 py-2.5">
                {r.blocked ? <CircleX className="mt-0.5 size-4 shrink-0 text-danger-500" aria-label="Blocked" /> : <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-label="Allowed" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-ink">
                    {op.label}
                    <span className={cn('rounded px-1.5 py-px text-2xs font-semibold', r.blocked ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700')}>{r.blocked ? 'Blocked' : 'Allowed'}</span>
                  </div>
                  <p className="text-[12.5px] leading-snug text-ink-3">{r.why}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
