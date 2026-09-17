import { useMemo, useState } from 'react';
import { KeyRound, ShieldX } from 'lucide-react';
import { CopyButton } from '@/components/content/CodeBlock';
import { cn } from '@/lib/cn';

type SasType = 'user-delegation' | 'service' | 'account';

const PERMS = [
  { id: 'r', label: 'Read' },
  { id: 'a', label: 'Add' },
  { id: 'c', label: 'Create' },
  { id: 'w', label: 'Write' },
  { id: 'd', label: 'Delete' },
  { id: 'l', label: 'List' },
];

const TYPE_INFO: Record<SasType, { title: string; signed: string; revoke: string[] }> = {
  'user-delegation': {
    title: 'User delegation SAS',
    signed: 'Signed with a user delegation key requested with Microsoft Entra credentials. Recommended by Microsoft.',
    revoke: ['Wait for expiry (keep it short).', 'Remove the creator’s data role — the SAS can’t exceed their permissions.', 'Revoke all user delegation keys for the account.', 'Rotating account keys does NOT revoke it.'],
  },
  service: {
    title: 'Service SAS',
    signed: 'Signed with a storage account key. Grants access to resources in one service.',
    revoke: ['If linked to a stored access policy: delete or change the policy (affects only its tokens).', 'Otherwise: regenerate the account key that signed it (affects everything using that key).'],
  },
  account: {
    title: 'Account SAS',
    signed: 'Signed with a storage account key. Can span services and service-level operations.',
    revoke: ['Regenerate the account key that signed it.', 'Stored access policies can’t be used with account SAS.'],
  },
};

export default function SasBuilder() {
  const [type, setType] = useState<SasType>('service');
  const [perms, setPerms] = useState<string[]>(['r', 'l']);
  const [hours, setHours] = useState(24);
  const [https, setHttps] = useState(true);
  const [ip, setIp] = useState('');
  const [policy, setPolicy] = useState(false);

  const usePolicy = type === 'service' && policy;

  const params = useMemo(() => {
    const exp = new Date(Date.UTC(2026, 8, 15, 9, 0, 0) + hours * 3600_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const list: { k: string; v: string; note: string }[] = [{ k: 'sv', v: '2024-11-04', note: 'Signed version — the storage service version used to authorize the request.' }];
    if (type === 'account') {
      list.push({ k: 'ss', v: 'b', note: 'Signed services: b = Blob (f, q, t for Files, Queues, Tables).' });
      list.push({ k: 'srt', v: 'co', note: 'Signed resource types: s = service, c = container, o = object.' });
    } else {
      list.push({ k: 'sr', v: 'c', note: 'Signed resource: c = container (b would be a single blob).' });
    }
    if (usePolicy) {
      list.push({ k: 'si', v: 'partner-read', note: 'Signed identifier: links the token to a stored access policy that holds permissions and expiry.' });
    } else {
      list.push({ k: 'sp', v: PERMS.map((p) => p.id).filter((p) => perms.includes(p)).join('') || 'r', note: 'Signed permissions, in a fixed order (r a c w d l …).' });
      list.push({ k: 'st', v: '2026-09-15T08:45:00Z', note: 'Signed start (optional). Set it slightly in the past to avoid clock-skew failures, or omit it.' });
      list.push({ k: 'se', v: exp, note: 'Signed expiry. Keep it as short as practical.' });
    }
    if (ip.trim()) list.push({ k: 'sip', v: ip.trim(), note: 'Allowed IP address or range. Network rules on the account still apply.' });
    list.push({ k: 'spr', v: https ? 'https' : 'https,http', note: 'Allowed protocols. HTTPS only is recommended.' });
    if (type === 'user-delegation') {
      list.push({ k: 'skoid', v: '<object-id>', note: 'Object ID of the Microsoft Entra principal that requested the delegation key.' });
      list.push({ k: 'sktid', v: '<tenant-id>', note: 'Tenant of that principal.' });
      list.push({ k: 'ske', v: '<key-expiry>', note: 'Expiry of the user delegation key.' });
    }
    list.push({ k: 'sig', v: '<signature>', note: 'HMAC signature computed over the parameters. Changing any parameter invalidates it.' });
    return list;
  }, [type, perms, hours, https, ip, usePolicy]);

  const url = `https://stcontosodocs01.blob.core.windows.net/exports?${params.map((p) => `${p.k}=${p.v}`).join('&')}`;

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">SAS type</div>
          <div className="space-y-1.5" role="radiogroup" aria-label="SAS type">
            {(Object.keys(TYPE_INFO) as SasType[]).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cn('w-full rounded-lg border px-3 py-2 text-left text-[13px] font-medium', type === t ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line text-ink-2 hover:border-line-strong')}>
                {TYPE_INFO[t].title}
              </button>
            ))}
          </div>
        </div>
        {type === 'service' && (
          <label className="flex items-start gap-2 text-[13px] text-ink-2">
            <input type="checkbox" checked={policy} onChange={() => setPolicy((p) => !p)} className="mt-0.5 accent-[var(--color-brand-600)]" />
            Use stored access policy “partner-read” (permissions and expiry come from the policy)
          </label>
        )}
        {!usePolicy && (
          <fieldset>
            <legend className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Permissions</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {PERMS.map((p) => (
                <label key={p.id} className={cn('flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[12.5px]', perms.includes(p.id) ? 'border-brand-300 bg-brand-25' : 'border-line')}>
                  <input type="checkbox" checked={perms.includes(p.id)} onChange={() => setPerms((x) => (x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id]))} className="accent-[var(--color-brand-600)]" />
                  {p.label}
                </label>
              ))}
            </div>
            <label className="mt-3 block text-[13px] text-ink-2">
              Valid for
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
                <option value={8760}>1 year (risky)</option>
              </select>
            </label>
          </fieldset>
        )}
        <label className="block text-[13px] text-ink-2">
          Allowed IP addresses (optional)
          <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.0-203.0.113.255" className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink" />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={https} onChange={() => setHttps((h) => !h)} className="accent-[var(--color-brand-600)]" /> HTTPS only
        </label>
        {hours === 8760 && !usePolicy && type !== 'user-delegation' && (
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">A year-long key-signed SAS can only be revoked by rotating the account key. Consider a stored access policy.</p>
        )}
      </div>

      <div className="min-w-0 space-y-4 p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">SAS URL (example)</span>
            <CopyButton text={url} label="Copy SAS URL" />
          </div>
          <div className="scrollbar-thin overflow-x-auto rounded-lg bg-design-900 px-3 py-2.5 font-mono text-[12px] leading-relaxed break-all text-white/90">{url}</div>
        </div>
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Every parameter explained</div>
          <dl className="divide-y divide-line rounded-xl border border-line">
            {params.map((p) => (
              <div key={p.k} className="grid gap-1 px-3 py-2 sm:grid-cols-[90px_minmax(0,1fr)]">
                <dt>
                  <code className="rounded bg-subtle px-1.5 py-0.5 text-xs text-ink">{p.k}</code>
                </dt>
                <dd className="text-[12.5px] leading-snug text-ink-2">
                  <span className="font-mono text-ink">{p.v}</span> — {p.note}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <KeyRound className="size-4 text-brand-600" aria-hidden="true" /> How it’s signed
            </div>
            <p className="mt-1 text-[12.5px] text-ink-2">{TYPE_INFO[type].signed}</p>
          </div>
          <div className="rounded-xl border border-danger-100 bg-danger-50/40 p-3">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-danger-700">
              <ShieldX className="size-4" aria-hidden="true" /> How to revoke it
            </div>
            <ul className="mt-1 space-y-1 text-[12.5px] text-ink-2">
              {(usePolicy ? ['Delete the stored access policy, rename its identifier, or set its expiry in the past. Takes effect within about 30 seconds.'] : TYPE_INFO[type].revoke).map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
