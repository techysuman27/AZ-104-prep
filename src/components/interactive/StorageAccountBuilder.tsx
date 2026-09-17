import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';

type AccountType = 'gpv2' | 'premium-blob' | 'premium-files';
type Redundancy = 'LRS' | 'ZRS' | 'GRS' | 'RA-GRS' | 'GZRS' | 'RA-GZRS';
type Network = 'all' | 'selected' | 'disabled';

interface Config {
  name: string;
  type: AccountType;
  redundancy: Redundancy;
  tier: 'Hot' | 'Cool' | 'Cold';
  network: Network;
  softDelete: boolean;
  versioning: boolean;
  anonymous: boolean;
}

interface Check {
  ok: 'pass' | 'warn' | 'fail';
  text: string;
}

interface ScenarioDef {
  id: string;
  title: string;
  brief: string;
  evaluate: (c: Config) => Check[];
}

const TYPE_LABEL: Record<AccountType, string> = {
  gpv2: 'Standard general-purpose v2',
  'premium-blob': 'Premium block blobs',
  'premium-files': 'Premium file shares',
};

const ALLOWED_REDUNDANCY: Record<AccountType, Redundancy[]> = {
  gpv2: ['LRS', 'ZRS', 'GRS', 'RA-GRS', 'GZRS', 'RA-GZRS'],
  'premium-blob': ['LRS', 'ZRS'],
  'premium-files': ['LRS', 'ZRS'],
};

function nameCheck(name: string): Check {
  if (!/^[a-z0-9]{3,24}$/.test(name)) return { ok: 'fail', text: 'Name must be 3–24 characters using only lowercase letters and numbers.' };
  return { ok: 'pass', text: 'Valid storage account name (it must also be globally unique).' };
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'web',
    title: 'Product images for an online store',
    brief: 'Images must stay available during a zone outage, and the site must be able to read images from another region during a regional outage without a failover. No container may ever be public. Accidental deletes must be recoverable.',
    evaluate: (c) => [
      c.type === 'gpv2' ? { ok: 'pass', text: 'Standard GPv2 supports the geo-redundant options this needs.' } : { ok: 'fail', text: `${TYPE_LABEL[c.type]} only supports LRS or ZRS — no regional copy.` },
      c.redundancy === 'RA-GZRS'
        ? { ok: 'pass', text: 'RA-GZRS: zone-redundant primary plus a readable secondary.' }
        : c.redundancy === 'RA-GRS'
          ? { ok: 'fail', text: 'RA-GRS keeps the primary in one datacenter, so a zone outage can interrupt access.' }
          : c.redundancy === 'GZRS'
            ? { ok: 'fail', text: 'GZRS survives zone outages, but the secondary is readable only after failover.' }
            : { ok: 'fail', text: `${c.redundancy} doesn’t meet both the zone and regional read requirements.` },
      !c.anonymous ? { ok: 'pass', text: 'Anonymous container access is disabled at the account level.' } : { ok: 'fail', text: 'Allowing anonymous access lets someone make a container public.' },
      c.softDelete || c.versioning ? { ok: 'pass', text: 'Deleted images can be recovered.' } : { ok: 'fail', text: 'Enable blob soft delete and/or versioning to recover deletes.' },
    ],
  },
  {
    id: 'archive',
    title: 'Seven-year invoice archive',
    brief: 'Invoices are rarely read after 90 days and must be kept for 7 years at the lowest storage cost. Data must survive a regional disaster. Only the finance subnet and head office IP range may reach the account.',
    evaluate: (c) => [
      c.type === 'gpv2' ? { ok: 'pass', text: 'GPv2 supports access tiers including archive.' } : { ok: 'fail', text: 'Premium accounts don’t support hot/cool/cold/archive tiers.' },
      ['GRS', 'RA-GRS'].includes(c.redundancy)
        ? { ok: 'pass', text: `${c.redundancy} survives a regional disaster and supports the archive tier.` }
        : ['ZRS', 'GZRS', 'RA-GZRS'].includes(c.redundancy)
          ? { ok: 'fail', text: `Archive tier isn’t supported with ${c.redundancy}.` }
          : { ok: 'fail', text: 'LRS doesn’t survive a regional disaster.' },
      c.tier !== 'Hot' ? { ok: 'pass', text: `${c.tier} default tier lowers storage cost; add a lifecycle rule to archive older invoices.` } : { ok: 'warn', text: 'Hot is the most expensive tier to store in; use cool or cold and a lifecycle rule to archive.' },
      c.network === 'selected' ? { ok: 'pass', text: 'Selected networks lets you allow only the finance subnet and office IP range.' } : c.network === 'disabled' ? { ok: 'warn', text: 'Disabling public access needs private endpoints for the subnet and a private path for the office.' } : { ok: 'fail', text: 'Allowing all networks doesn’t meet the network restriction.' },
    ],
  },
  {
    id: 'nfs',
    title: 'Linux render farm scratch share',
    brief: 'Linux render nodes need an NFS 4.1 file share with consistent low latency in one region. The share must stay available during a zone outage. Only the render subnet may access it.',
    evaluate: (c) => [
      c.type === 'premium-files' ? { ok: 'pass', text: 'NFS shares require premium (SSD) file shares.' } : { ok: 'fail', text: 'NFS 4.1 shares are available only in premium file shares accounts.' },
      c.redundancy === 'ZRS' ? { ok: 'pass', text: 'ZRS keeps the share available during a zone outage.' } : c.redundancy === 'LRS' ? { ok: 'fail', text: 'LRS keeps copies in one datacenter.' } : { ok: 'fail', text: 'Premium file shares support only LRS and ZRS.' },
      c.network !== 'all' ? { ok: 'pass', text: 'NFS shares aren’t reachable from the internet anyway; use a service endpoint or private endpoint for the subnet.' } : { ok: 'fail', text: 'Restrict access to the render subnet (NFS requires a service or private endpoint).' },
    ],
  },
];

export default function StorageAccountBuilder() {
  const [scenarioId, setScenarioId] = useState('web');
  const [c, setC] = useState<Config>({ name: 'stcontoso01', type: 'gpv2', redundancy: 'LRS', tier: 'Hot', network: 'all', softDelete: false, versioning: false, anonymous: true });
  const [submitted, setSubmitted] = useState(false);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  const checks = useMemo(() => {
    const base: Check[] = [nameCheck(c.name)];
    if (!ALLOWED_REDUNDANCY[c.type].includes(c.redundancy)) base.push({ ok: 'fail', text: `${TYPE_LABEL[c.type]} doesn’t support ${c.redundancy}. The portal wouldn’t let you create this.` });
    return [...base, ...scenario.evaluate(c)];
  }, [c, scenario]);

  const set = <K extends keyof Config>(k: K, v: Config[K]) => {
    setC((x) => ({ ...x, [k]: v }));
    setSubmitted(false);
  };
  const score = checks.filter((x) => x.ok === 'pass').length;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Scenario</div>
          <div className="flex flex-wrap gap-1.5">
            {SCENARIOS.map((s) => (
              <button key={s.id} type="button" aria-pressed={scenarioId === s.id} onClick={() => { setScenarioId(s.id); setSubmitted(false); }} className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium', scenarioId === s.id ? 'border-ink bg-ink text-white' : 'border-line text-ink-2 hover:border-line-strong')}>
                {s.title}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-design-50 px-3 py-2 text-[13px] leading-relaxed text-ink-2">{scenario.brief}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-ink-2 sm:col-span-2">
            Storage account name
            <input value={c.name} onChange={(e) => set('name', e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink" />
          </label>
          <label className="text-[13px] text-ink-2">
            Performance / account type
            <select value={c.type} onChange={(e) => set('type', e.target.value as AccountType)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
              {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-ink-2">
            Redundancy
            <select value={c.redundancy} onChange={(e) => set('redundancy', e.target.value as Redundancy)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
              {(['LRS', 'ZRS', 'GRS', 'RA-GRS', 'GZRS', 'RA-GZRS'] as Redundancy[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                  {!ALLOWED_REDUNDANCY[c.type].includes(r) ? ' (not available)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-ink-2">
            Default access tier
            <select value={c.tier} disabled={c.type !== 'gpv2'} onChange={(e) => set('tier', e.target.value as Config['tier'])} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink disabled:opacity-50">
              <option>Hot</option>
              <option>Cool</option>
              <option>Cold</option>
            </select>
          </label>
          <label className="text-[13px] text-ink-2">
            Public network access
            <select value={c.network} onChange={(e) => set('network', e.target.value as Network)} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
              <option value="all">Enabled from all networks</option>
              <option value="selected">Enabled from selected networks</option>
              <option value="disabled">Disabled (private endpoints)</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Switch checked={c.softDelete} onCheckedChange={(v) => set('softDelete', v)} label="Blob soft delete" />
          <Switch checked={c.versioning} onCheckedChange={(v) => set('versioning', v)} label="Blob versioning" />
          <Switch checked={c.anonymous} onCheckedChange={(v) => set('anonymous', v)} label="Allow anonymous container access" />
        </div>
        <button type="button" onClick={() => setSubmitted(true)} className="h-9 rounded-lg bg-brand-600 px-4 text-[13px] font-medium text-white hover:bg-brand-700">
          Review + create
        </button>
      </div>

      <div className="p-4" aria-live="polite">
        {!submitted ? (
          <div className="grid h-full min-h-48 place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center text-[13.5px] text-ink-3">Configure the account, then select Review + create to validate it against the scenario.</div>
        ) : (
          <div className="animate-rise-in space-y-3">
            <div className={cn('rounded-xl px-4 py-3', checks.every((x) => x.ok !== 'fail') ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>
              <div className="text-[15px] font-semibold">{checks.every((x) => x.ok !== 'fail') ? 'This design meets the requirements' : 'Some requirements aren’t met yet'}</div>
              <div className="text-[13px] text-ink-2">
                {score} of {checks.length} checks passed
              </div>
            </div>
            <ul className="space-y-2">
              {checks.map((ch) => (
                <li key={ch.text} className="flex gap-2 rounded-lg border border-line px-3 py-2 text-[13px] leading-snug text-ink-2">
                  {ch.ok === 'pass' ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-label="Pass" /> : ch.ok === 'warn' ? <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" aria-label="Warning" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-danger-500" aria-label="Fail" />}
                  {ch.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
