import { useMemo, useState } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Autoscale is a control loop: a metric is sampled, compared with two thresholds,
 * and an action is taken unless the previous action is still cooling down. The
 * simulator runs that loop over a fixed day of demand so the effect of each
 * setting is visible rather than described.
 */

/** Requests per minute across 24 hourly samples: quiet night, morning ramp, lunch dip, evening peak. */
const DEMAND = [12, 10, 9, 9, 11, 18, 34, 58, 78, 86, 82, 70, 62, 74, 88, 96, 104, 92, 70, 52, 40, 30, 22, 16];

/** Each instance comfortably serves this many requests per minute at 100% CPU. */
const CAPACITY_PER_INSTANCE = 22;

interface Sample {
  hour: number;
  demand: number;
  instancesBefore: number;
  cpu: number;
  action: 'out' | 'in' | 'cooldown' | 'none';
}

function simulate(outAt: number, inAt: number, cooldown: number, min: number, max: number): Sample[] {
  let instances = min;
  let cooling = 0;
  return DEMAND.map((demand, hour) => {
    const cpu = Math.min(100, Math.round((demand / (instances * CAPACITY_PER_INSTANCE)) * 100));
    let action: Sample['action'] = 'none';
    const wants = cpu > outAt ? 'out' : cpu < inAt ? 'in' : 'none';
    const before = instances;

    if (wants !== 'none') {
      if (cooling > 0) {
        action = 'cooldown';
      } else if (wants === 'out' && instances < max) {
        instances += 1;
        action = 'out';
        cooling = cooldown;
      } else if (wants === 'in' && instances > min) {
        instances -= 1;
        action = 'in';
        cooling = cooldown;
      }
    }
    if (cooling > 0) cooling -= 1;
    return { hour, demand, instancesBefore: before, cpu, action };
  });
}

function countFlaps(samples: Sample[]): number {
  let flaps = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1].action;
    const now = samples[i].action;
    if ((prev === 'out' && now === 'in') || (prev === 'in' && now === 'out')) flaps += 1;
  }
  return flaps;
}

const W = 560;
const H = 150;

export default function AutoscaleSimulator() {
  const [outAt, setOutAt] = useState(70);
  const [inAt, setInAt] = useState(40);
  const [cooldown, setCooldown] = useState(1);
  const [min, setMin] = useState(2);
  const [max, setMax] = useState(8);

  const samples = useMemo(() => simulate(outAt, inAt, cooldown, min, Math.max(min, max)), [outAt, inAt, cooldown, min, max]);
  const flaps = countFlaps(samples);
  const saturated = samples.filter((s) => s.cpu >= 95).length;
  const peakInstances = Math.max(...samples.map((s) => s.instancesBefore));
  const gap = outAt - inAt;

  const x = (i: number) => (i / (DEMAND.length - 1)) * (W - 24) + 12;
  const yCpu = (v: number) => H - 12 - (v / 100) * (H - 24);
  const cpuPath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yCpu(s.cpu).toFixed(1)}`).join(' ');

  const verdict = (() => {
    if (flaps >= 2) return { tone: 'bad' as const, title: `${flaps} reversals — the rules are flapping`, text: `Scale-in at ${inAt}% is too close to scale-out at ${outAt}%. Removing an instance pushes the average straight back above the scale-out threshold. Widen the gap and lengthen the cool-down.` };
    if (saturated >= 3) return { tone: 'bad' as const, title: `Saturated for ${saturated} hours`, text: 'The rules cannot add capacity fast enough. Lower the scale-out threshold, raise the maximum, or increase the instance count added per action.' };
    if (gap < 20) return { tone: 'warn' as const, title: 'Thresholds are close together', text: `A ${gap} point gap leaves little headroom. Aim for a clear margin so one scale-in does not immediately trigger a scale-out.` };
    return { tone: 'good' as const, title: 'Stable through the day', text: `Capacity tracks demand and peaks at ${peakInstances} instances, with no oscillation.` };
  })();

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-3">
          <figure>
            <figcaption className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Average CPU across the scale set</figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Average CPU over 24 hours. It peaks at ${Math.max(...samples.map((s) => s.cpu))} percent.`}>
              <rect x="12" y={yCpu(outAt)} width={W - 24} height={Math.max(0, yCpu(0) - yCpu(outAt))} fill="none" />
              <line x1="12" x2={W - 12} y1={yCpu(outAt)} y2={yCpu(outAt)} stroke="var(--color-danger-500)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="12" x2={W - 12} y1={yCpu(inAt)} y2={yCpu(inAt)} stroke="var(--color-brand-400)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={14} y={yCpu(outAt) - 5} textAnchor="start" className="fill-[var(--color-danger-600)] text-[9px]">
                scale out {outAt}%
              </text>
              <text x={14} y={yCpu(inAt) + 11} textAnchor="start" className="fill-[var(--color-brand-600)] text-[9px]">
                scale in {inAt}%
              </text>
              <path d={cpuPath} fill="none" stroke="var(--color-compute)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {samples.map((s, i) =>
                s.action === 'out' || s.action === 'in' ? (
                  <circle key={s.hour} cx={x(i)} cy={yCpu(s.cpu)} r="3.5" fill={s.action === 'out' ? 'var(--color-danger-500)' : 'var(--color-brand-500)'} stroke="var(--color-surface)" strokeWidth="2" />
                ) : null,
              )}
            </svg>
          </figure>

          <figure>
            <figcaption className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Instance count</figcaption>
            <div className="flex items-end gap-[3px]" style={{ height: 64 }}>
              {samples.map((s) => (
                <div key={s.hour} className="flex-1" title={`${s.hour}:00 — ${s.instancesBefore} instances, ${s.cpu}% CPU`}>
                  <div
                    className="rounded-t-[4px] bg-[var(--color-compute)]"
                    style={{ height: `${(s.instancesBefore / Math.max(2, Math.max(min, max))) * 64}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-2xs text-ink-4">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </figure>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Scale out above (% CPU)', value: outAt, set: setOutAt, min: 20, max: 95 },
            { label: 'Scale in below (% CPU)', value: inAt, set: setInAt, min: 5, max: 90 },
            { label: 'Cool-down (hours)', value: cooldown, set: setCooldown, min: 0, max: 4 },
            { label: 'Minimum instances', value: min, set: setMin, min: 1, max: 6 },
            { label: 'Maximum instances', value: max, set: setMax, min: 1, max: 12 },
          ].map((c) => (
            <label key={c.label} className="block text-[13px] text-ink-2">
              <span className="flex justify-between">
                {c.label}
                <span className="font-mono font-semibold text-ink">{c.value}</span>
              </span>
              <input
                type="range"
                min={c.min}
                max={c.max}
                value={c.value}
                onChange={(e) => c.set(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--color-brand-600)]"
              />
            </label>
          ))}
        </div>
      </div>

      <div
        aria-live="polite"
        className={cn('rounded-xl px-4 py-3', verdict.tone === 'good' ? 'bg-success-50 text-success-700' : verdict.tone === 'warn' ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700')}
      >
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          {verdict.tone === 'good' ? <CircleCheck className="size-5" aria-hidden="true" /> : <TriangleAlert className="size-5" aria-hidden="true" />}
          {verdict.title}
        </div>
        <p className="mt-1 text-[13px] text-ink-2">{verdict.text}</p>
      </div>

      <details className="rounded-xl border border-line">
        <summary className="cursor-pointer px-3 py-2 text-[13px] font-medium text-ink-2">View the hourly data as a table</summary>
        <div className="overflow-x-auto px-3 pb-3">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-ink-3">
              <tr>
                <th className="py-1 pr-3 font-medium">Hour</th>
                <th className="py-1 pr-3 font-medium">Requests/min</th>
                <th className="py-1 pr-3 font-medium">Instances</th>
                <th className="py-1 pr-3 font-medium">Avg CPU</th>
                <th className="py-1 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-ink-2">
              {samples.map((s) => (
                <tr key={s.hour} className="border-t border-line">
                  <td className="py-1 pr-3 font-mono">{String(s.hour).padStart(2, '0')}:00</td>
                  <td className="py-1 pr-3">{s.demand}</td>
                  <td className="py-1 pr-3">{s.instancesBefore}</td>
                  <td className="py-1 pr-3">{s.cpu}%</td>
                  <td className="py-1">
                    {s.action === 'out' ? 'Scale out' : s.action === 'in' ? 'Scale in' : s.action === 'cooldown' ? 'Blocked by cool-down' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-xs leading-relaxed text-ink-3">
        The same rule engine drives scale sets, App Service plans and Container Apps. Autoscale samples the metric, compares it with the thresholds and waits out the cool-down before acting again — so the gap between thresholds and the cool-down duration decide whether capacity settles or oscillates.
      </p>
    </div>
  );
}
