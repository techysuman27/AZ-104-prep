import { useState } from 'react';
import { ArrowDown, Ban, CircleCheck, Info } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Overlay';
import { cn } from '@/lib/cn';
import type { IconKey } from '@/content/schema';

type Level = 'tenant' | 'root' | 'mg' | 'subscription' | 'rg' | 'resource';
type Feature = 'rbac' | 'policy' | 'locks' | 'tags' | 'budgets';

interface TreeNode {
  id: string;
  label: string;
  level: Level;
  children?: TreeNode[];
}

const TREE: TreeNode = {
  id: 'tenant',
  label: 'contoso.com tenant',
  level: 'tenant',
  children: [
    {
      id: 'root',
      label: 'Tenant root group',
      level: 'root',
      children: [
        {
          id: 'mg-prod',
          label: 'Production',
          level: 'mg',
          children: [
            {
              id: 'sub-apps',
              label: 'Prod-Apps',
              level: 'subscription',
              children: [
                {
                  id: 'rg-web',
                  label: 'rg-web-prod',
                  level: 'rg',
                  children: [
                    { id: 'res-app', label: 'app-web-prod', level: 'resource' },
                    { id: 'res-sql', label: 'sql-orders-prod', level: 'resource' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'mg-dev',
          label: 'Non-production',
          level: 'mg',
          children: [
            {
              id: 'sub-dev',
              label: 'DevTest',
              level: 'subscription',
              children: [{ id: 'rg-sandbox', label: 'rg-sandbox', level: 'rg', children: [{ id: 'res-vm', label: 'vm-test-01', level: 'resource' }] }],
            },
          ],
        },
      ],
    },
  ],
};

const LEVEL_META: Record<Level, { name: string; icon: IconKey }> = {
  tenant: { name: 'Microsoft Entra tenant', icon: 'tenant' },
  root: { name: 'Root management group', icon: 'management-group' },
  mg: { name: 'Management group', icon: 'management-group' },
  subscription: { name: 'Subscription', icon: 'subscription' },
  rg: { name: 'Resource group', icon: 'resource-group' },
  resource: { name: 'Resource', icon: 'vm' },
};

const FEATURES: Record<
  Feature,
  { label: string; allowed: Level[]; inherits: boolean; applied: string; inherited: string; notAllowed: string; note: string }
> = {
  rbac: {
    label: 'Azure RBAC',
    allowed: ['root', 'mg', 'subscription', 'rg', 'resource'],
    inherits: true,
    applied: 'Role assigned here',
    inherited: 'Inherits the role',
    notAllowed: 'Azure roles are not assigned on the tenant. Directory access uses Microsoft Entra roles instead.',
    note: 'Role assignments are inherited by every child scope. Access is additive: a child can add access but cannot remove inherited access (only deny assignments can).',
  },
  policy: {
    label: 'Azure Policy',
    allowed: ['root', 'mg', 'subscription', 'rg', 'resource'],
    inherits: true,
    applied: 'Policy assigned here',
    inherited: 'Evaluated by the policy',
    notAllowed: 'Policies are assigned to management groups, subscriptions, resource groups or resources — not to the tenant object.',
    note: 'Assignments apply to all child scopes. A more permissive child assignment cannot override a parent deny — exclude the child scope from the parent assignment or use an exemption.',
  },
  locks: {
    label: 'Locks',
    allowed: ['subscription', 'rg', 'resource'],
    inherits: true,
    applied: 'Lock applied here',
    inherited: 'Inherits the lock',
    notAllowed: 'Locks can’t be applied to management groups (or the tenant). Apply them at subscription, resource group or resource scope.',
    note: 'Locks apply to everyone, including Owners, and the most restrictive lock in the chain wins. They protect the control plane only — not data inside a resource.',
  },
  tags: {
    label: 'Tags',
    allowed: ['subscription', 'rg', 'resource'],
    inherits: false,
    applied: 'Tag applied here',
    inherited: 'Not inherited',
    notAllowed: 'Tags can’t be applied to management groups (or the tenant). Tag subscriptions, resource groups or resources.',
    note: 'Resources do not inherit tags from their resource group or subscription. Use Azure Policy (for example, inherit a tag from the resource group) to propagate them.',
  },
  budgets: {
    label: 'Budgets',
    allowed: ['root', 'mg', 'subscription', 'rg'],
    inherits: true,
    applied: 'Budget scope',
    inherited: 'Costs counted',
    notAllowed: 'In this hierarchy view, budgets are set on management groups, subscriptions or resource groups (billing scopes exist too).',
    note: 'A budget tracks the costs of everything in its scope and sends alerts. It never stops or deallocates resources by itself.',
  },
};

function flatten(node: TreeNode, depth = 0, parents: string[] = []): { node: TreeNode; depth: number; parents: string[] }[] {
  return [{ node, depth, parents }, ...(node.children ?? []).flatMap((c) => flatten(c, depth + 1, [...parents, node.id]))];
}

const ROWS = flatten(TREE);

export default function ResourceHierarchy() {
  const [feature, setFeature] = useState<Feature>('rbac');
  const [appliedAt, setAppliedAt] = useState<string>('mg-prod');
  const meta = FEATURES[feature];
  const appliedRow = ROWS.find((r) => r.node.id === appliedAt);
  const appliedAllowed = appliedRow ? meta.allowed.includes(appliedRow.node.level) : false;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[13px] font-semibold text-ink">Resource hierarchy explorer</div>
        <Segmented
          size="sm"
          label="Governance feature"
          value={feature}
          onChange={(f) => setFeature(f)}
          options={(Object.keys(FEATURES) as Feature[]).map((f) => ({ value: f, label: FEATURES[f].label }))}
          className="scrollbar-thin max-w-full overflow-x-auto"
        />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_280px]">
        <ul className="diagram-grid space-y-1.5 px-3 py-4 sm:px-5" aria-label="Hierarchy levels">
          {ROWS.map(({ node, depth, parents }) => {
            const allowed = meta.allowed.includes(node.level);
            const isApplied = node.id === appliedAt && appliedAllowed;
            const isDescendant = appliedAllowed && parents.includes(appliedAt);
            const state = isApplied ? 'applied' : isDescendant ? (meta.inherits ? 'inherited' : 'not-inherited') : 'none';
            const lm = LEVEL_META[node.level];
            return (
              <li key={node.id} style={{ paddingLeft: `${depth * 22}px` }} className="relative">
                {depth > 0 && (
                  <span
                    className="absolute top-0 bottom-1/2 w-3 rounded-bl-md border-b border-l border-line-strong"
                    style={{ left: `${(depth - 1) * 22 + 10}px` }}
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setAppliedAt(node.id)}
                  aria-pressed={node.id === appliedAt}
                  className={cn(
                    'relative flex w-full max-w-[420px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all duration-300',
                    state === 'applied' && 'border-brand-500 bg-brand-50 shadow-raised ring-2 ring-brand-150',
                    state === 'inherited' && 'border-success-500/50 bg-success-50',
                    state === 'not-inherited' && 'border-dashed border-line-strong bg-surface opacity-80',
                    state === 'none' && 'border-line bg-surface hover:border-line-strong',
                    node.id === appliedAt && !appliedAllowed && 'border-danger-500/60 bg-danger-50',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-subtle text-ink-2">
                    <Icon name={lm.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{node.label}</span>
                    <span className="block text-2xs text-ink-3">{lm.name}</span>
                  </span>
                  {state === 'applied' && (
                    <span className="shrink-0 rounded-md bg-brand-600 px-1.5 py-0.5 text-2xs font-semibold text-white">{meta.applied}</span>
                  )}
                  {state === 'inherited' && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-100 px-1.5 py-0.5 text-2xs font-semibold text-success-700">
                      <ArrowDown className="size-3" aria-hidden="true" /> {meta.inherited}
                    </span>
                  )}
                  {state === 'not-inherited' && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-2xs font-semibold text-ink-3">
                      <Ban className="size-3" aria-hidden="true" /> {meta.inherited}
                    </span>
                  )}
                  {node.id === appliedAt && !appliedAllowed && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-danger-100 px-1.5 py-0.5 text-2xs font-semibold text-danger-700">
                      <Ban className="size-3" aria-hidden="true" /> Not supported
                    </span>
                  )}
                  {!allowed && node.id !== appliedAt && <span className="sr-only">({meta.label} cannot be applied at this level)</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line bg-subtle/50 px-4 py-4 md:border-t-0 md:border-l" aria-live="polite">
          <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">{meta.label}</div>
          {appliedRow && appliedAllowed ? (
            <p className="mt-1.5 flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden="true" />
              <span>
                Applied at <strong className="text-ink">{appliedRow.node.label}</strong> ({LEVEL_META[appliedRow.node.level].name.toLowerCase()}).{' '}
                {meta.inherits ? 'Everything below it is affected.' : 'Nothing below it receives the value.'}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 flex gap-2 text-[13.5px] leading-relaxed text-danger-700">
              <Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{meta.notAllowed}</span>
            </p>
          )}
          <p className="mt-3 flex gap-2 text-[13px] leading-relaxed text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>{meta.note}</span>
          </p>
          <div className="mt-4 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Can be applied at</div>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {(['tenant', 'root', 'mg', 'subscription', 'rg', 'resource'] as Level[]).map((l) => (
              <li
                key={l}
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-2xs font-medium',
                  meta.allowed.includes(l) ? 'bg-brand-50 text-brand-800' : 'bg-surface text-ink-4 line-through',
                )}
              >
                {LEVEL_META[l].name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
