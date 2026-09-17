import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Server, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

type Placement = 'single' | 'avset' | 'zones';
type Failure = 'none' | 'host' | 'rack' | 'update' | 'zone' | 'region';

const PLACEMENTS: { id: Placement; label: string; detail: string }[] = [
  { id: 'single', label: 'Three VMs, no grouping', detail: 'Azure may place every instance on the same rack — nothing guarantees separation.' },
  { id: 'avset', label: 'Availability set', detail: 'Instances are spread across fault domains (separate racks, power and network) and update domains (staged reboots).' },
  { id: 'zones', label: 'Across three availability zones', detail: 'Each instance runs in a physically separate datacentre with independent power, cooling and networking.' },
];

const FAILURES: { id: Failure; label: string; detail: string }[] = [
  { id: 'none', label: 'Healthy', detail: 'No failure in progress.' },
  { id: 'host', label: 'Single host failure', detail: 'One physical server fails.' },
  { id: 'rack', label: 'Rack failure', detail: 'A top-of-rack switch or power distribution unit fails, taking a whole rack offline.' },
  { id: 'update', label: 'Planned platform maintenance', detail: 'Azure reboots hosts in stages to apply platform updates.' },
  { id: 'zone', label: 'Availability zone outage', detail: 'An entire datacentre in the region is unavailable.' },
  { id: 'region', label: 'Regional outage', detail: 'The whole region is unavailable.' },
];

/** Where each instance lands, per placement. fd = fault domain, zone = availability zone. */
function layout(placement: Placement) {
  if (placement === 'zones') return [0, 1, 2].map((i) => ({ id: `vm${i + 1}`, zone: i + 1, fd: i, ud: i }));
  if (placement === 'avset') return [0, 1, 2].map((i) => ({ id: `vm${i + 1}`, zone: 1, fd: i, ud: i }));
  return [0, 1, 2].map((i) => ({ id: `vm${i + 1}`, zone: 1, fd: 0, ud: 0 }));
}

function survives(vm: { zone: number; fd: number; ud: number }, failure: Failure): boolean {
  switch (failure) {
    case 'none':
      return true;
    case 'host':
      // Without a placement guarantee every instance could share the failing host;
      // with one, the failing host holds a single instance.
      return vm.fd !== 0;
    case 'rack':
      return vm.fd !== 0;
    case 'update':
      return vm.ud !== 0;
    case 'zone':
      return vm.zone !== 1;
    case 'region':
      return false;
  }
}

export default function AvailabilitySimulator() {
  const [placement, setPlacement] = useState<Placement>('avset');
  const [failure, setFailure] = useState<Failure>('rack');

  const vms = useMemo(() => layout(placement), [placement]);
  const results = vms.map((vm) => ({ ...vm, up: survives(vm, failure) }));
  const up = results.filter((r) => r.up).length;

  const verdict = (() => {
    if (failure === 'none') return { tone: 'good' as const, text: 'All instances are serving traffic.' };
    if (up === 0) return { tone: 'bad' as const, text: 'The application is completely down.' };
    if (up < results.length) return { tone: 'warn' as const, text: `The application stays up on ${up} of ${results.length} instances, at reduced capacity.` };
    return { tone: 'good' as const, text: 'Every instance survives this failure.' };
  })();

  const explanation = (() => {
    if (failure === 'none') return 'Change the failure to see how the placement responds.';
    if (failure === 'region') return 'No in-region placement survives the loss of the whole region. That needs a second region: replication with Azure Site Recovery, a paired-region design, or geo-redundant data plus redeployment.';
    if (placement === 'single') return 'Without an availability set or zones, Azure gives no placement guarantee. A single rack failure or a staged reboot can take every instance at once.';
    if (placement === 'avset') {
      if (failure === 'zone') return 'An availability set lives inside one datacentre. Fault and update domains do not protect against losing that datacentre, so a zone outage takes all instances.';
      return 'Fault domains put instances on separate racks with separate power and networking; update domains are rebooted one at a time, so a staged platform update never takes them all.';
    }
    if (failure === 'zone') return 'Each instance is in a different datacentre, so a zone outage removes exactly one. Remember that the load balancer and public IP in front must also be zone-redundant.';
    return 'Zonal placement implies separate racks and separate maintenance, so rack failures and platform updates affect at most one instance.';
  })();

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <fieldset>
          <legend className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Placement</legend>
          <div className="space-y-1.5">
            {PLACEMENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={placement === p.id}
                onClick={() => setPlacement(p.id)}
                className={cn(
                  'block w-full rounded-lg border px-3 py-2 text-left text-[13px]',
                  placement === p.id ? 'border-brand-600 bg-brand-50 text-ink' : 'border-line text-ink-2 hover:border-line-strong',
                )}
              >
                <span className="font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">{PLACEMENTS.find((p) => p.id === placement)!.detail}</p>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Failure</legend>
          <select
            value={failure}
            onChange={(e) => setFailure(e.target.value as Failure)}
            className="h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink"
            aria-label="Failure to simulate"
          >
            {FAILURES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">{FAILURES.find((f) => f.id === failure)!.detail}</p>
        </fieldset>
      </div>

      <div className="min-w-0 space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          {results.map((r, i) => (
            <div
              key={r.id}
              className={cn('rounded-xl border p-3 text-center', r.up ? 'border-success-100 bg-success-50/50' : 'border-danger-100 bg-danger-50/40')}
            >
              <Server className={cn('mx-auto size-5', r.up ? 'text-success-700' : 'text-danger-700')} aria-hidden="true" />
              <div className="mt-1 text-[13px] font-semibold text-ink">vm-web-{i + 1}</div>
              <div className="mt-0.5 text-2xs text-ink-3">
                {placement === 'zones' ? `Zone ${r.zone}` : placement === 'avset' ? `FD ${r.fd} · UD ${r.ud}` : 'No guarantee'}
              </div>
              <div className={cn('mt-1.5 text-2xs font-semibold', r.up ? 'text-success-700' : 'text-danger-700')}>{r.up ? 'Running' : 'Down'}</div>
            </div>
          ))}
        </div>

        <div
          aria-live="polite"
          className={cn(
            'rounded-xl px-4 py-3',
            verdict.tone === 'good' ? 'bg-success-50 text-success-700' : verdict.tone === 'warn' ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700',
          )}
        >
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            {verdict.tone === 'good' ? <CircleCheck className="size-5" aria-hidden="true" /> : verdict.tone === 'warn' ? <TriangleAlert className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
            {verdict.text}
          </div>
          <p className="mt-1 text-[13px] text-ink-2">{explanation}</p>
        </div>

        <p className="text-xs leading-relaxed text-ink-3">
          An availability set offers up to 3 fault domains and 20 update domains in most regions. Availability zones give physically separate datacentres and a higher VM SLA, but only in regions that offer zones — and availability set membership and zone placement are both chosen when the VM is created.
        </p>
      </div>
    </div>
  );
}
