import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, CornerDownRight } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';

type Client = 'vm' | 'onprem' | 'internet';

const CLIENTS: { id: Client; label: string; detail: string }[] = [
  { id: 'vm', label: 'VM in vnet-app', detail: 'Uses Azure-provided DNS' },
  { id: 'onprem', label: 'On-premises server', detail: 'Uses corporate DNS over VPN' },
  { id: 'internet', label: 'Laptop on the internet', detail: 'Uses public DNS' },
];

export default function PrivateEndpointDns() {
  const [endpoint, setEndpoint] = useState(true);
  const [zone, setZone] = useState(false);
  const [link, setLink] = useState(false);
  const [forwarder, setForwarder] = useState(false);
  const [publicAccess, setPublicAccess] = useState(true);
  const [client, setClient] = useState<Client>('vm');

  const result = useMemo(() => {
    const steps: { text: string; tone: 'info' | 'good' | 'bad' }[] = [];
    steps.push({ text: 'Query: stfinance.blob.core.windows.net', tone: 'info' });

    if (endpoint) steps.push({ text: 'Public DNS returns CNAME → stfinance.privatelink.blob.core.windows.net', tone: 'info' });
    else steps.push({ text: 'Public DNS returns the storage account’s public IP directly (no private endpoint exists)', tone: 'info' });

    let resolvesPrivate = false;
    if (endpoint && zone) {
      if (client === 'vm' && link) {
        resolvesPrivate = true;
        steps.push({ text: 'The privatelink zone is linked to vnet-app → A record returns 10.1.3.5', tone: 'good' });
      } else if (client === 'onprem' && link && forwarder) {
        resolvesPrivate = true;
        steps.push({ text: 'Corporate DNS forwards the privatelink query into Azure → A record returns 10.1.3.5', tone: 'good' });
      } else if (client === 'onprem' && link && !forwarder) {
        steps.push({ text: 'Corporate DNS can’t resolve the privatelink zone (no forwarder to Azure) → falls back to the public IP', tone: 'bad' });
      } else if (client === 'vm' && !link) {
        steps.push({ text: 'The privatelink zone exists but isn’t linked to vnet-app → resolves to the public IP', tone: 'bad' });
      } else if (client === 'internet') {
        steps.push({ text: 'Public DNS can’t see the private zone → resolves to the public IP', tone: 'info' });
      }
    } else if (endpoint && !zone) {
      steps.push({ text: 'No private DNS zone exists for privatelink.blob.core.windows.net → resolves to the public IP', tone: 'bad' });
    }

    let ok: boolean;
    let verdict: string;
    if (resolvesPrivate) {
      ok = true;
      verdict = 'Connects privately to 10.1.3.5 through the private endpoint.';
    } else if (publicAccess) {
      ok = client !== 'internet' || true;
      verdict = 'Connects over the public endpoint — traffic leaves your private path, and the account is still exposed to allowed public networks.';
    } else {
      ok = false;
      verdict = 'Connection fails: the name resolves to the public IP, but public network access is disabled on the storage account.';
    }
    return { steps, ok, verdict, resolvesPrivate };
  }, [endpoint, zone, link, forwarder, publicAccess, client]);

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-3 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Configuration</div>
        <Switch checked={endpoint} onCheckedChange={setEndpoint} label="Private endpoint created" description="10.1.3.5 in snet-data" />
        <Switch checked={zone} onCheckedChange={setZone} label="privatelink.blob.core.windows.net zone" description="With an A record for the account" />
        <Switch checked={link} onCheckedChange={setLink} label="Zone linked to vnet-app" />
        <Switch checked={forwarder} onCheckedChange={setForwarder} label="On-premises DNS forwards to Azure" description="For example Azure DNS Private Resolver" />
        <Switch checked={publicAccess} onCheckedChange={setPublicAccess} label="Public network access enabled" />
        <div className="border-t border-line pt-3">
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Who is connecting?</div>
          <div className="space-y-1.5" role="radiogroup" aria-label="Client">
            {CLIENTS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={client === c.id} onClick={() => setClient(c.id)} className={cn('w-full rounded-lg border px-3 py-2 text-left', client === c.id ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-line-strong')}>
                <span className="block text-[13px] font-medium text-ink">{c.label}</span>
                <span className="block text-2xs text-ink-3">{c.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4" aria-live="polite">
        <div>
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Name resolution</div>
          <ol className="space-y-1.5">
            {result.steps.map((s, i) => (
              <li key={i} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 font-mono text-[12px] leading-snug', s.tone === 'good' ? 'border-success-100 bg-success-50/60 text-success-700' : s.tone === 'bad' ? 'border-warning-100 bg-warning-50/60 text-warning-700' : 'border-line text-ink-2')}>
                {i > 0 && <CornerDownRight className="mt-0.5 size-3 shrink-0 opacity-60" aria-hidden="true" />}
                {s.text}
              </li>
            ))}
          </ol>
        </div>
        <div className={cn('flex gap-3 rounded-xl px-4 py-3', result.resolvesPrivate ? 'bg-success-50 text-success-700' : result.ok ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700')}>
          {result.resolvesPrivate ? <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
          <div>
            <div className="text-[14px] font-semibold">{result.resolvesPrivate ? 'Private path' : result.ok ? 'Public path' : 'Connection fails'}</div>
            <p className="text-[13px] text-ink-2">{result.verdict}</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ink-3">
          DNS decides which path is used; the service’s <strong>public network access</strong> setting decides whether the public path works at all. Both matter — that’s why “the private endpoint exists but traffic still goes public” is almost always a DNS problem.
        </p>
      </div>
    </div>
  );
}
