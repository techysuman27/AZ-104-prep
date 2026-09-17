import { useMemo, useState } from 'react';
import { ArrowRight, CircleCheck, CircleX, Plus, Trash } from 'lucide-react';
import { cn } from '@/lib/cn';

type Direction = 'Inbound' | 'Outbound';

interface Rule {
  id: number;
  priority: number;
  name: string;
  source: string;
  destination: string;
  port: string;
  access: 'Allow' | 'Deny';
  direction: Direction;
  editable?: boolean;
}

const DEFAULTS: Rule[] = [
  { id: 900, priority: 65000, name: 'AllowVNetInBound', source: 'VirtualNetwork', destination: 'VirtualNetwork', port: 'Any', access: 'Allow', direction: 'Inbound' },
  { id: 901, priority: 65001, name: 'AllowAzureLoadBalancerInBound', source: 'AzureLoadBalancer', destination: 'Any', port: 'Any', access: 'Allow', direction: 'Inbound' },
  { id: 902, priority: 65500, name: 'DenyAllInBound', source: 'Any', destination: 'Any', port: 'Any', access: 'Deny', direction: 'Inbound' },
  { id: 903, priority: 65000, name: 'AllowVnetOutBound', source: 'VirtualNetwork', destination: 'VirtualNetwork', port: 'Any', access: 'Allow', direction: 'Outbound' },
  { id: 904, priority: 65001, name: 'AllowInternetOutBound', source: 'Any', destination: 'Internet', port: 'Any', access: 'Allow', direction: 'Outbound' },
  { id: 905, priority: 65500, name: 'DenyAllOutBound', source: 'Any', destination: 'Any', port: 'Any', access: 'Deny', direction: 'Outbound' },
];

const START_SUBNET: Rule[] = [
  { id: 1, priority: 100, name: 'Allow-HTTPS', source: 'Internet', destination: 'Any', port: '443', access: 'Allow', direction: 'Inbound', editable: true },
  { id: 2, priority: 200, name: 'Allow-RDP-Office', source: '203.0.113.0/24', destination: 'Any', port: '3389', access: 'Allow', direction: 'Inbound', editable: true },
];

const START_NIC: Rule[] = [{ id: 11, priority: 100, name: 'Allow-HTTPS-NIC', source: 'Internet', destination: 'Any', port: '443', access: 'Allow', direction: 'Inbound', editable: true }];

const SOURCES = ['Internet', 'VirtualNetwork', 'AzureLoadBalancer', '203.0.113.0/24', 'Any'];

function matches(rule: Rule, packet: { direction: Direction; port: string; source: string }) {
  if (rule.direction !== packet.direction) return false;
  const sourceMatch = rule.source === 'Any' || rule.source === packet.source;
  const portMatch = rule.port === 'Any' || rule.port === packet.port;
  return sourceMatch && portMatch;
}

function evaluate(rules: Rule[], packet: { direction: Direction; port: string; source: string }) {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);
  const hit = ordered.find((r) => matches(r, packet));
  return hit ?? null;
}

function RuleTable({ title, rules, onChange, direction }: { title: string; rules: Rule[]; onChange: (r: Rule[]) => void; direction: Direction }) {
  const visible = [...rules, ...DEFAULTS].filter((r) => r.direction === direction).sort((a, b) => a.priority - b.priority);
  return (
    <div className="rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <button
          type="button"
          onClick={() => onChange([...rules, { id: Date.now(), priority: 300, name: `Rule-${rules.length + 1}`, source: 'Any', destination: 'Any', port: '80', access: 'Allow', direction, editable: true }])}
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          <Plus className="size-3" aria-hidden="true" /> Rule
        </button>
      </div>
      <ul className="divide-y divide-line">
        {visible.map((r) => (
          <li key={r.id} className={cn('flex flex-wrap items-center gap-1.5 px-3 py-2 text-[12.5px]', !r.editable && 'bg-subtle/40 text-ink-3')}>
            {r.editable ? (
              <>
                <input
                  type="number"
                  value={r.priority}
                  aria-label="Priority"
                  onChange={(e) => onChange(rules.map((x) => (x.id === r.id ? { ...x, priority: Number(e.target.value) } : x)))}
                  className="h-7 w-16 rounded-md border border-line bg-surface px-1.5 tabular"
                />
                <select value={r.source} aria-label="Source" onChange={(e) => onChange(rules.map((x) => (x.id === r.id ? { ...x, source: e.target.value } : x)))} className="h-7 rounded-md border border-line bg-surface px-1">
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ArrowRight className="size-3 text-ink-4" aria-hidden="true" />
                <input value={r.port} aria-label="Port" onChange={(e) => onChange(rules.map((x) => (x.id === r.id ? { ...x, port: e.target.value } : x)))} className="h-7 w-16 rounded-md border border-line bg-surface px-1.5" />
                <select value={r.access} aria-label="Action" onChange={(e) => onChange(rules.map((x) => (x.id === r.id ? { ...x, access: e.target.value as 'Allow' | 'Deny' } : x)))} className={cn('h-7 rounded-md border px-1 font-semibold', r.access === 'Allow' ? 'border-success-100 bg-success-50 text-success-700' : 'border-danger-100 bg-danger-50 text-danger-700')}>
                  <option>Allow</option>
                  <option>Deny</option>
                </select>
                <button type="button" onClick={() => onChange(rules.filter((x) => x.id !== r.id))} aria-label={`Delete ${r.name}`} className="ml-auto grid size-6 place-items-center rounded text-ink-4 hover:text-danger-600">
                  <Trash className="size-3" />
                </button>
              </>
            ) : (
              <>
                <span className="w-16 tabular">{r.priority}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className={cn('rounded px-1.5 py-px font-semibold', r.access === 'Allow' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>{r.access}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NsgEvaluator() {
  const [subnetRules, setSubnetRules] = useState(START_SUBNET);
  const [nicRules, setNicRules] = useState(START_NIC);
  const [direction, setDirection] = useState<Direction>('Inbound');
  const [port, setPort] = useState('3389');
  const [source, setSource] = useState('203.0.113.0/24');

  const result = useMemo(() => {
    const packet = { direction, port, source };
    const first = direction === 'Inbound' ? { label: 'Subnet NSG', rules: [...subnetRules, ...DEFAULTS] } : { label: 'NIC NSG', rules: [...nicRules, ...DEFAULTS] };
    const second = direction === 'Inbound' ? { label: 'NIC NSG', rules: [...nicRules, ...DEFAULTS] } : { label: 'Subnet NSG', rules: [...subnetRules, ...DEFAULTS] };
    const firstHit = evaluate(first.rules, packet);
    const secondHit = firstHit?.access === 'Allow' ? evaluate(second.rules, packet) : null;
    const allowed = firstHit?.access === 'Allow' && secondHit?.access === 'Allow';
    return { first, second, firstHit, secondHit, allowed };
  }, [subnetRules, nicRules, direction, port, source]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 border-b border-line p-4 lg:border-r lg:border-b-0">
        <RuleTable title="NSG on snet-app (subnet)" rules={subnetRules} onChange={setSubnetRules} direction={direction} />
        <RuleTable title="NSG on nic-app01 (network interface)" rules={nicRules} onChange={setNicRules} direction={direction} />
        <p className="text-2xs text-ink-4">Default rules are shown in grey and can’t be removed — only overridden with a lower priority number.</p>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Send a packet</div>
          <div className="space-y-2">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Direction">
              {(['Inbound', 'Outbound'] as Direction[]).map((d) => (
                <button key={d} type="button" role="radio" aria-checked={direction === d} onClick={() => setDirection(d)} className={cn('h-8 flex-1 rounded-lg border text-[13px] font-medium', direction === d ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-ink-2')}>
                  {d}
                </button>
              ))}
            </div>
            <label className="block text-[13px] text-ink-2">
              {direction === 'Inbound' ? 'Source' : 'Destination'}
              <select value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
                {SOURCES.filter((s) => s !== 'Any').map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-[13px] text-ink-2">
              Port
              <input value={port} onChange={(e) => setPort(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 font-mono text-[13px] text-ink" />
            </label>
          </div>
        </div>

        <div aria-live="polite" className="space-y-2">
          <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-semibold', result.allowed ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
            {result.allowed ? <CircleCheck className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
            {result.allowed ? 'Traffic allowed' : 'Traffic blocked'}
          </div>
          <ol className="space-y-2">
            <li className="rounded-lg border border-line p-2.5">
              <div className="text-2xs font-semibold text-ink-4 uppercase">Step 1 · {result.first.label}</div>
              <p className="text-[12.5px] text-ink-2">
                {result.firstHit ? (
                  <>
                    First match: <strong className="text-ink">{result.firstHit.name}</strong> (priority {result.firstHit.priority}) → {result.firstHit.access}
                  </>
                ) : (
                  'No rule matched.'
                )}
              </p>
            </li>
            <li className={cn('rounded-lg border p-2.5', result.firstHit?.access === 'Allow' ? 'border-line' : 'border-dashed border-line-strong opacity-60')}>
              <div className="text-2xs font-semibold text-ink-4 uppercase">Step 2 · {result.second.label}</div>
              <p className="text-[12.5px] text-ink-2">
                {result.firstHit?.access !== 'Allow' ? (
                  'Not evaluated — the packet was already dropped.'
                ) : result.secondHit ? (
                  <>
                    First match: <strong className="text-ink">{result.secondHit.name}</strong> (priority {result.secondHit.priority}) → {result.secondHit.access}
                  </>
                ) : (
                  'No rule matched.'
                )}
              </p>
            </li>
          </ol>
          <p className="text-xs leading-relaxed text-ink-3">
            {direction === 'Inbound' ? 'Inbound traffic is evaluated by the subnet NSG first, then the NIC NSG.' : 'Outbound traffic is evaluated by the NIC NSG first, then the subnet NSG.'} Both must allow it.
          </p>
        </div>
      </div>
    </div>
  );
}
