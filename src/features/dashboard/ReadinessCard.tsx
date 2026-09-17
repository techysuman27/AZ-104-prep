import { Link } from 'react-router';
import { ChevronRight, Info } from 'lucide-react';
import type { Readiness } from '@/engine/readiness';
import { BAND_COPY, DOMAIN_WEIGHTS, READY_TARGET } from '@/engine/readiness';
import { DOMAIN_INDEX, DOMAIN_META } from '@/content/exam';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/Progress';
import { Tooltip } from '@/components/ui/Overlay';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { pct } from '@/lib/format';

const FACTORS = [
  { key: 'accuracy', label: 'Accuracy', weight: '40%', help: 'Recent, difficulty-weighted accuracy on practice questions.' },
  { key: 'scenario', label: 'Scenarios', weight: '25%', help: 'Scenario, troubleshooting and design questions plus simulations.' },
  { key: 'retention', label: 'Retention', weight: '15%', help: 'Estimated recall of flashcards you have reviewed.' },
  { key: 'coverage', label: 'Coverage', weight: '20%', help: 'Skills with evidence. Lessons give partial credit; answering questions gives the rest.' },
] as const;

export function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const band = BAND_COPY[readiness.band];
  const totalWeight = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
  const factor = (key: (typeof FACTORS)[number]['key']) =>
    readiness.domains.reduce((s, d) => s + d[key] * DOMAIN_WEIGHTS[d.domain], 0) / totalWeight;
  const totalAttempts = readiness.domains.reduce((s, d) => s + d.attempts, 0);

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="blueprint flex flex-col items-center justify-center px-6 py-7 text-center text-white">
          <ProgressRing
            value={readiness.score}
            size={148}
            stroke={11}
            color="#86b6ef"
            track="rgb(255 255 255 / 0.12)"
            label={`Exam readiness ${Math.round(readiness.score * 100)} percent`}
          >
            <div>
              <div className="text-[38px] leading-none font-semibold tabular">{Math.round(readiness.score * 100)}</div>
              <div className="mt-1 text-2xs font-medium tracking-wide text-white/60 uppercase">of 100</div>
            </div>
          </ProgressRing>
          <div className="mt-4 text-[15px] font-semibold">{band.label}</div>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{band.description}</p>
          <div className="mt-3 text-2xs text-white/55">Target for “Exam ready”: {pct(READY_TARGET)} + a recent mock exam</div>
        </div>

        <div className="min-w-0 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Readiness by exam domain</h2>
              <p className="mt-0.5 text-xs text-ink-3">
                Built from {totalAttempts} answered question{totalAttempts === 1 ? '' : 's'}, flashcards, simulations and mock exams — not from pages read.
              </p>
            </div>
            <Tooltip content="Each domain combines accuracy (40%), scenario performance (25%), retention (15%) and coverage (20%), scaled by how much evidence exists. Mock exams anchor the final score.">
              <button type="button" className="grid size-7 shrink-0 place-items-center rounded-md text-ink-4 hover:bg-subtle hover:text-ink-2" aria-label="How readiness is calculated">
                <Info className="size-4" />
              </button>
            </Tooltip>
          </div>

          <ul className="mt-4 space-y-3">
            {readiness.domains.map((d) => {
              const meta = DOMAIN_META[d.domain];
              const dom = DOMAIN_INDEX[d.domain];
              return (
                <li key={d.domain}>
                  <Link to={`/practice?domain=${d.domain}`} className="group block rounded-lg">
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md" style={{ background: meta.soft, color: meta.ink }}>
                        <Icon name={meta.icon} className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2 group-hover:text-ink">{dom.shortTitle}</span>
                      <span className="hidden text-2xs text-ink-4 sm:inline">
                        {dom.weight.min}–{dom.weight.max}% of exam
                      </span>
                      <span className="w-10 text-right text-[13px] font-semibold text-ink tabular">{Math.round(d.score * 100)}</span>
                      <ChevronRight className="size-3.5 text-ink-4 group-hover:text-brand-600" aria-hidden="true" />
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-500 transition-[width] duration-700" style={{ width: `${Math.max(2, d.score * 100)}%` }} />
                      <span className="absolute top-0 bottom-0 w-px bg-ink/40" style={{ left: `${READY_TARGET * 100}%` }} aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FACTORS.map((f) => (
              <Tooltip key={f.key} content={f.help}>
                <div className="rounded-lg border border-line px-3 py-2" tabIndex={0}>
                  <div className="text-2xs font-medium text-ink-3">
                    {f.label} <span className="text-ink-4">· {f.weight}</span>
                  </div>
                  <div className="mt-0.5 text-[17px] font-semibold text-ink tabular">
                    {totalAttempts === 0 && f.key !== 'coverage' ? '—' : Math.round(factor(f.key) * 100)}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>

          {readiness.notes.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {readiness.notes.map((n) => (
                <li key={n} className={cn('rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700')}>
                  {n.replace(/^(identity-governance|storage|compute|networking|monitoring)/, (m) => DOMAIN_INDEX[m as keyof typeof DOMAIN_INDEX].shortTitle)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
