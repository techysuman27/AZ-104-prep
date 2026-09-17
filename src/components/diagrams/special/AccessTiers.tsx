import { cn } from '@/lib/cn';

const TIERS = [
  { name: 'Hot', storage: 4, access: 1, minimum: 'None', state: 'Online', latency: 'Milliseconds', use: 'Active data read or written often' },
  { name: 'Cool', storage: 3, access: 2, minimum: '30 days', state: 'Online', latency: 'Milliseconds', use: 'Infrequently accessed, stored at least a month' },
  { name: 'Cold', storage: 2, access: 3, minimum: '90 days', state: 'Online', latency: 'Milliseconds', use: 'Rarely accessed, stored at least a quarter' },
  { name: 'Archive', storage: 1, access: 4, minimum: '180 days', state: 'Offline', latency: 'Hours (rehydration, up to 15 h at Standard priority)', use: 'Long-term retention, flexible retrieval time' },
];

function Level({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-2" aria-label={`${label}: ${['', 'lowest', 'low', 'high', 'highest'][value]}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-3 w-2 rounded-[2px]', i <= value ? 'bg-brand-600' : 'bg-muted')} />
        ))}
      </span>
      <span className="text-xs text-ink-3">{['', 'Lowest', 'Low', 'High', 'Highest'][value]}</span>
    </span>
  );
}

export default function AccessTiers() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-2.5 text-[13px] font-semibold text-ink">Blob access tiers compared (relative, not prices)</div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-subtle/60 text-2xs tracking-wide text-ink-3 uppercase">
            <tr>
              <th className="px-4 py-2 font-semibold">Tier</th>
              <th className="px-4 py-2 font-semibold">Storage cost</th>
              <th className="px-4 py-2 font-semibold">Access cost</th>
              <th className="px-4 py-2 font-semibold">Minimum retention</th>
              <th className="px-4 py-2 font-semibold">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {TIERS.map((t) => (
              <tr key={t.name} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-ink-3">{t.use}</div>
                </td>
                <td className="px-4 py-3">
                  <Level value={t.storage} label="Storage cost" />
                </td>
                <td className="px-4 py-3">
                  <Level value={t.access} label="Access cost" />
                </td>
                <td className="px-4 py-3 text-ink-2">{t.minimum}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-md px-1.5 py-0.5 text-2xs font-semibold', t.state === 'Online' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>{t.state}</span>
                  <div className="mt-1 text-xs text-ink-3">{t.latency}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-ink-3">Moving or deleting a blob before the minimum retention period incurs a prorated early deletion charge. Tiers apply to block blobs.</p>
    </div>
  );
}
