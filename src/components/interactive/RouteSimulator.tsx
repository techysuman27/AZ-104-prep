import { useMemo, useState } from 'react';
import { CircleX, MoveRight, Plus, Trash } from 'lucide-react';
import { cn } from '@/lib/cn';

type NextHop = 'VirtualAppliance' | 'VirtualNetworkGateway' | 'None' | 'VNetLocal' | 'Internet';

interface Route {
  id: number;
  prefix: string;
  nextHop: NextHop;
  nextHopIp?: string;
  system?: boolean;
  label: string;
}

const SYSTEM: Route[] = [
  { id: 900, prefix: '10.1.0.0/16', nextHop: 'VNetLocal', system: true, label: 'Virtual network (address space)' },
  { id: 901, prefix: '10.2.0.0/16', nextHop: 'VNetLocal', system: true, label: 'Virtual network peering' },
  { id: 902, prefix: '0.0.0.0/0', nextHop: 'Internet', system: true, label: 'Default internet route' },
];

const START: Route[] = [
  { id: 1, prefix: '0.0.0.0/0', nextHop: 'VirtualAppliance', nextHopIp: '10.0.100.4', label: 'Forced tunneling to the hub firewall' },
  { id: 2, prefix: '10.2.1.0/24', nextHop: 'None', label: 'Blackhole a sensitive subnet' },
];

const HOP_TEXT: Record<NextHop, string> = {
  VirtualAppliance: 'Sent to the appliance’s private IP. The appliance NIC needs IP forwarding enabled.',
  VirtualNetworkGateway: 'Sent to the VPN gateway (on-premises path).',
  None: 'Dropped — the traffic goes nowhere.',
  VNetLocal: 'Routed inside the virtual network (or a peered network).',
  Internet: 'Sent to the internet (or the Azure backbone for Azure service public IPs).',
};

function parse(cidr: string) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(cidr.trim());
  if (!m) return null;
  const mask = Number(m[5]);
  const ip = ((Number(m[1]) << 24) >>> 0) + (Number(m[2]) << 16) + (Number(m[3]) << 8) + Number(m[4]);
  const size = 2 ** (32 - mask);
  return { base: Math.floor(ip / size) * size, mask, size };
}

function ipToInt(ip: string) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  if (!m) return null;
  return ((Number(m[1]) << 24) >>> 0) + (Number(m[2]) << 16) + (Number(m[3]) << 8) + Number(m[4]);
}

export default function RouteSimulator() {
  const [routes, setRoutes] = useState<Route[]>(START);
  const [dest, setDest] = useState('8.8.8.8');

  const result = useMemo(() => {
    const target = ipToInt(dest);
    if (target === null) return null;
    const all = [...routes.map((r) => ({ ...r, source: 'User-defined route' as const })), ...SYSTEM.map((r) => ({ ...r, source: 'System route' as const }))];
    const candidates = all
      .map((r) => ({ r, net: parse(r.prefix) }))
      .filter((x) => x.net && target >= x.net.base && target < x.net.base + x.net.size)
      .sort((a, b) => b.net!.mask - a.net!.mask || (a.r.source === 'User-defined route' ? -1 : 1));
    return { candidates, winner: candidates[0] };
  }, [routes, dest]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink">Route table rt-app (associated with snet-app)</span>
          <button
            type="button"
            onClick={() => setRoutes((r) => [...r, { id: Date.now(), prefix: '10.3.0.0/16', nextHop: 'VirtualAppliance', nextHopIp: '10.0.100.4', label: 'New route' }])}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            <Plus className="size-3" aria-hidden="true" /> Route
          </button>
        </div>
        <ul className="space-y-1.5">
          {routes.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[12.5px]">
              <input value={r.prefix} aria-label="Address prefix" onChange={(e) => setRoutes((x) => x.map((y) => (y.id === r.id ? { ...y, prefix: e.target.value } : y)))} className="h-7 w-32 rounded-md border border-line bg-surface px-1.5 font-mono" />
              <MoveRight className="size-3 text-ink-4" aria-hidden="true" />
              <select value={r.nextHop} aria-label="Next hop type" onChange={(e) => setRoutes((x) => x.map((y) => (y.id === r.id ? { ...y, nextHop: e.target.value as NextHop } : y)))} className="h-7 rounded-md border border-line bg-surface px-1">
                {(['VirtualAppliance', 'VirtualNetworkGateway', 'None', 'VNetLocal', 'Internet'] as NextHop[]).map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              {r.nextHop === 'VirtualAppliance' && (
                <input value={r.nextHopIp ?? ''} aria-label="Next hop IP" onChange={(e) => setRoutes((x) => x.map((y) => (y.id === r.id ? { ...y, nextHopIp: e.target.value } : y)))} className="h-7 w-28 rounded-md border border-line bg-surface px-1.5 font-mono" />
              )}
              <button type="button" onClick={() => setRoutes((x) => x.filter((y) => y.id !== r.id))} aria-label="Delete route" className="ml-auto grid size-6 place-items-center rounded text-ink-4 hover:text-danger-600">
                <Trash className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <div>
          <div className="mt-3 mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">System routes (always present)</div>
          <ul className="space-y-1">
            {SYSTEM.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-lg bg-subtle/60 px-2 py-1.5 text-[12.5px] text-ink-3">
                <span className="w-32 font-mono">{r.prefix}</span>
                <MoveRight className="size-3" aria-hidden="true" />
                <span>{r.nextHop}</span>
                <span className="ml-auto truncate text-2xs">{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <label className="block text-[13px] text-ink-2">
          Destination IP address
          <input value={dest} onChange={(e) => setDest(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['8.8.8.8', '10.1.4.10', '10.2.1.50', '10.2.5.4'].map((ip) => (
            <button key={ip} type="button" onClick={() => setDest(ip)} className="rounded-md border border-line px-2 py-0.5 font-mono text-2xs text-ink-2 hover:border-brand-300">
              {ip}
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {!result ? (
            <p className="flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger-700">
              <CircleX className="size-4" aria-hidden="true" /> Enter a valid IPv4 address.
            </p>
          ) : !result.winner ? (
            <p className="rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700">No route matches this destination.</p>
          ) : (
            <div className="space-y-3">
              <div className={cn('rounded-xl px-4 py-3', result.winner.r.nextHop === 'None' ? 'bg-danger-50' : 'bg-success-50')}>
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Next hop</div>
                <div className={cn('text-[16px] font-semibold', result.winner.r.nextHop === 'None' ? 'text-danger-700' : 'text-success-700')}>
                  {result.winner.r.nextHop}
                  {result.winner.r.nextHopIp && result.winner.r.nextHop === 'VirtualAppliance' ? ` · ${result.winner.r.nextHopIp}` : ''}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-2">{HOP_TEXT[result.winner.r.nextHop]}</p>
              </div>
              <div>
                <div className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Matching routes (most specific first)</div>
                <ul className="space-y-1">
                  {result.candidates.map(({ r, net }, i) => (
                    <li key={`${r.id}-${i}`} className={cn('flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[12.5px]', i === 0 ? 'border-brand-300 bg-brand-25 font-medium text-ink' : 'border-line text-ink-3')}>
                      <span className="w-28 font-mono">{r.prefix}</span>
                      <span className="w-10 text-2xs">/{net!.mask}</span>
                      <span>{r.nextHop}</span>
                      <span className="ml-auto text-2xs">{r.source}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-ink-3">Azure uses the longest prefix match. When prefixes are identical, a user-defined route beats BGP, which beats a system route.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
