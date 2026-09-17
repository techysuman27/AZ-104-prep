import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Server } from 'lucide-react';
import { cn } from '@/lib/cn';

type ProbeProtocol = 'Tcp' | 'Http';

interface Backend {
  id: string;
  name: string;
  running: boolean;
  listening: boolean;
  status: 200 | 302 | 500;
  nsgAllowsProbe: boolean;
}

const START: Backend[] = [
  { id: 'vm1', name: 'web-vm-1', running: true, listening: true, status: 200, nsgAllowsProbe: true },
  { id: 'vm2', name: 'web-vm-2', running: true, listening: true, status: 500, nsgAllowsProbe: true },
  { id: 'vm3', name: 'web-vm-3', running: true, listening: true, status: 200, nsgAllowsProbe: false },
];

export default function LbProbeSimulator() {
  const [protocol, setProtocol] = useState<ProbeProtocol>('Http');
  const [port, setPort] = useState(80);
  const [path, setPath] = useState('/health');
  const [backends, setBackends] = useState(START);

  const results = useMemo(
    () =>
      backends.map((b) => {
        if (!b.running) return { b, healthy: false, why: 'The VM is stopped, so it isn’t probed at all.' };
        if (!b.nsgAllowsProbe) return { b, healthy: false, why: 'An NSG rule blocks the AzureLoadBalancer service tag, so probes from 168.63.129.16 never arrive.' };
        if (!b.listening) return { b, healthy: false, why: `Nothing is listening on port ${port}, so the probe fails.` };
        if (protocol === 'Http' && b.status !== 200) return { b, healthy: false, why: `The probe path ${path} returns HTTP ${b.status}. Only 200 counts as healthy.` };
        return { b, healthy: true, why: protocol === 'Http' ? `${path} returns HTTP 200.` : `TCP handshake on port ${port} succeeds.` };
      }),
    [backends, protocol, port, path],
  );

  const healthy = results.filter((r) => r.healthy);
  const toggle = (id: string, key: keyof Backend) => setBackends((list) => list.map((b) => (b.id === id ? { ...b, [key]: !b[key] } : b)));

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Backend pool</div>
        {backends.map((b) => {
          const r = results.find((x) => x.b.id === b.id)!;
          return (
            <div key={b.id} className={cn('rounded-xl border p-3', r.healthy ? 'border-success-100 bg-success-50/40' : 'border-danger-100 bg-danger-50/30')}>
              <div className="flex items-center gap-2">
                <Server className="size-4 text-ink-3" aria-hidden="true" />
                <span className="text-[13.5px] font-semibold text-ink">{b.name}</span>
                <span className={cn('ml-auto rounded-md px-1.5 py-0.5 text-2xs font-semibold', r.healthy ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700')}>{r.healthy ? 'Healthy' : 'Unhealthy'}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={b.running} onChange={() => toggle(b.id, 'running')} className="accent-[var(--color-brand-600)]" /> VM running
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={b.listening} onChange={() => toggle(b.id, 'listening')} className="accent-[var(--color-brand-600)]" /> App listening on {port}
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked={b.nsgAllowsProbe} onChange={() => toggle(b.id, 'nsgAllowsProbe')} className="accent-[var(--color-brand-600)]" /> NSG allows AzureLoadBalancer
                </label>
                <label className="inline-flex items-center gap-1.5">
                  HTTP status
                  <select
                    value={b.status}
                    onChange={(e) => setBackends((list) => list.map((x) => (x.id === b.id ? { ...x, status: Number(e.target.value) as Backend['status'] } : x)))}
                    className="h-6 rounded border border-line bg-surface px-1 text-[11.5px]"
                  >
                    <option value={200}>200</option>
                    <option value={302}>302</option>
                    <option value={500}>500</option>
                  </select>
                </label>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{r.why}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Health probe</div>
          <div className="space-y-2">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Probe protocol">
              {(['Tcp', 'Http'] as ProbeProtocol[]).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={protocol === p} onClick={() => setProtocol(p)} className={cn('h-8 flex-1 rounded-lg border text-[13px] font-medium', protocol === p ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-ink-2')}>
                  {p === 'Tcp' ? 'TCP' : 'HTTP'}
                </button>
              ))}
            </div>
            <label className="block text-[13px] text-ink-2">
              Port
              <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 font-mono text-[13px] text-ink" />
            </label>
            {protocol === 'Http' && (
              <label className="block text-[13px] text-ink-2">
                Path
                <input value={path} onChange={(e) => setPath(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 font-mono text-[13px] text-ink" />
              </label>
            )}
          </div>
        </div>

        <div aria-live="polite" className={cn('rounded-xl px-4 py-3', healthy.length === 0 ? 'bg-danger-50 text-danger-700' : healthy.length < backends.length ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700')}>
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            {healthy.length === 0 ? <CircleX className="size-5" aria-hidden="true" /> : <CircleCheck className="size-5" aria-hidden="true" />}
            {healthy.length} of {backends.length} instances healthy
          </div>
          <p className="mt-1 text-[13px] text-ink-2">
            {healthy.length === 0
              ? 'With every probe down, the load balancer has nowhere to send new flows. Existing TCP connections continue.'
              : `New connections are distributed across ${healthy.map((h) => h.b.name).join(', ')} using a five-tuple hash.`}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-ink-3">Probes come from 168.63.129.16 and are permitted by the default AllowAzureLoadBalancerInBound rule — unless a custom deny rule with a lower priority number blocks them. HTTP probes are healthy only on 200.</p>
      </div>
    </div>
  );
}
