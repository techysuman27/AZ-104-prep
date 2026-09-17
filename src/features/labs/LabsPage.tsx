import { Link } from 'react-router';
import { ArrowRight, CircleCheck, Clock, FlaskConical, MousePointerClick, Wrench } from 'lucide-react';
import { LABS } from '@/content/labs';
import { SIMULATORS } from '@/content/simulators';
import { TROUBLE_SCENARIOS } from '@/content/trouble';
import { EXAM_DOMAINS } from '@/content/exam';
import type { AreaId } from '@/content/schema';
import { PageContainer } from '@/components/layout/Page';
import { EmptyState, PageHeader, SectionTitle } from '@/components/ui/Card';
import { AreaChip, IconTile, LevelBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { useLearner } from '@/store/learner';
import { cn } from '@/lib/cn';

export default function LabsPage() {
  const labs = useLearner((s) => s.labs);
  const trouble = useLearner((s) => s.trouble);
  const areas: AreaId[] = ['foundations', ...EXAM_DOMAINS.map((d) => d.id)];

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Labs &amp; simulators</span>}
        title="Build it, break it, fix it"
        description="Guided labs build real Azure environments step by step. Simulators let you experiment safely without a subscription. Troubleshooting scenarios hand you a broken environment and the tools to diagnose it."
      />

      <section aria-labelledby="guided" className="mb-12">
        <SectionTitle
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="size-3.5" aria-hidden="true" /> Guided labs
            </span>
          }
          title={<span id="guided">Ten progressive labs in your own subscription</span>}
          description="Each lab builds on the previous one, verifies every task, explains why it matters and ends with a clean-up step so you are not charged for leftovers."
          className="mb-4"
        />
        {LABS.length === 0 ? (
          <EmptyState title="Labs are being prepared" />
        ) : (
          <ol className="grid gap-3 md:grid-cols-2">
            {LABS.map((l) => {
              const p = labs[l.id];
              const done = !!p?.completedAt;
              const ratio = p ? p.tasksDone.length / l.tasks.length : 0;
              return (
                <li key={l.id}>
                  <Link
                    to={`/labs/guided/${l.id}`}
                    className="group flex h-full gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-xl text-[15px] font-semibold tabular',
                        done ? 'bg-success-600 text-white' : 'bg-ink text-white',
                      )}
                    >
                      {done ? <CircleCheck className="size-5" aria-label="Completed" /> : l.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink group-hover:text-brand-800">{l.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[13px] leading-relaxed text-ink-3">{l.summary}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                        <LevelBadge level={l.level} />
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" /> {l.minutes} min
                        </span>
                        <span>{l.tasks.length} tasks</span>
                      </span>
                      {p && !done && <ProgressBar value={ratio} size="sm" className="mt-2.5" label={`${l.title} progress`} />}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="sims" className="mb-12">
        <SectionTitle
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick className="size-3.5" aria-hidden="true" /> Simulators
            </span>
          }
          title={<span id="sims">Experiment without a subscription</span>}
          description="Interactive models of how Azure evaluates access, routes packets, replicates data and scales — with instant feedback."
          className="mb-4"
        />
        <div className="space-y-6">
          {areas.map((a) => {
            const items = SIMULATORS.filter((s) => s.area === a);
            if (!items.length) return null;
            return (
              <div key={a}>
                <div className="mb-2">
                  <AreaChip area={a} />
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/labs/simulators/${s.id}`}
                        className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
                      >
                        <IconTile area={s.area} icon={s.icon} />
                        <span className="min-w-0">
                          <span className="block text-[14.5px] font-semibold text-ink group-hover:text-brand-800">{s.title}</span>
                          <span className="mt-0.5 line-clamp-3 block text-[13px] leading-relaxed text-ink-3">{s.summary}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section id="troubleshooting" aria-labelledby="trouble-h" className="scroll-mt-6">
        <SectionTitle
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Wrench className="size-3.5" aria-hidden="true" /> Troubleshooting simulations
            </span>
          }
          title={<span id="trouble-h">Something is broken. Find out why.</span>}
          description="Read the ticket, inspect the environment with real diagnostic tools, name the root cause and choose the fix. You are scored on accuracy and efficiency."
          className="mb-4"
        />
        {TROUBLE_SCENARIOS.length === 0 ? (
          <EmptyState title="Scenarios are being prepared" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {TROUBLE_SCENARIOS.map((t) => {
              const r = trouble[t.id];
              return (
                <li key={t.id}>
                  <Link to={`/labs/troubleshoot/${t.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
                    <span className="flex items-center justify-between gap-2">
                      <AreaChip area={t.area} />
                      {r ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-2xs font-semibold text-success-700">
                          <CircleCheck className="size-3" aria-hidden="true" /> Solved · {Math.round(r.score * 100)}
                        </span>
                      ) : (
                        <span className="text-2xs font-medium text-ink-4">{['', 'Foundation', 'Intermediate', 'Hard'][t.difficulty]}</span>
                      )}
                    </span>
                    <span className="mt-3 block text-[15px] font-semibold text-ink group-hover:text-brand-800">{t.title}</span>
                    <span className="mt-1 line-clamp-2 block flex-1 text-[13px] leading-relaxed text-ink-3">{t.summary}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                      Investigate <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
