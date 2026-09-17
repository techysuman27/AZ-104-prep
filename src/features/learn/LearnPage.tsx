import { Link } from 'react-router';
import { ArrowRight, CircleCheck, Clock } from 'lucide-react';
import { MODULES, LESSONS } from '@/content/curriculum';
import { DOMAIN_INDEX } from '@/content/exam';
import { PageContainer } from '@/components/layout/Page';
import { PageHeader } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { LinkButton } from '@/components/ui/Button';
import { useLearner } from '@/store/learner';
import { cn } from '@/lib/cn';
import { continueLesson, moduleProgress } from './progress';

const STAGES = [
  { name: 'Foundation', text: 'The mental model: hierarchy, regions, Resource Manager.' },
  { name: 'Understanding', text: 'What each service is, why it exists, and when not to use it.' },
  { name: 'Hands-on', text: 'Portal, CLI, PowerShell and Bicep — then guided labs.' },
  { name: 'Connections', text: 'How identity, networking, security and monitoring interlock.' },
  { name: 'Troubleshooting', text: 'Diagnose broken environments with real tools.' },
  { name: 'Scenarios', text: 'Design solutions from business requirements.' },
  { name: 'Exam mastery', text: 'Hard, mixed questions under time pressure.' },
];

export default function LearnPage() {
  const progress = useLearner((s) => s.lessons);
  const next = continueLesson(progress);
  const totalMinutes = LESSONS.reduce((s, l) => s + l.minutes, 0);
  const completed = LESSONS.filter((l) => progress[l.id]?.completedAt).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Learning path</span>}
        title="From foundations to exam mastery"
        description="Twelve modules ordered for understanding, not memorisation. Each lesson explains what a service is, why it exists, how it connects to the rest of Azure, and how AZ-104 tests it."
        actions={
          next && (
            <LinkButton to={`/learn/${next.moduleId}/${next.id}`} iconRight={<ArrowRight className="size-4" />}>
              {completed === 0 ? 'Start learning' : 'Continue'}
            </LinkButton>
          )
        }
      >
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-3">
          <span>
            <strong className="font-semibold text-ink tabular">{MODULES.length}</strong> modules
          </span>
          <span>
            <strong className="font-semibold text-ink tabular">{LESSONS.length}</strong> lessons
          </span>
          <span>
            <strong className="font-semibold text-ink tabular">~{Math.round(totalMinutes / 60)}</strong> hours of guided study
          </span>
          <span>
            <strong className="font-semibold text-ink tabular">{completed}</strong> completed
          </span>
        </div>
      </PageHeader>

      <section aria-labelledby="stages" className="mb-10 overflow-hidden rounded-2xl border border-line bg-surface">
        <h2 id="stages" className="sr-only">
          How the course progresses
        </h2>
        <ol className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 2xl:grid-cols-7">
          {STAGES.map((s, i) => (
            <li key={s.name} className="relative bg-surface px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-ink text-2xs font-semibold text-white tabular">{i + 1}</span>
                <span className="text-[13px] font-semibold text-ink">{s.name}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{s.text}</p>
            </li>
          ))}
          <li className="bg-brand-25 px-4 py-4 2xl:hidden">
            <div className="text-[13px] font-semibold text-brand-800">Measured by evidence</div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-3">Readiness grows from questions, reviews and mock exams — not pages read.</p>
          </li>
        </ol>
      </section>

      <ol className="relative space-y-4">
        <span className="absolute top-6 bottom-6 left-[27px] hidden w-px bg-line-strong sm:block" aria-hidden="true" />
        {MODULES.map((m) => {
          const p = moduleProgress(progress, m.id);
          const minutes = m.chapters.flatMap((c) => c.lessons).reduce((s, l) => s + l.minutes, 0);
          const done = p.total > 0 && p.completed === p.total;
          return (
            <li key={m.id} className="relative sm:pl-[72px]">
              <span
                className={cn(
                  'absolute top-5 left-3 z-10 hidden size-[30px] place-items-center rounded-full border-2 text-xs font-semibold tabular sm:grid',
                  done ? 'border-success-600 bg-success-600 text-white' : p.started ? 'border-brand-500 bg-surface text-brand-700' : 'border-line-strong bg-canvas text-ink-3',
                )}
                aria-hidden="true"
              >
                {done ? <CircleCheck className="size-4" /> : m.number}
              </span>
              <Link
                to={`/learn/${m.id}`}
                className="group block rounded-2xl border border-line bg-surface p-5 shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <IconTile area={m.area} icon={m.icon} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink-3">Module {m.number}</div>
                      <h2 className="text-[17px] font-semibold text-ink group-hover:text-brand-800">{m.title}</h2>
                      <p className="mt-0.5 text-[14px] text-ink-2">{m.tagline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                        <span>{p.total} lessons</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />~{minutes} min
                        </span>
                        {m.domains.map((d) => (
                          <span key={d} className="rounded-md bg-subtle px-1.5 py-0.5 font-medium text-ink-2">
                            {DOMAIN_INDEX[d].shortTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-full shrink-0 md:w-48">
                    <div className="mb-1.5 flex justify-between text-xs text-ink-3">
                      <span>{done ? 'Complete' : p.started ? 'In progress' : 'Not started'}</span>
                      <span className="tabular">
                        {p.completed}/{p.total}
                      </span>
                    </div>
                    <ProgressBar value={p.ratio} tone={done ? 'success' : 'brand'} size="sm" label={`${m.title} progress`} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </PageContainer>
  );
}
