import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { SIMULATOR_INDEX, SIMULATORS } from '@/content/simulators';
import { LESSON_INDEX } from '@/content/curriculum';
import { SKILL_INDEX } from '@/content/exam';
import { INTERACTIVES } from '@/components/interactive/registry';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState, Skeleton } from '@/components/ui/Card';
import { AreaChip, IconTile, LevelBadge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { ConceptChip } from '@/components/content/ConnectionsPanel';

export default function SimulatorPage() {
  const { simId = '' } = useParams();
  const meta = SIMULATOR_INDEX[simId];
  const entry = INTERACTIVES[simId];

  if (!meta || !entry) {
    return (
      <PageContainer>
        <EmptyState title="Simulator not found" action={<LinkButton to="/labs">All simulators</LinkButton>} />
      </PageContainer>
    );
  }

  const Widget = entry.component;
  const lesson = meta.lesson ? LESSON_INDEX[meta.lesson.lessonId] : undefined;
  const related = SIMULATORS.filter((s) => s.id !== meta.id && s.area === meta.area).slice(0, 4);

  return (
    <PageContainer wide>
      <Breadcrumbs items={[{ label: 'Labs & simulators', to: '/labs' }, { label: meta.title }]} />
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <IconTile area={meta.area} icon={meta.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <AreaChip area={meta.area} />
            <LevelBadge level={meta.level} />
          </div>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">{meta.title}</h1>
          <p className="mt-1 max-w-3xl text-[15px] leading-relaxed text-ink-3">{meta.summary}</p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Suspense fallback={<div className="p-6"><Skeleton className="h-80 w-full" /></div>}>
            <Widget />
          </Suspense>
        </div>
        <aside className="space-y-4">
          {lesson && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <GraduationCap className="size-4 text-brand-600" aria-hidden="true" /> Learn the concept
              </div>
              <Link to={`/learn/${lesson.moduleId}/${lesson.id}`} className="group mt-2 flex items-start justify-between gap-2 rounded-lg border border-line p-3 hover:border-brand-300">
                <span>
                  <span className="block text-[13.5px] font-medium text-ink">{lesson.title}</span>
                  <span className="block text-2xs text-ink-4">Module {lesson.moduleNumber}</span>
                </span>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-ink-4 group-hover:text-brand-600" aria-hidden="true" />
              </Link>
            </Card>
          )}
          <Card className="p-4">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Concepts</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meta.concepts.map((c) => (
                <ConceptChip key={c} id={c} />
              ))}
            </div>
            {meta.skills.length > 0 && (
              <>
                <div className="mt-4 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Exam skills</div>
                <ul className="mt-1.5 space-y-1">
                  {meta.skills
                    .filter((s) => SKILL_INDEX[s])
                    .map((s) => (
                      <li key={s} className="text-[12.5px] text-ink-2">
                        {SKILL_INDEX[s].text}
                      </li>
                    ))}
                </ul>
              </>
            )}
          </Card>
          {related.length > 0 && (
            <Card className="p-4">
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">More simulators</div>
              <ul className="mt-2 space-y-1">
                {related.map((s) => (
                  <li key={s.id}>
                    <Link to={`/labs/simulators/${s.id}`} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                      <IconTile area={s.area} icon={s.icon} size="sm" className="size-7 rounded-md" /> {s.title}
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
