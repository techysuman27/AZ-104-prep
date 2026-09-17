import { Link, useParams } from 'react-router';
import { ArrowRight, CircleCheck, CircleDashed, CircleDot, Clock, FlaskConical } from 'lucide-react';
import { MODULE_INDEX, LESSONS } from '@/content/curriculum';
import { SKILL_INDEX } from '@/content/exam';
import { SIMULATORS } from '@/content/simulators';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState, PageHeader } from '@/components/ui/Card';
import { AreaChip, IconTile, LevelBadge, TierBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { LinkButton } from '@/components/ui/Button';
import { InlineText } from '@/components/content/InlineText';
import { useLearner } from '@/store/learner';
import { lessonStatus, moduleProgress } from './progress';

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const module = MODULE_INDEX[moduleId];
  const progress = useLearner((s) => s.lessons);

  if (!module) {
    return (
      <PageContainer>
        <EmptyState title="Module not found" description="This module does not exist." action={<LinkButton to="/learn">Back to learning path</LinkButton>} />
      </PageContainer>
    );
  }

  const lessons = LESSONS.filter((l) => l.moduleId === module.id);
  const p = moduleProgress(progress, module.id);
  const next = lessons.find((l) => !progress[l.id]?.completedAt) ?? lessons[0];
  const minutes = lessons.reduce((s, l) => s + l.minutes, 0);
  const skills = [...new Set(lessons.flatMap((l) => l.skills))].filter((s) => SKILL_INDEX[s]);
  const sims = SIMULATORS.filter((s) => s.lesson?.moduleId === module.id);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: 'Learning path', to: '/learn' }, { label: `Module ${module.number}: ${module.title}` }]} />
      <PageHeader
        eyebrow={
          <>
            <AreaChip area={module.area} />
            <span className="text-xs text-ink-4">·</span>
            <span className="text-xs font-medium text-ink-3">Module {module.number}</span>
          </>
        }
        title={module.title}
        description={module.summary}
        actions={
          next && (
            <LinkButton to={`/learn/${module.id}/${next.id}`} iconRight={<ArrowRight className="size-4" />}>
              {p.completed === 0 ? 'Start module' : p.completed === p.total ? 'Review module' : 'Continue'}
            </LinkButton>
          )
        }
      >
        <div className="mt-5 flex max-w-md items-center gap-4">
          <ProgressBar value={p.ratio} tone={p.completed === p.total && p.total > 0 ? 'success' : 'brand'} label="Module progress" />
          <span className="shrink-0 text-xs text-ink-3 tabular">
            {p.completed}/{p.total} lessons · ~{minutes} min
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <div className="blueprint overflow-hidden rounded-2xl p-6 text-white">
            <div className="text-2xs font-semibold tracking-[0.08em] text-white/60 uppercase">The mental model</div>
            <p className="mt-2 text-[16px] leading-relaxed text-white/90">
              <InlineText text={module.mentalModel} />
            </p>
          </div>

          {module.chapters.map((chapter, ci) => (
            <section key={chapter.id} aria-labelledby={`ch-${chapter.id}`}>
              <h2 id={`ch-${chapter.id}`} className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold text-ink">
                <span className="text-xs font-semibold text-ink-4 tabular">
                  {module.number}.{ci + 1}
                </span>
                {chapter.title}
              </h2>
              <ol className="overflow-hidden rounded-2xl border border-line bg-surface">
                {chapter.lessons.map((l) => {
                  const status = lessonStatus(progress, l.id);
                  return (
                    <li key={l.id} className="border-b border-line last:border-b-0">
                      <Link to={`/learn/${module.id}/${l.id}`} className="group flex gap-4 px-4 py-4 transition-colors hover:bg-subtle/60 sm:px-5">
                        <span className="mt-0.5 shrink-0" aria-label={status.replace('-', ' ')}>
                          {status === 'completed' ? (
                            <CircleCheck className="size-5 text-success-600" />
                          ) : status === 'in-progress' ? (
                            <CircleDot className="size-5 text-brand-600" />
                          ) : (
                            <CircleDashed className="size-5 text-ink-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-ink group-hover:text-brand-800">{l.title}</span>
                          <span className="mt-0.5 block text-[13.5px] leading-relaxed text-ink-3">{l.summary}</span>
                          <span className="mt-2 flex flex-wrap items-center gap-2">
                            <TierBadge tier={l.tier} />
                            <LevelBadge level={l.level} />
                            <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                              <Clock className="size-3" aria-hidden="true" /> {l.minutes} min
                            </span>
                          </span>
                        </span>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold text-ink">You will be able to</h2>
            <ul className="mt-3 space-y-2">
              {module.outcomes.map((o) => (
                <li key={o} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden="true" />
                  {o}
                </li>
              ))}
            </ul>
          </Card>

          {skills.length > 0 && (
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold text-ink">Official skills covered</h2>
              <p className="mt-0.5 text-xs text-ink-3">From the AZ-104 skills outline</p>
              <ul className="mt-3 space-y-1.5">
                {skills.map((s) => (
                  <li key={s}>
                    <Link to={`/skills#${s}`} className="block rounded-lg bg-subtle/70 px-2.5 py-1.5 text-[13px] leading-snug text-ink-2 hover:bg-muted hover:text-ink">
                      {SKILL_INDEX[s].text}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {sims.length > 0 && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <FlaskConical className="size-4 text-brand-600" aria-hidden="true" /> Simulators in this module
              </h2>
              <ul className="mt-3 space-y-2">
                {sims.map((s) => (
                  <li key={s.id}>
                    <Link to={`/labs/simulators/${s.id}`} className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-subtle">
                      <IconTile area={s.area} icon={s.icon} size="sm" />
                      <span className="text-[13.5px] font-medium text-ink-2 group-hover:text-ink">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
