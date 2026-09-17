import { Link, useParams } from 'react-router';
import { BadgeCheck, CircleCheck, Clock, Coins, Lightbulb, ListChecks, Target, Trash, TriangleAlert } from 'lucide-react';
import { LAB_INDEX } from '@/content/labs';
import { SKILL_INDEX } from '@/content/exam';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { LevelBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { CodeBlock } from '@/components/content/CodeBlock';
import { InlineText } from '@/components/content/InlineText';
import { ConceptChip } from '@/components/content/ConnectionsPanel';
import { useLearner } from '@/store/learner';
import { cn } from '@/lib/cn';

export default function LabPage() {
  const { labId = '' } = useParams();
  const lab = LAB_INDEX[labId];
  const progress = useLearner((s) => s.labs[labId]);
  const toggleLabTask = useLearner((s) => s.toggleLabTask);
  const completeLab = useLearner((s) => s.completeLab);

  if (!lab) {
    return (
      <PageContainer>
        <EmptyState title="Lab not found" action={<LinkButton to="/labs">All labs</LinkButton>} />
      </PageContainer>
    );
  }

  const done = new Set(progress?.tasksDone ?? []);
  const ratio = done.size / lab.tasks.length;

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: 'Labs & simulators', to: '/labs' }, { label: `Lab ${lab.number}: ${lab.title}` }]} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 space-y-8">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">Lab {lab.number}</span>
              <LevelBadge level={lab.level} />
              <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                <Clock className="size-3.5" aria-hidden="true" /> {lab.minutes} min
              </span>
            </div>
            <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[34px]">{lab.title}</h1>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-3">{lab.summary}</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Target className="size-4 text-brand-600" aria-hidden="true" /> Objectives
              </div>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug text-ink-2">
                {lab.objectives.map((o) => (
                  <li key={o} className="flex gap-2">
                    <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success-600" aria-hidden="true" /> <InlineText text={o} />
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <ListChecks className="size-4 text-brand-600" aria-hidden="true" /> Before you start
              </div>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug text-ink-2">
                {lab.prerequisites.map((p) => (
                  <li key={p}>
                    <InlineText text={p} />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2 rounded-lg bg-warning-50 px-3 py-2 text-[13px] text-warning-700">
                <Coins className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Cost:</strong> {lab.estimatedCost}
                </span>
              </div>
            </Card>
          </div>

          <ol className="space-y-5">
            {lab.tasks.map((t, i) => {
              const isDone = done.has(t.id);
              return (
                <li key={t.id} id={t.id} className="scroll-mt-20">
                  <Card className={cn('overflow-hidden transition-colors', isDone && 'border-success-100')}>
                    <div className={cn('flex items-start gap-3 border-b px-5 py-4', isDone ? 'border-success-100 bg-success-50/60' : 'border-line')}>
                      <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular', isDone ? 'bg-success-600 text-white' : 'bg-subtle text-ink-2')}>
                        {isDone ? <CircleCheck className="size-4" aria-hidden="true" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[16px] font-semibold text-ink">{t.title}</h2>
                        <p className="mt-0.5 text-[13.5px] text-ink-3">
                          <InlineText text={t.goal} />
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 px-5 py-4">
                      <ol className="space-y-4">
                        {t.steps.map((s, j) => (
                          <li key={j} className="space-y-2">
                            <p className="text-[14.5px] leading-relaxed text-ink-2">
                              <span className="mr-1 font-semibold text-ink-3 tabular">{j + 1}.</span>
                              <InlineText text={s.text} />
                            </p>
                            {s.code && <CodeBlock tabs={s.code} />}
                          </li>
                        ))}
                      </ol>
                      <div className="rounded-xl border border-brand-150 bg-brand-25 p-4">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-800">
                          <BadgeCheck className="size-4" aria-hidden="true" /> Verify
                        </div>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                          <InlineText text={t.verify.text} />
                        </p>
                        {t.verify.code && <CodeBlock tabs={t.verify.code} className="mt-3" />}
                        {t.verify.expect && (
                          <p className="mt-2 text-[13px] text-ink-2">
                            <span className="font-semibold text-ink">Expected: </span>
                            <InlineText text={t.verify.expect} />
                          </p>
                        )}
                      </div>
                      {t.why && (
                        <p className="flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
                          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning-600" aria-hidden="true" />
                          <span>
                            <strong className="text-ink">Why this matters: </strong>
                            <InlineText text={t.why} />
                          </span>
                        </p>
                      )}
                      {t.hint && (
                        <details className="rounded-lg border border-line px-3 py-2 text-[13.5px]">
                          <summary className="cursor-pointer font-medium text-ink-2">Stuck? Show a hint</summary>
                          <p className="mt-2 text-ink-2">
                            <InlineText text={t.hint} />
                          </p>
                        </details>
                      )}
                      <Button variant={isDone ? 'secondary' : 'primary'} size="sm" icon={<CircleCheck className="size-4" />} onClick={() => toggleLabTask(lab.id, t.id)}>
                        {isDone ? 'Mark as not done' : 'Task verified'}
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <Card className="overflow-hidden border-danger-100">
            <div className="flex items-center gap-2 border-b border-danger-100 bg-danger-50/60 px-5 py-3 text-[15px] font-semibold text-danger-700">
              <Trash className="size-4" aria-hidden="true" /> Clean up
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="flex gap-2 text-[14px] leading-relaxed text-ink-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" aria-hidden="true" />
                <span>
                  <InlineText text={lab.cleanup.text} />
                </span>
              </p>
              {lab.cleanup.code && <CodeBlock tabs={lab.cleanup.code} />}
            </div>
          </Card>

          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[15px] font-semibold text-ink">{progress?.completedAt ? 'Lab complete' : 'Finished every task and cleaned up?'}</div>
              <p className="text-[13.5px] text-ink-3">
                {done.size} of {lab.tasks.length} tasks verified.
              </p>
            </div>
            {progress?.completedAt ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-700">
                <CircleCheck className="size-4" aria-hidden="true" /> Completed
              </span>
            ) : (
              <Button onClick={() => completeLab(lab.id)} disabled={done.size < lab.tasks.length}>
                Complete lab
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <div className="text-[14px] font-semibold text-ink">Sources</div>
            <ul className="mt-2 space-y-1">
              {lab.sources
                .map((s) => SOURCES[s])
                .filter(Boolean)
                .map((s) => (
                  <li key={s.id} className="text-[13.5px]">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </article>

        <aside className="space-y-4">
          <Card className="sticky top-6 p-4">
            <div className="text-[13px] font-semibold text-ink">Progress</div>
            <ProgressBar value={ratio} className="mt-2" tone={ratio === 1 ? 'success' : 'brand'} label="Lab progress" />
            <ol className="mt-3 space-y-1">
              {lab.tasks.map((t, i) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                    {done.has(t.id) ? (
                      <CircleCheck className="size-4 shrink-0 text-success-600" aria-label="Done" />
                    ) : (
                      <span className="grid size-4 shrink-0 place-items-center rounded-full border border-line-strong text-[9px] font-semibold text-ink-3">{i + 1}</span>
                    )}
                    <span className="truncate">{t.title}</span>
                  </a>
                </li>
              ))}
            </ol>
            {lab.skills.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Exam skills</div>
                <ul className="mt-1.5 space-y-1">
                  {lab.skills
                    .filter((s) => SKILL_INDEX[s])
                    .map((s) => (
                      <li key={s}>
                        <Link to={`/skills#${s}`} className="text-[12.5px] text-ink-2 hover:text-ink hover:underline">
                          {SKILL_INDEX[s].text}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {lab.concepts.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Concepts</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lab.concepts.map((c) => (
                    <ConceptChip key={c} id={c} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
