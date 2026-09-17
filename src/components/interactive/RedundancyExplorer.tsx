import { useState } from 'react';
import { CircleCheck, CircleX, Database, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

type Option = 'LRS' | 'ZRS' | 'GRS' | 'RA-GRS' | 'GZRS' | 'RA-GZRS';
type Failure = 'none' | 'server' | 'zone' | 'region';

const OPTIONS: Record<Option, { desc: string; primary: 'datacenter' | 'zones'; geo: boolean; readSecondary: boolean }> = {
  LRS: { desc: 'Three copies in one datacenter', primary: 'datacenter', geo: false, readSecondary: false },
  ZRS: { desc: 'Copies across three availability zones', primary: 'zones', geo: false, readSecondary: false },
  GRS: { desc: 'LRS + asynchronous copy in the paired region', primary: 'datacenter', geo: true, readSecondary: false },
  'RA-GRS': { desc: 'GRS with a readable secondary', primary: 'datacenter', geo: true, readSecondary: true },
  GZRS: { desc: 'ZRS + asynchronous copy in the paired region', primary: 'zones', geo: true, readSecondary: false },
  'RA-GZRS': { desc: 'GZRS with a readable secondary', primary: 'zones', geo: true, readSecondary: true },
};

const FAILURES: { id: Failure; label: string }[] = [
  { id: 'none', label: 'Normal operation' },
  { id: 'server', label: 'A disk or server fails' },
  { id: 'zone', label: 'Zone 1 goes offline' },
  { id: 'region', label: 'The primary region goes offline' },
];

function Copy({ lost, label }: { lost: boolean; label?: string }) {
  return (
    <span
      className={cn('grid size-7 place-items-center rounded-md border transition-all duration-300', lost ? 'border-danger-500/40 bg-danger-50 text-danger-500 opacity-60' : 'border-brand-300 bg-brand-50 text-brand-700')}
      title={label}
    >
      {lost ? <CircleX className="size-3.5" aria-hidden="true" /> : <Database className="size-3.5" aria-hidden="true" />}
    </span>
  );
}

export default function RedundancyExplorer() {
  const [option, setOption] = useState<Option>('ZRS');
  const [failure, setFailure] = useState<Failure>('zone');
  const o = OPTIONS[option];

  const zoneDown = failure === 'zone';
  const regionDown = failure === 'region';
  // LRS/GRS keep all primary copies in one datacenter, modelled in zone 1.
  const primaryAvailable = regionDown ? false : zoneDown ? o.primary === 'zones' : true;
  const secondaryReadable = o.geo && o.readSecondary;

  const outcome = (() => {
    if (primaryAvailable) {
      return {
        tone: 'good' as const,
        title: 'Reads and writes continue',
        text: failure === 'server' ? 'Azure serves the data from the remaining copies and repairs the lost one.' : failure === 'zone' ? 'Synchronous copies in the other zones keep the account fully available.' : 'All copies are healthy.',
      };
    }
    if (o.geo) {
      return {
        tone: 'warn' as const,
        title: secondaryReadable ? 'Reads continue from the secondary endpoint; writes need a failover' : 'Data is safe in the secondary region, but unavailable until failover',
        text: 'Geo-replication is asynchronous, so writes that hadn’t reached the secondary could be lost if you fail over.',
      };
    }
    return {
      tone: 'bad' as const,
      title: 'The account is unavailable',
      text: regionDown ? 'All copies are in the affected region. Access returns only when the region recovers.' : 'All copies are in the affected datacenter.',
    };
  })();

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-60">
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Redundancy</div>
          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2" role="radiogroup" aria-label="Redundancy option">
            {(Object.keys(OPTIONS) as Option[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={option === k} onClick={() => setOption(k)} className={cn('h-9 rounded-lg border text-[13px] font-semibold', option === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-ink-2 hover:border-line-strong')}>
                {k}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-3">{o.desc}</p>
          <div className="mt-4 mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Failure</div>
          <div className="space-y-1.5" role="radiogroup" aria-label="Failure scenario">
            {FAILURES.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={failure === f.id} onClick={() => setFailure(f.id)} className={cn('w-full rounded-lg border px-3 py-2 text-left text-[13px]', failure === f.id ? 'border-ink bg-ink text-white' : 'border-line text-ink-2 hover:border-line-strong')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_minmax(0,0.6fr)]">
            <div className={cn('rounded-2xl border border-dashed p-3', regionDown ? 'border-danger-500/50 bg-danger-50/40' : 'border-ink-4/50')}>
              <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-3 uppercase">Primary region {regionDown && '· offline'}</div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((z) => {
                  const zoneOffline = regionDown || (zoneDown && z === 1);
                  const copies = o.primary === 'zones' ? 1 : z === 1 ? 3 : 0;
                  return (
                    <div key={z} className={cn('rounded-xl border p-2', zoneOffline ? 'border-danger-500/30 bg-danger-50/60' : 'border-line bg-surface')}>
                      <div className="mb-1.5 text-2xs text-ink-3">Zone {z}</div>
                      <div className="flex min-h-7 flex-wrap gap-1">
                        {Array.from({ length: copies }).map((_, i) => (
                          <Copy key={i} lost={zoneOffline || (failure === 'server' && i === 0 && z === 1)} label={`Copy ${i + 1}`} />
                        ))}
                        {copies === 0 && <span className="text-2xs text-ink-4">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hidden items-center text-2xs text-ink-4 sm:flex">{o.geo ? 'async →' : ''}</div>
            <div className={cn('rounded-2xl border border-dashed p-3', o.geo ? 'border-ink-4/50' : 'border-line opacity-50')}>
              <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-3 uppercase">Paired region</div>
              <div className="flex min-h-7 flex-wrap gap-1">
                {o.geo ? [0, 1, 2].map((i) => <Copy key={i} lost={false} />) : <span className="text-2xs text-ink-4">No copy</span>}
              </div>
              {o.geo && <div className="mt-2 text-2xs text-ink-3">{o.readSecondary ? 'Readable any time (-secondary endpoint)' : 'Readable after failover'}</div>}
            </div>
          </div>

          <div
            aria-live="polite"
            className={cn(
              'flex gap-3 rounded-xl px-4 py-3',
              outcome.tone === 'good' ? 'bg-success-50 text-success-700' : outcome.tone === 'warn' ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700',
            )}
          >
            {outcome.tone === 'good' ? <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : outcome.tone === 'warn' ? <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
            <div>
              <div className="text-[14px] font-semibold">{outcome.title}</div>
              <p className="text-[13px] text-ink-2">{outcome.text}</p>
            </div>
          </div>
          <p className="text-xs text-ink-3">Remember: none of these options protect against someone deleting or overwriting data — every copy receives the change.</p>
        </div>
      </div>
    </div>
  );
}
