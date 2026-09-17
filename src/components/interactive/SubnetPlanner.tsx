import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Plus, TriangleAlert, Trash } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Row {
  id: number;
  name: string;
  cidr: string;
}

function parse(cidr: string): { base: number; mask: number; size: number } | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(cidr.trim());
  if (!m) return null;
  const parts = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const mask = Number(m[5]);
  if (parts.some((p) => p > 255) || mask < 0 || mask > 32) return null;
  const ip = ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  const size = 2 ** (32 - mask);
  const base = Math.floor(ip / size) * size;
  return { base, mask, size };
}

function toIp(n: number) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export default function SubnetPlanner() {
  const [vnet, setVnet] = useState('10.1.0.0/16');
  const [peer, setPeer] = useState('10.2.0.0/16');
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: 'snet-web', cidr: '10.1.1.0/24' },
    { id: 2, name: 'snet-app', cidr: '10.1.2.0/24' },
    { id: 3, name: 'AzureBastionSubnet', cidr: '10.1.255.0/28' },
  ]);

  const analysis = useMemo(() => {
    const v = parse(vnet);
    const p = parse(peer);
    const parsed = rows.map((r) => ({ row: r, net: parse(r.cidr) }));
    const issues: { id: number; level: 'error' | 'warn'; text: string }[] = [];

    parsed.forEach(({ row, net }) => {
      if (!net) {
        issues.push({ id: row.id, level: 'error', text: 'Not a valid CIDR range.' });
        return;
      }
      if (net.mask > 29) issues.push({ id: row.id, level: 'error', text: 'Smaller than /29 — the smallest IPv4 subnet Azure supports.' });
      if (v && (net.base < v.base || net.base + net.size > v.base + v.size)) issues.push({ id: row.id, level: 'error', text: `Outside the virtual network address space ${vnet}.` });
      if (row.name === 'AzureBastionSubnet' && net.mask > 26) issues.push({ id: row.id, level: 'error', text: 'AzureBastionSubnet must be /26 or larger.' });
      if (row.name.toLowerCase() === 'gatewaysubnet' && net.mask > 27) issues.push({ id: row.id, level: 'warn', text: 'GatewaySubnet is usually /27 or larger to allow for gateway growth.' });
      if (net.size - 5 < 3) issues.push({ id: row.id, level: 'warn', text: 'Very few usable addresses after Azure’s five reserved addresses.' });
      if (p && net.base < p.base + p.size && p.base < net.base + net.size) issues.push({ id: row.id, level: 'error', text: `Overlaps the network you plan to peer with (${peer}).` });
    });

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const a = parsed[i].net;
        const b = parsed[j].net;
        if (a && b && a.base < b.base + b.size && b.base < a.base + a.size) {
          issues.push({ id: parsed[j].row.id, level: 'error', text: `Overlaps ${parsed[i].row.name} (${parsed[i].row.cidr}).` });
        }
      }
    }

    const used = parsed.reduce((s, x) => s + (x.net?.size ?? 0), 0);
    return { v, parsed, issues, used };
  }, [rows, vnet, peer]);

  const addRow = () => setRows((r) => [...r, { id: Math.max(0, ...r.map((x) => x.id)) + 1, name: `snet-${r.length + 1}`, cidr: '' }]);

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[13px] text-ink-2">
          Virtual network address space
          <input value={vnet} onChange={(e) => setVnet(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink" />
        </label>
        <label className="text-[13px] text-ink-2">
          Network you plan to peer with
          <input value={peer} onChange={(e) => setPeer(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink" />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-subtle/70 text-2xs tracking-wide text-ink-3 uppercase">
            <tr>
              <th className="px-3 py-2 font-semibold">Subnet</th>
              <th className="px-3 py-2 font-semibold">Address range</th>
              <th className="px-3 py-2 font-semibold">Addresses</th>
              <th className="px-3 py-2 font-semibold">Usable</th>
              <th className="px-3 py-2 font-semibold">Range</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {analysis.parsed.map(({ row, net }) => {
              const rowIssues = analysis.issues.filter((i) => i.id === row.id);
              return (
                <tr key={row.id} className={cn('align-top', rowIssues.some((i) => i.level === 'error') && 'bg-danger-50/40')}>
                  <td className="px-3 py-2">
                    <input
                      value={row.name}
                      onChange={(e) => setRows((r) => r.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)))}
                      aria-label="Subnet name"
                      className="h-8 w-full min-w-[150px] rounded-md border border-line bg-surface px-2 text-[13px] text-ink"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.cidr}
                      onChange={(e) => setRows((r) => r.map((x) => (x.id === row.id ? { ...x, cidr: e.target.value } : x)))}
                      aria-label="Subnet CIDR"
                      placeholder="10.1.3.0/24"
                      className="h-8 w-full min-w-[130px] rounded-md border border-line bg-surface px-2 font-mono text-[13px] text-ink"
                    />
                    {rowIssues.map((i) => (
                      <p key={i.text} className={cn('mt-1 flex items-start gap-1 text-2xs', i.level === 'error' ? 'text-danger-700' : 'text-warning-700')}>
                        {i.level === 'error' ? <CircleX className="mt-px size-3 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden="true" />}
                        {i.text}
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-2 tabular text-ink-2">{net ? net.size : '—'}</td>
                  <td className="px-3 py-2 font-semibold tabular text-ink">{net ? Math.max(0, net.size - 5) : '—'}</td>
                  <td className="px-3 py-2 font-mono text-2xs text-ink-3">{net ? `${toIp(net.base)} – ${toIp(net.base + net.size - 1)}` : '—'}</td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))} aria-label={`Remove ${row.name}`} className="grid size-7 place-items-center rounded-md text-ink-4 hover:bg-subtle hover:text-danger-600">
                      <Trash className="size-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={addRow} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-2 hover:border-line-strong">
          <Plus className="size-3.5" aria-hidden="true" /> Add subnet
        </button>
        {analysis.v && (
          <span className="text-[13px] text-ink-3">
            Allocated <strong className="text-ink tabular">{analysis.used.toLocaleString()}</strong> of{' '}
            <strong className="text-ink tabular">{analysis.v.size.toLocaleString()}</strong> addresses in the address space
          </span>
        )}
      </div>

      <div aria-live="polite" className={cn('flex gap-2 rounded-xl px-4 py-3 text-[13.5px]', analysis.issues.some((i) => i.level === 'error') ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700')}>
        {analysis.issues.some((i) => i.level === 'error') ? <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        <span>
          {analysis.issues.some((i) => i.level === 'error')
            ? 'Fix the highlighted problems — Azure would reject this plan or the networks couldn’t be peered.'
            : 'This plan is valid: subnets fit inside the address space, don’t overlap each other, and don’t clash with the network you plan to peer with.'}
        </span>
      </div>
      <p className="text-xs text-ink-3">Azure reserves five addresses per subnet (network, gateway, two for DNS, broadcast). The smallest subnet is /29 and the largest is /2.</p>
    </div>
  );
}
