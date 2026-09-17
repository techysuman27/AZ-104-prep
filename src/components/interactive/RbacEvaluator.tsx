import { useMemo, useState } from 'react';
import { ArrowUp, Ban, CircleCheck, CircleX, ShieldAlert, User, Users } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import type { IconKey } from '@/content/schema';

type ScopeId = 'mg' | 'sub' | 'rg-web' | 'rg-data' | 'app-web' | 'st-web' | 'vm-batch' | 'sql-orders';
type ActionId = 'read' | 'write' | 'delete' | 'start' | 'assign' | 'blobRead';
type RoleId = 'Owner' | 'Contributor' | 'Reader' | 'User Access Administrator' | 'Virtual Machine Contributor' | 'Storage Blob Data Reader';

interface Scope {
  id: ScopeId;
  label: string;
  kind: string;
  parent?: ScopeId;
  icon: IconKey;
  resourceType?: 'vm' | 'storage' | 'app' | 'sql';
}

const SCOPES: Record<ScopeId, Scope> = {
  mg: { id: 'mg', label: 'Contoso', kind: 'Management group', icon: 'management-group' },
  sub: { id: 'sub', label: 'Prod', kind: 'Subscription', parent: 'mg', icon: 'subscription' },
  'rg-web': { id: 'rg-web', label: 'rg-web', kind: 'Resource group', parent: 'sub', icon: 'resource-group' },
  'rg-data': { id: 'rg-data', label: 'rg-data', kind: 'Resource group', parent: 'sub', icon: 'resource-group' },
  'app-web': { id: 'app-web', label: 'app-web', kind: 'Web app', parent: 'rg-web', icon: 'app-service', resourceType: 'app' },
  'st-web': { id: 'st-web', label: 'stweb', kind: 'Storage account', parent: 'rg-web', icon: 'storage', resourceType: 'storage' },
  'vm-batch': { id: 'vm-batch', label: 'vm-batch', kind: 'Virtual machine', parent: 'rg-data', icon: 'vm', resourceType: 'vm' },
  'sql-orders': { id: 'sql-orders', label: 'sql-orders', kind: 'SQL database', parent: 'rg-data', icon: 'database', resourceType: 'sql' },
};

const TARGETS: ScopeId[] = ['app-web', 'st-web', 'vm-batch', 'sql-orders'];

const ACTIONS: Record<ActionId, { label: string; op: string; plane: 'control' | 'data'; vmOnly?: boolean; storageOnly?: boolean }> = {
  read: { label: 'View the resource', op: '*/read', plane: 'control' },
  write: { label: 'Change its configuration', op: '*/write', plane: 'control' },
  delete: { label: 'Delete it', op: '*/delete', plane: 'control' },
  start: { label: 'Start or restart the VM', op: 'Microsoft.Compute/virtualMachines/start/action', plane: 'control', vmOnly: true },
  assign: { label: 'Grant someone else access', op: 'Microsoft.Authorization/roleAssignments/write', plane: 'control' },
  blobRead: { label: 'Read blob contents (Entra auth)', op: 'Microsoft.Storage/.../blobs/read (DataAction)', plane: 'data', storageOnly: true },
};

/** Simplified permission model of the built-in roles for teaching purposes. */
function roleAllows(role: RoleId, action: ActionId, target: Scope): { allowed: boolean; reason: string } {
  switch (role) {
    case 'Owner':
      return action === 'blobRead'
        ? { allowed: false, reason: 'Owner has Actions `*` but no DataActions.' }
        : { allowed: true, reason: 'Owner allows all Actions, including role assignments.' };
    case 'Contributor':
      if (action === 'assign') return { allowed: false, reason: 'Contributor’s NotActions exclude Microsoft.Authorization writes, so it can’t assign roles.' };
      if (action === 'blobRead') return { allowed: false, reason: 'Contributor has no DataActions.' };
      return { allowed: true, reason: 'Contributor allows all management Actions except authorization writes.' };
    case 'Reader':
      return action === 'read' ? { allowed: true, reason: 'Reader allows */read.' } : { allowed: false, reason: 'Reader only allows read operations.' };
    case 'User Access Administrator':
      if (action === 'read') return { allowed: true, reason: 'User Access Administrator includes */read.' };
      if (action === 'assign') return { allowed: true, reason: 'User Access Administrator allows Microsoft.Authorization/*.' };
      return { allowed: false, reason: 'User Access Administrator doesn’t allow changing resources.' };
    case 'Virtual Machine Contributor':
      if (target.resourceType !== 'vm') return { allowed: false, reason: 'Virtual Machine Contributor’s actions cover VMs and related resources, not this resource type.' };
      if (action === 'assign' || action === 'blobRead') return { allowed: false, reason: 'Virtual Machine Contributor can’t assign roles or read data.' };
      return { allowed: true, reason: 'Virtual Machine Contributor allows managing VMs, including start and delete.' };
    case 'Storage Blob Data Reader':
      if (action === 'blobRead' && target.resourceType === 'storage') return { allowed: true, reason: 'Storage Blob Data Reader grants the blob read DataAction.' };
      return { allowed: false, reason: 'Storage Blob Data Reader grants data read only — no management Actions.' };
  }
}

interface Assignment {
  id: string;
  principal: string;
  principalType: 'user' | 'group';
  role: RoleId;
  scope: ScopeId;
  enabled: boolean;
}

const START_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', principal: 'Auditors', principalType: 'group', role: 'Reader', scope: 'mg', enabled: true },
  { id: 'a2', principal: 'Dev', principalType: 'group', role: 'Contributor', scope: 'rg-web', enabled: true },
  { id: 'a3', principal: 'Ops', principalType: 'group', role: 'Virtual Machine Contributor', scope: 'vm-batch', enabled: true },
  { id: 'a4', principal: 'Maria', principalType: 'user', role: 'Reader', scope: 'sub', enabled: true },
  { id: 'a5', principal: 'Sam', principalType: 'user', role: 'Storage Blob Data Reader', scope: 'st-web', enabled: false },
  { id: 'a6', principal: 'Platform', principalType: 'group', role: 'Owner', scope: 'sub', enabled: true },
];

const PEOPLE: Record<string, { groups: string[] }> = {
  Maria: { groups: ['Dev', 'Ops'] },
  Sam: { groups: ['Auditors'] },
  Priya: { groups: ['Platform'] },
};

function chain(id: ScopeId): Scope[] {
  const out: Scope[] = [];
  let cur: Scope | undefined = SCOPES[id];
  while (cur) {
    out.push(cur);
    cur = cur.parent ? SCOPES[cur.parent] : undefined;
  }
  return out;
}

export default function RbacEvaluator() {
  const [person, setPerson] = useState<keyof typeof PEOPLE>('Maria');
  const [target, setTarget] = useState<ScopeId>('st-web');
  const [action, setAction] = useState<ActionId>('delete');
  const [assignments, setAssignments] = useState(START_ASSIGNMENTS);
  const [denyDelete, setDenyDelete] = useState(false);

  const principals = useMemo(() => [person, ...PEOPLE[person].groups], [person]);
  const scopeChain = useMemo(() => chain(target), [target]);
  const targetScope = SCOPES[target];
  const act = ACTIONS[action];

  const result = useMemo(() => {
    const applicableAction = !(act.vmOnly && targetScope.resourceType !== 'vm') && !(act.storageOnly && targetScope.resourceType !== 'storage');
    const deny = denyDelete && action === 'delete' && scopeChain.some((s) => s.id === 'rg-data');
    const found = assignments
      .filter((a) => a.enabled && principals.includes(a.principal) && scopeChain.some((s) => s.id === a.scope))
      .map((a) => ({ a, ...roleAllows(a.role, action, targetScope) }));
    const allowed = applicableAction && !deny && found.some((f) => f.allowed);
    return { applicableAction, deny, found, allowed };
  }, [act, action, assignments, denyDelete, principals, scopeChain, targetScope]);

  return (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-5 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">1 · Who is acting?</div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Person">
            {(Object.keys(PEOPLE) as (keyof typeof PEOPLE)[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={person === p}
                onClick={() => setPerson(p)}
                className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium', person === p ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line text-ink-2 hover:border-line-strong')}
              >
                <User className="size-3.5" aria-hidden="true" /> {p}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-3">
            {person} is a member of: {PEOPLE[person].groups.join(', ')}
          </p>
        </div>

        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">2 · On which resource?</div>
          <div className="grid grid-cols-2 gap-1.5">
            {TARGETS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={target === t}
                onClick={() => setTarget(t)}
                className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left', target === t ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-line-strong')}
              >
                <Icon name={SCOPES[t].icon} className="size-4 text-ink-3" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{SCOPES[t].label}</span>
                  <span className="block text-2xs text-ink-3">in {SCOPES[SCOPES[t].parent!].label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">3 · Doing what?</div>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionId)}
            className="h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 text-[13.5px] text-ink focus-visible:shadow-focus focus-visible:outline-none"
            aria-label="Action"
          >
            {(Object.keys(ACTIONS) as ActionId[]).map((a) => (
              <option key={a} value={a}>
                {ACTIONS[a].label}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-2xs text-ink-3">{act.op}</p>
        </div>

        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Role assignments (toggle to experiment)</div>
          <ul className="space-y-1">
            {assignments.map((a) => (
              <li key={a.id}>
                <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px]', a.enabled ? 'bg-subtle/70' : 'opacity-60')}>
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={() => setAssignments((list) => list.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))}
                    className="accent-[var(--color-brand-600)]"
                  />
                  {a.principalType === 'group' ? <Users className="size-3.5 text-ink-3" aria-hidden="true" /> : <User className="size-3.5 text-ink-3" aria-hidden="true" />}
                  <span className="font-medium text-ink">{a.principal}</span>
                  <span className="text-ink-3">·</span>
                  <span className="text-ink-2">{a.role}</span>
                  <span className="ml-auto truncate text-ink-3">@ {SCOPES[a.scope].label}</span>
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line-strong px-2 py-1.5 text-[12.5px] text-ink-2">
            <input type="checkbox" checked={denyDelete} onChange={() => setDenyDelete((d) => !d)} className="accent-[var(--color-danger-600)]" />
            <ShieldAlert className="size-3.5 text-danger-600" aria-hidden="true" /> Simulate a deny assignment blocking delete in rg-data
          </label>
          <p className="mt-1 text-2xs text-ink-4">Deny assignments are created by Azure features such as deployment stacks and managed applications — not directly by administrators.</p>
        </div>
      </div>

      <div className="space-y-4 p-4" aria-live="polite">
        <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', result.allowed ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
          {result.allowed ? <CircleCheck className="size-6 shrink-0" aria-hidden="true" /> : <CircleX className="size-6 shrink-0" aria-hidden="true" />}
          <div>
            <div className="text-[15px] font-semibold">{result.allowed ? 'Allowed' : 'Denied'}</div>
            <div className="text-[13px] text-ink-2">
              {person} → {act.label.toLowerCase()} → {targetScope.label}
            </div>
          </div>
        </div>

        <ol className="space-y-3">
          <li className="rounded-xl border border-line p-3">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Step 1 · Identity</div>
            <p className="mt-1 text-[13px] text-ink-2">
              The token for <strong className="text-ink">{person}</strong> includes group memberships: {PEOPLE[person].groups.join(', ')}.
            </p>
          </li>
          <li className="rounded-xl border border-line p-3">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Step 2 · Deny assignments</div>
            <p className={cn('mt-1 flex items-center gap-1.5 text-[13px]', result.deny ? 'font-medium text-danger-700' : 'text-ink-2')}>
              {result.deny ? <Ban className="size-3.5" aria-hidden="true" /> : null}
              {result.deny ? 'A deny assignment applies — the request is blocked regardless of roles.' : 'No deny assignment applies.'}
            </p>
          </li>
          <li className="rounded-xl border border-line p-3">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Step 3 · Walk up the scope chain</div>
            <ol className="mt-2 space-y-1">
              {scopeChain.map((s, i) => {
                const here = result.found.filter((f) => f.a.scope === s.id);
                return (
                  <li key={s.id} className="flex items-start gap-2 text-[12.5px]">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-subtle text-ink-3">{i === 0 ? <Icon name={s.icon} className="size-3" /> : <ArrowUp className="size-3" aria-hidden="true" />}</span>
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{s.label}</span> <span className="text-ink-4">({s.kind})</span>
                      {here.length === 0 ? (
                        <span className="block text-ink-4">no assignments for {person} or their groups</span>
                      ) : (
                        here.map((f) => (
                          <span key={f.a.id} className="block text-ink-2">
                            {f.a.principal} · <strong>{f.a.role}</strong>
                            {i > 0 && <span className="text-ink-4"> (inherited)</span>}
                          </span>
                        ))
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </li>
          <li className="rounded-xl border border-line p-3">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Step 4 · Does any role allow the action?</div>
            {!result.applicableAction ? (
              <p className="mt-1 text-[13px] text-ink-2">This action doesn’t apply to a {targetScope.kind.toLowerCase()}.</p>
            ) : result.found.length === 0 ? (
              <p className="mt-1 text-[13px] text-danger-700">No role assignments apply at this scope or above, so nothing is allowed.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {result.found.map((f) => (
                  <li key={f.a.id} className="flex gap-2 text-[12.5px]">
                    {f.allowed ? <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success-600" aria-label="Allows" /> : <CircleX className="mt-0.5 size-3.5 shrink-0 text-ink-4" aria-label="Doesn’t allow" />}
                    <span className="text-ink-2">
                      <strong className="text-ink">{f.a.role}</strong>: {f.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-ink-3">RBAC is additive: one allowing role is enough (unless a deny assignment applies).</p>
          </li>
        </ol>
      </div>
    </div>
  );
}
