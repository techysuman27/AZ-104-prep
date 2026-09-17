import { useMemo, useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';

/**
 * A query is a pipeline. This widget makes that literal: each step is applied to
 * the rows the previous step produced, so learners see what every operator does
 * instead of reading about it.
 */

interface Row {
  TimeGenerated: string;
  Computer: string;
  CounterName: string;
  CounterValue: number;
}

const DATA: Row[] = [
  { TimeGenerated: '09:05', Computer: 'vm-web01', CounterName: 'Available MBytes', CounterValue: 1840 },
  { TimeGenerated: '09:05', Computer: 'vm-web02', CounterName: 'Available MBytes', CounterValue: 420 },
  { TimeGenerated: '09:05', Computer: 'vm-sql01', CounterName: 'Available MBytes', CounterValue: 310 },
  { TimeGenerated: '09:05', Computer: 'vm-web01', CounterName: '% Processor Time', CounterValue: 34 },
  { TimeGenerated: '09:20', Computer: 'vm-web01', CounterName: 'Available MBytes', CounterValue: 1620 },
  { TimeGenerated: '09:20', Computer: 'vm-web02', CounterName: 'Available MBytes', CounterValue: 380 },
  { TimeGenerated: '09:20', Computer: 'vm-sql01', CounterName: 'Available MBytes', CounterValue: 260 },
  { TimeGenerated: '09:20', Computer: 'vm-web01', CounterName: '% Processor Time', CounterValue: 78 },
  { TimeGenerated: '09:35', Computer: 'vm-web02', CounterName: 'Available MBytes', CounterValue: 300 },
  { TimeGenerated: '09:35', Computer: 'vm-sql01', CounterName: 'Available MBytes', CounterValue: 180 },
];

type StepId = 'where-counter' | 'where-value' | 'project' | 'extend' | 'summarize' | 'sort' | 'top';

const STEPS: { id: StepId; kql: string; label: string; note: string }[] = [
  { id: 'where-counter', kql: '| where CounterName == "Available MBytes"', label: 'Filter to one counter', note: '`where` keeps only the rows matching the condition. Filtering early is the cheapest thing you can do.' },
  { id: 'where-value', kql: '| where CounterValue < 500', label: 'Filter to low memory', note: 'Conditions can be piped one after another, or combined with `and`.' },
  { id: 'extend', kql: '| extend LowMemory = CounterValue < 500', label: 'Add a computed column', note: '`extend` adds a column and keeps every original column.' },
  { id: 'project', kql: '| project TimeGenerated, Computer, CounterValue', label: 'Choose the columns', note: '`project` replaces the column set — anything not listed is dropped.' },
  { id: 'summarize', kql: '| summarize minMB = min(CounterValue) by Computer', label: 'Aggregate per machine', note: '`summarize` groups rows and applies an aggregate. The result has one row per group.' },
  { id: 'sort', kql: '| sort by CounterValue asc', label: 'Sort the results', note: '`sort by` orders the whole result set. Descending is the default, so `asc` must be explicit.' },
  { id: 'top', kql: '| top 3 by CounterValue desc', label: 'Take the top rows', note: '`top` sorts server-side and returns only the first rows — cheaper than sort plus take.' },
];

type Out = { kind: 'rows'; rows: Row[]; extend: boolean; project: boolean } | { kind: 'groups'; groups: { Computer: string; minMB: number }[] };

function run(applied: StepId[]): { out: Out; blocked: StepId[] } {
  let rows = [...DATA];
  let extend = false;
  let project = false;
  type Group = { Computer: string; minMB: number };
  let grouped: Group[] | null = null;
  const blocked: StepId[] = [];

  for (const id of applied) {
    if (grouped) {
      // After summarize the shape has changed; only sorting still applies here.
      const g: Group[] = grouped;
      if (id === 'sort') grouped = [...g].sort((a, b) => a.minMB - b.minMB);
      else if (id === 'top') grouped = [...g].sort((a, b) => b.minMB - a.minMB).slice(0, 3);
      else blocked.push(id);
      continue;
    }
    switch (id) {
      case 'where-counter':
        rows = rows.filter((r) => r.CounterName === 'Available MBytes');
        break;
      case 'where-value':
        rows = rows.filter((r) => r.CounterValue < 500);
        break;
      case 'extend':
        extend = true;
        break;
      case 'project':
        project = true;
        break;
      case 'summarize': {
        const map = new Map<string, number>();
        rows.forEach((r) => map.set(r.Computer, Math.min(map.get(r.Computer) ?? Infinity, r.CounterValue)));
        grouped = [...map.entries()].map(([Computer, minMB]) => ({ Computer, minMB }));
        break;
      }
      case 'sort':
        rows = [...rows].sort((a, b) => a.CounterValue - b.CounterValue);
        break;
      case 'top':
        rows = [...rows].sort((a, b) => b.CounterValue - a.CounterValue).slice(0, 3);
        break;
    }
  }

  return { out: grouped ? { kind: 'groups', groups: grouped } : { kind: 'rows', rows, extend, project }, blocked };
}

export default function KqlBuilder() {
  const [applied, setApplied] = useState<StepId[]>(['where-counter']);

  const { out, blocked } = useMemo(() => run(applied), [applied]);
  const available = STEPS.filter((s) => !applied.includes(s.id));
  const lastNote = applied.length > 0 ? STEPS.find((s) => s.id === applied[applied.length - 1])!.note : null;

  const query = ['Perf', '| where TimeGenerated > ago(1h)', ...applied.map((id) => STEPS.find((s) => s.id === id)!.kql)].join('\n');

  return (
    <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Pipeline</div>
          <div className="space-y-1.5">
            <div className="rounded-lg border border-line bg-subtle px-2.5 py-1.5 font-mono text-[12px] text-ink-3">Perf | where TimeGenerated &gt; ago(1h)</div>
            {applied.map((id) => {
              const step = STEPS.find((s) => s.id === id)!;
              return (
                <div key={id} className="flex items-start gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1.5">
                  <span className="flex-1 font-mono text-[12px] text-ink">{step.kql}</span>
                  <button type="button" onClick={() => setApplied((l) => l.filter((x) => x !== id))} className="text-ink-4 hover:text-ink-2" aria-label={`Remove ${step.label}`}>
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Add an operator</div>
          <div className="space-y-1.5">
            {available.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setApplied((l) => [...l, s.id])}
                className="flex w-full items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:border-line-strong"
              >
                <Plus className="size-3.5 text-ink-4" aria-hidden="true" />
                {s.label}
              </button>
            ))}
            {available.length === 0 && <p className="text-xs text-ink-3">Every operator is in the pipeline. Remove some to try a different order.</p>}
          </div>
          <button type="button" onClick={() => setApplied(['where-counter'])} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink-2">
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="min-w-0 space-y-3 p-4">
        <figure>
          <figcaption className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Query</figcaption>
          <pre className="overflow-x-auto rounded-xl bg-design-900 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-white">{query}</pre>
        </figure>

        {lastNote && <p className="rounded-lg bg-subtle px-3 py-2 text-[12.5px] leading-snug text-ink-2">{lastNote}</p>}

        {blocked.length > 0 && (
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-[12.5px] leading-snug text-warning-700">
            After <code className="font-mono">summarize</code> the result has a different shape — only the columns it produced still exist, so the later steps cannot run on the original columns. Move <code className="font-mono">summarize</code> to the end of the pipeline.
          </p>
        )}

        <div className="overflow-x-auto">
          {out.kind === 'groups' ? (
            <table className="w-full text-left text-[13px]">
              <thead className="text-2xs tracking-wide text-ink-4 uppercase">
                <tr>
                  <th className="py-1.5 pr-4 font-semibold">Computer</th>
                  <th className="py-1.5 font-semibold">minMB</th>
                </tr>
              </thead>
              <tbody className="font-mono text-ink-2">
                {out.groups.map((g) => (
                  <tr key={g.Computer} className="border-t border-line">
                    <td className="py-1.5 pr-4">{g.Computer}</td>
                    <td className="py-1.5">{g.minMB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="text-2xs tracking-wide text-ink-4 uppercase">
                <tr>
                  <th className="py-1.5 pr-4 font-semibold">TimeGenerated</th>
                  <th className="py-1.5 pr-4 font-semibold">Computer</th>
                  {!out.project && <th className="py-1.5 pr-4 font-semibold">CounterName</th>}
                  <th className="py-1.5 pr-4 font-semibold">CounterValue</th>
                  {out.extend && !out.project && <th className="py-1.5 font-semibold">LowMemory</th>}
                </tr>
              </thead>
              <tbody className="font-mono text-ink-2">
                {out.rows.map((r, i) => (
                  <tr key={`${r.TimeGenerated}-${r.Computer}-${r.CounterName}-${i}`} className="border-t border-line">
                    <td className="py-1.5 pr-4">{r.TimeGenerated}</td>
                    <td className="py-1.5 pr-4">{r.Computer}</td>
                    {!out.project && <td className="py-1.5 pr-4">{r.CounterName}</td>}
                    <td className="py-1.5 pr-4">{r.CounterValue}</td>
                    {out.extend && !out.project && <td className="py-1.5">{String(r.CounterValue < 500)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p aria-live="polite" className="text-xs text-ink-3">
          {out.kind === 'groups' ? `${out.groups.length} group${out.groups.length === 1 ? '' : 's'}` : `${out.rows.length} row${out.rows.length === 1 ? '' : 's'}`} returned from {DATA.length} in the sample table.
          {out.kind === 'rows' && out.project && ' project dropped the columns it did not list.'}
        </p>
      </div>
    </div>
  );
}
