import { useMemo, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

type Net = 'hub' | 'a' | 'b';

const NETS: { id: Net; label: string; range: string; vm: string }[] = [
  { id: 'a', label: 'vnet-spoke-a', range: '10.1.0.0/16', vm: 'vm-a (10.1.1.4)' },
  { id: 'hub', label: 'vnet-hub', range: '10.0.0.0/16', vm: 'vm-shared (10.0.1.10)' },
  { id: 'b', label: 'vnet-spoke-b', range: '10.2.0.0/16', vm: 'vm-b (10.2.1.4)' },
];

const PAIRS: { from: Net; to: Net }[] = [
  { from: 'a', to: 'hub' },
  { from: 'a', to: 'b' },
  { from: 'hub', to: 'b' },
];

export default function PeeringSimulator() {
  const [peerAHub, setPeerAHub] = useState(true);
  const [peerHubB, setPeerHubB] = useState(true);
  const [peerAB, setPeerAB] = useState(false);
  const [firewall, setFirewall] = useState(false);
  const [routes, setRoutes] = useState(false);
  const [forwarded, setForwarded] = useState(false);
  const [overlap, setOverlap] = useState(false);

  const peered = (x: Net, y: Net) => {
    if (overlap && ((x === 'a' && y === 'b') || (x === 'b' && y === 'a'))) return false;
    const k = [x, y].sort().join('-');
    if (k === 'a-hub') return peerAHub;
    if (k === 'b-hub') return peerHubB;
    if (k === 'a-b') return peerAB;
    return false;
  };

  const check = useMemo(
    () => (from: Net, to: Net) => {
      if (from === to) return { ok: true, why: 'Same virtual network.' };
      if (peered(from, to)) return { ok: true, why: 'Directly peered — traffic uses private IPs over the Microsoft backbone.' };
      const viaHub = peered(from, 'hub') && peered('hub', to) && from !== 'hub' && to !== 'hub';
      if (viaHub) {
        if (firewall && routes && forwarded) return { ok: true, why: 'Routed through the hub appliance: UDRs in both spokes, allow forwarded traffic on the peerings, and IP forwarding on the appliance.' };
        const missing = [!firewall && 'an appliance in the hub', !routes && 'user-defined routes in both spokes', !forwarded && 'allow forwarded traffic on the peerings'].filter(Boolean).join(', ');
        return { ok: false, why: `Peering isn’t transitive. A→hub and hub→B don’t create A→B. Missing: ${missing}.` };
      }
      if (overlap && ((from === 'a' && to === 'b') || (from === 'b' && to === 'a'))) return { ok: false, why: 'The address spaces overlap, so these networks can’t be peered at all.' };
      return { ok: false, why: 'No peering exists between these virtual networks.' };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peerAHub, peerHubB, peerAB, firewall, routes, forwarded, overlap],
  );

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-3 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Peerings</div>
        <Switch checked={peerAHub} onCheckedChange={setPeerAHub} label="vnet-spoke-a ↔ vnet-hub" />
        <Switch checked={peerHubB} onCheckedChange={setPeerHubB} label="vnet-hub ↔ vnet-spoke-b" />
        <Switch checked={peerAB} onCheckedChange={setPeerAB} label="vnet-spoke-a ↔ vnet-spoke-b (direct)" />
        <div className="border-t border-line pt-3 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Hub routing</div>
        <Switch checked={firewall} onCheckedChange={setFirewall} label="Firewall appliance in the hub" description="IP forwarding enabled" />
        <Switch checked={routes} onCheckedChange={setRoutes} label="UDRs in both spokes" description="Other spoke’s range → appliance" />
        <Switch checked={forwarded} onCheckedChange={setForwarded} label="Allow forwarded traffic" description="On the peerings" />
        <div className="border-t border-line pt-3">
          <Switch checked={overlap} onCheckedChange={setOverlap} label="Spoke B re-addressed to 10.1.0.0/16" description="Overlaps spoke A" />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {NETS.map((n) => (
            <div key={n.id} className={cn('rounded-xl border p-3', overlap && n.id === 'b' ? 'border-danger-300 bg-danger-50/40' : 'border-line')}>
              <div className="flex items-center gap-2">
                <Icon name="vnet" className="size-4 text-[color:var(--color-networking-ink)]" />
                <span className="text-[13px] font-semibold text-ink">{n.label}</span>
              </div>
              <div className="mt-0.5 font-mono text-2xs text-ink-3">{overlap && n.id === 'b' ? '10.1.0.0/16' : n.range}</div>
              <div className="mt-1 text-2xs text-ink-3">{n.vm}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Connectivity tests</div>
          <ul className="space-y-2" aria-live="polite">
            {PAIRS.map(({ from, to }) => {
              const r = check(from, to);
              const f = NETS.find((n) => n.id === from)!;
              const t = NETS.find((n) => n.id === to)!;
              return (
                <li key={`${from}-${to}`} className={cn('flex gap-3 rounded-xl border px-3 py-2.5', r.ok ? 'border-success-100 bg-success-50/60' : 'border-danger-100 bg-danger-50/50')}>
                  {r.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-label="Reachable" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-danger-500" aria-label="Not reachable" />}
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink">
                      {f.vm.split(' ')[0]} → {t.vm.split(' ')[0]}
                    </div>
                    <p className="text-[12.5px] leading-snug text-ink-2">{r.why}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs leading-relaxed text-ink-3">Peering is never transitive. Spoke-to-spoke traffic needs either a direct peering or a routed path through a hub appliance — and address spaces must never overlap.</p>
      </div>
    </div>
  );
}
