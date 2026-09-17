import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, FileWarning, Play, Tag, Wand } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Effect = 'deny' | 'audit' | 'modify' | 'deployIfNotExists' | 'auditIfNotExists' | 'disabled';

interface PolicyDef {
  id: 'loc' | 'tag' | 'inherit' | 'diag';
  name: string;
  effects: Effect[];
  appliesTo: ('storage' | 'vm')[];
}

const POLICIES: PolicyDef[] = [
  { id: 'loc', name: 'Allowed locations: West Europe, North Europe', effects: ['deny', 'audit', 'disabled'], appliesTo: ['storage', 'vm'] },
  { id: 'tag', name: 'Require CostCenter tag on resources', effects: ['deny', 'audit', 'disabled'], appliesTo: ['storage', 'vm'] },
  { id: 'inherit', name: 'Inherit CostCenter tag from the resource group if missing', effects: ['modify', 'disabled'], appliesTo: ['storage', 'vm'] },
  { id: 'diag', name: 'Storage accounts should send logs to Log Analytics', effects: ['deployIfNotExists', 'auditIfNotExists', 'disabled'], appliesTo: ['storage'] },
];

const REGIONS = [
  { id: 'westeurope', label: 'West Europe' },
  { id: 'northeurope', label: 'North Europe' },
  { id: 'eastus', label: 'East US' },
];

interface Step {
  phase: string;
  policy?: string;
  outcome: 'pass' | 'deny' | 'change' | 'noncompliant' | 'deploy' | 'skip' | 'info';
  text: string;
}

export default function PolicyEffects() {
  const [effects, setEffects] = useState<Record<PolicyDef['id'], Effect>>({ loc: 'deny', tag: 'deny', inherit: 'disabled', diag: 'deployIfNotExists' });
  const [type, setType] = useState<'storage' | 'vm'>('storage');
  const [region, setRegion] = useState('westeurope');
  const [hasTag, setHasTag] = useState(false);
  const [run, setRun] = useState(0);

  const sim = useMemo(() => {
    const steps: Step[] = [];
    let tagPresent = hasTag;
    let denied = false;
    const noncompliant: string[] = [];
    const active = (id: PolicyDef['id']) => effects[id] !== 'disabled' && POLICIES.find((p) => p.id === id)!.appliesTo.includes(type);

    POLICIES.forEach((p) => {
      if (effects[p.id] === 'disabled') steps.push({ phase: '1 · disabled', policy: p.name, outcome: 'skip', text: 'Effect is disabled — the rule isn’t evaluated.' });
      else if (!p.appliesTo.includes(type)) steps.push({ phase: '1 · applicability', policy: p.name, outcome: 'skip', text: 'The rule’s conditions don’t match this resource type.' });
    });

    if (active('inherit')) {
      if (!tagPresent) {
        tagPresent = true;
        steps.push({ phase: '2 · append / modify', policy: 'Inherit CostCenter tag', outcome: 'change', text: 'The request is changed: CostCenter=4410 is copied from the resource group before other rules run.' });
      } else {
        steps.push({ phase: '2 · append / modify', policy: 'Inherit CostCenter tag', outcome: 'pass', text: 'The tag is already present, so nothing is modified.' });
      }
    }

    const locOk = region !== 'eastus';
    if (active('loc') && effects.loc === 'deny') {
      if (!locOk) {
        denied = true;
        steps.push({ phase: '3 · deny', policy: 'Allowed locations', outcome: 'deny', text: 'East US isn’t allowed — the request fails with RequestDisallowedByPolicy.' });
      } else steps.push({ phase: '3 · deny', policy: 'Allowed locations', outcome: 'pass', text: 'Region is allowed.' });
    }
    if (active('tag') && effects.tag === 'deny') {
      if (!tagPresent) {
        denied = true;
        steps.push({ phase: '3 · deny', policy: 'Require CostCenter tag', outcome: 'deny', text: 'The tag is missing — the request is denied.' });
      } else steps.push({ phase: '3 · deny', policy: 'Require CostCenter tag', outcome: 'pass', text: 'The tag is present (possibly added by modify), so the request passes.' });
    }

    if (!denied) {
      if (active('loc') && effects.loc === 'audit') {
        if (!locOk) {
          noncompliant.push('Allowed locations');
          steps.push({ phase: '4 · audit', policy: 'Allowed locations', outcome: 'noncompliant', text: 'Created, but marked non-compliant.' });
        } else steps.push({ phase: '4 · audit', policy: 'Allowed locations', outcome: 'pass', text: 'Compliant.' });
      }
      if (active('tag') && effects.tag === 'audit') {
        if (!tagPresent) {
          noncompliant.push('Require CostCenter tag');
          steps.push({ phase: '4 · audit', policy: 'Require CostCenter tag', outcome: 'noncompliant', text: 'Created, but marked non-compliant.' });
        } else steps.push({ phase: '4 · audit', policy: 'Require CostCenter tag', outcome: 'pass', text: 'Compliant.' });
      }
      steps.push({ phase: '5 · resource provider', outcome: 'info', text: `${type === 'storage' ? 'Microsoft.Storage' : 'Microsoft.Compute'} creates the resource.` });
      if (active('diag')) {
        if (effects.diag === 'deployIfNotExists') steps.push({ phase: '6 · after success', policy: 'Storage logs to Log Analytics', outcome: 'deploy', text: 'No diagnostic setting exists, so deployIfNotExists deploys one using the assignment’s managed identity.' });
        else {
          noncompliant.push('Storage logs to Log Analytics');
          steps.push({ phase: '6 · after success', policy: 'Storage logs to Log Analytics', outcome: 'noncompliant', text: 'auditIfNotExists finds no diagnostic setting and marks the account non-compliant.' });
        }
      }
    }
    return { steps, denied, noncompliant, tagPresent };
  }, [effects, type, region, hasTag]);

  const tone: Record<Step['outcome'], string> = {
    pass: 'text-success-700',
    deny: 'text-danger-700',
    change: 'text-brand-700',
    noncompliant: 'text-warning-700',
    deploy: 'text-brand-700',
    skip: 'text-ink-4',
    info: 'text-ink-2',
  };

  return (
    <div className="grid lg:grid-cols-2">
      <div className="space-y-5 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div>
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Policy assignments on the subscription</div>
          <ul className="space-y-2">
            {POLICIES.map((p) => (
              <li key={p.id} className="rounded-xl border border-line p-2.5">
                <div className="text-[13px] font-medium text-ink">{p.name}</div>
                <div className="mt-1.5 flex flex-wrap gap-1" role="radiogroup" aria-label={`Effect for ${p.name}`}>
                  {p.effects.map((e) => (
                    <button
                      key={e}
                      type="button"
                      role="radio"
                      aria-checked={effects[p.id] === e}
                      onClick={() => setEffects((x) => ({ ...x, [p.id]: e }))}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[11.5px]',
                        effects[p.id] === e ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-ink-2 hover:border-line-strong',
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">The create request</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] text-ink-2">
              Resource type
              <select value={type} onChange={(e) => setType(e.target.value as 'storage' | 'vm')} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
                <option value="storage">Storage account</option>
                <option value="vm">Virtual machine</option>
              </select>
            </label>
            <label className="text-[13px] text-ink-2">
              Region
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px] text-ink-2">
            <input type="checkbox" checked={hasTag} onChange={() => setHasTag((t) => !t)} className="accent-[var(--color-brand-600)]" />
            Request includes the CostCenter tag
          </label>
          <p className="mt-1 text-2xs text-ink-4">The resource group already has CostCenter=4410.</p>
          <Button size="sm" className="mt-3" icon={<Play className="size-3.5" />} onClick={() => setRun((r) => r + 1)}>
            Send request
          </Button>
        </div>
      </div>

      <div className="p-4" aria-live="polite">
        <div key={run} className="animate-fade-in space-y-3">
          <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', sim.denied ? 'bg-danger-50 text-danger-700' : sim.noncompliant.length ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700')}>
            {sim.denied ? <CircleX className="size-6" aria-hidden="true" /> : sim.noncompliant.length ? <FileWarning className="size-6" aria-hidden="true" /> : <CircleCheck className="size-6" aria-hidden="true" />}
            <div>
              <div className="text-[15px] font-semibold">{sim.denied ? 'Request denied' : sim.noncompliant.length ? 'Created — non-compliant' : 'Created — compliant'}</div>
              {!sim.denied && (
                <div className="flex items-center gap-1 text-[12.5px] text-ink-2">
                  <Tag className="size-3" aria-hidden="true" /> CostCenter tag: {sim.tagPresent ? 'present' : 'missing'}
                </div>
              )}
            </div>
          </div>
          <ol className="space-y-1.5">
            {sim.steps.map((s, i) => (
              <li key={i} className="rounded-lg border border-line px-3 py-2" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-2xs text-ink-4">{s.phase}</span>
                  {s.outcome === 'change' || s.outcome === 'deploy' ? <Wand className="size-3.5 text-brand-600" aria-hidden="true" /> : null}
                </div>
                {s.policy && <div className="text-[12.5px] font-medium text-ink">{s.policy}</div>}
                <div className={cn('text-[12.5px]', tone[s.outcome])}>{s.text}</div>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-ink-3">
            Order: disabled → append/modify → deny → audit → (resource provider) → auditIfNotExists / deployIfNotExists. Try enabling the inherit policy with the tag missing: modify runs before deny, so the request succeeds.
          </p>
        </div>
      </div>
    </div>
  );
}
