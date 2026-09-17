import { useState } from 'react';
import { ArrowLeftRight, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * A swap moves content and the non-sticky configuration between two slots.
 * Settings marked as "deployment slot setting" stay behind, which is the whole
 * point of the feature and the thing the exam tests.
 */

interface Setting {
  id: string;
  name: string;
  /** Sticky by platform rule — the user cannot change this one. */
  alwaysSticky?: boolean;
  staging: string;
  production: string;
  note: string;
}

const START: Setting[] = [
  { id: 'build', name: 'Application build', staging: 'v2.4 (new)', production: 'v2.3', note: 'App content always travels with the swap — that is what a swap is for.' },
  { id: 'db', name: 'Connection string: Db', staging: 'sql-staging', production: 'sql-prod', note: 'A connection string swaps unless you mark it as a deployment slot setting.' },
  { id: 'flag', name: 'App setting: FeatureFlags', staging: 'checkout-v2=on', production: 'checkout-v2=off', note: 'App settings swap unless marked as a deployment slot setting.' },
  { id: 'runtime', name: '.NET version', staging: '8.0', production: '8.0', note: 'Language framework settings are always swapped.' },
  { id: 'domain', name: 'Custom domain', alwaysSticky: true, staging: 'app-portal-staging.azurewebsites.net', production: 'www.contoso.com', note: 'Custom domain names are never swapped — they stay with the slot.' },
  { id: 'ip', name: 'IP restrictions', alwaysSticky: true, staging: 'Corp VPN only', production: 'Open to the internet', note: 'IP restrictions are slot-specific by default.' },
  { id: 'mi', name: 'Managed identity', alwaysSticky: true, staging: 'staging-identity', production: 'prod-identity', note: 'Managed identities are never swapped.' },
  { id: 'scale', name: 'Scale settings', alwaysSticky: true, staging: '1 instance', production: '4 instances', note: 'Scale settings stay with the slot.' },
];

export default function SlotSwap() {
  const [settings, setSettings] = useState(START);
  const [slotSettings, setSlotSettings] = useState<string[]>(['db']);
  const [swapped, setSwapped] = useState(false);

  const isSticky = (s: Setting) => Boolean(s.alwaysSticky) || slotSettings.includes(s.id);

  const swap = () => {
    setSettings((list) => list.map((s) => (isSticky(s) ? s : { ...s, staging: s.production, production: s.staging })));
    setSwapped(true);
  };

  const reset = () => {
    setSettings(START);
    setSlotSettings(['db']);
    setSwapped(false);
  };

  const toggleSlotSetting = (id: string) =>
    setSlotSettings((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const prodDb = settings.find((s) => s.id === 'db')!.production;
  const wrongDb = prodDb === 'sql-staging';

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={swap}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-[13px] font-semibold text-white"
        >
          <ArrowLeftRight className="size-4" aria-hidden="true" />
          Swap staging into production
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>
        <span className="text-xs text-ink-3">Swapping again rolls the change back — the previous production app is now in staging.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[13px]">
          <thead className="text-2xs tracking-wide text-ink-4 uppercase">
            <tr>
              <th className="py-1.5 pr-3 font-semibold">Setting</th>
              <th className="py-1.5 pr-3 font-semibold">Staging slot</th>
              <th className="py-1.5 pr-3 font-semibold">Production slot</th>
              <th className="py-1.5 font-semibold">Deployment slot setting</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id} className="border-t border-line align-top">
                <td className="py-2 pr-3">
                  <div className="font-medium text-ink">{s.name}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-ink-3">{s.note}</div>
                </td>
                <td className="py-2 pr-3 font-mono text-[12.5px] text-ink-2">{s.staging}</td>
                <td className={cn('py-2 pr-3 font-mono text-[12.5px]', s.id === 'db' && wrongDb ? 'font-semibold text-danger-700' : 'text-ink-2')}>{s.production}</td>
                <td className="py-2">
                  {s.alwaysSticky ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-2xs font-semibold text-ink-3">
                      <Lock className="size-3" aria-hidden="true" />
                      Always slot-specific
                    </span>
                  ) : s.id === 'build' || s.id === 'runtime' ? (
                    <span className="text-2xs text-ink-4">Always swapped</span>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
                      <input type="checkbox" checked={slotSettings.includes(s.id)} onChange={() => toggleSlotSetting(s.id)} className="accent-[var(--color-brand-600)]" />
                      Sticky
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        aria-live="polite"
        className={cn('rounded-xl px-4 py-3 text-[13px]', wrongDb ? 'bg-danger-50 text-danger-700' : swapped ? 'bg-success-50 text-success-700' : 'bg-subtle text-ink-2')}
      >
        {wrongDb ? (
          <>
            <span className="font-semibold">Production is now pointing at the staging database.</span> The connection string swapped because it was not marked as a deployment slot setting. Reset, tick “Sticky” on the Db connection string, and swap again.
          </>
        ) : swapped ? (
          <>
            <span className="font-semibold">Swap complete.</span> The new build is in production, warmed up before any traffic moved. Settings marked sticky — and the platform’s always-slot-specific settings — stayed where they were.
          </>
        ) : (
          'Mark the environment-specific settings as deployment slot settings, then run the swap and watch which values move.'
        )}
      </div>
    </div>
  );
}
