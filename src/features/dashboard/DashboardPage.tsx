import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, Brain, CalendarDays, Flame, FlaskConical, Lightbulb, Target, Timer, Wrench } from 'lucide-react';
import { MODULES, LESSONS } from '@/content/curriculum';
import { FLASHCARDS } from '@/content/flashcards';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LABS } from '@/content/labs';
import { TROUBLE_SCENARIOS } from '@/content/trouble';
import { SIMULATORS } from '@/content/simulators';
import { weakConcepts } from '@/engine/mastery';
import { isDue } from '@/engine/srs';
import { READY_TARGET } from '@/engine/readiness';
import { PageContainer } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { AreaChip, IconTile } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Tooltip } from '@/components/ui/Overlay';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';
import { formatDate, pct, relativeTime } from '@/lib/format';
import { continueLesson, moduleProgress } from '@/features/learn/progress';
import { ReadinessCard } from './ReadinessCard';
import { SkillsHeatmap } from './SkillsHeatmap';
import { useMastery, useReadiness } from './useReadiness';

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ActivityCalendar({ days, attemptsByDay }: { days: string[]; attemptsByDay: Map<string, number> }) {
  const weeks = 16;
  const today = new Date();
  const cells: { key: string; count: number; active: boolean; date: Date; future: boolean }[] = [];
  const first = new Date(today);
  first.setDate(today.getDate() - (weeks - 1) * 7 - ((today.getDay() + 6) % 7));
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    const key = dayKey(d);
    cells.push({ key, count: attemptsByDay.get(key) ?? 0, active: days.includes(key), date: d, future: d > today });
  }
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.includes(dayKey(d))) streak++;
    else if (i > 0) break;
    else continue;
  }
  const level = (c: (typeof cells)[number]) => (c.future ? -1 : !c.active ? 0 : c.count >= 20 ? 3 : c.count >= 6 ? 2 : 1);
  const tone = ['bg-muted', 'bg-brand-200', 'bg-brand-400', 'bg-brand-700'];

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Study activity</h2>
          <p className="mt-0.5 text-xs text-ink-3">Last {weeks} weeks · questions answered per day</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-warning-50 px-2.5 py-1 text-[13px] font-semibold text-warning-700">
          <Flame className="size-4" aria-hidden="true" /> {streak}-day streak
        </div>
      </div>
      <div className="scrollbar-thin mt-4 overflow-x-auto">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`Study activity over the last ${weeks} weeks. Current streak ${streak} days.`}>
          {cells.map((c) => (
            <Tooltip key={c.key} content={`${formatDate(c.key)} · ${c.future ? 'upcoming' : c.active ? `${c.count} questions` : 'no activity'}`}>
              <span className={cn('block size-3.5 rounded-[3px]', level(c) < 0 ? 'bg-transparent' : tone[level(c)])} />
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-2xs text-ink-4" aria-hidden="true">
        Less {tone.map((t) => <span key={t} className={cn('size-2.5 rounded-[2px]', t)} />)} More
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const readiness = useReadiness();
  const mastery = useMastery();
  const lessons = useLearner((s) => s.lessons);
  const attempts = useLearner((s) => s.attempts);
  const srs = useLearner((s) => s.srs);
  const mocks = useLearner((s) => s.mocks);
  const labs = useLearner((s) => s.labs);
  const trouble = useLearner((s) => s.trouble);
  const activityDays = useLearner((s) => s.activityDays);
  const examDate = useLearner((s) => s.settings.examDate);
  const openConcept = useUi((s) => s.openConcept);

  const next = continueLesson(lessons);
  const now = Date.now();
  const due = FLASHCARDS.filter((c) => srs[c.id] && isDue(srs[c.id], now)).length;
  const newCards = FLASHCARDS.filter((c) => !srs[c.id]).length;
  const weak = weakConcepts(mastery.concepts, 5).filter((w) => CONCEPT_INDEX[w.id]);
  const completedLessons = LESSONS.filter((l) => lessons[l.id]?.completedAt).length;
  const studiedSkills = useMemo(() => new Set(LESSONS.filter((l) => lessons[l.id]?.completedAt).flatMap((l) => l.skills)), [lessons]);
  const recent7 = attempts.filter((a) => now - a.at < 7 * 86_400_000);
  const acc7 = recent7.length ? recent7.filter((a) => a.correct).length / recent7.length : null;
  const attemptsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of attempts) {
      const k = dayKey(new Date(a.at));
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [attempts]);
  const daysToExam = examDate ? Math.ceil((new Date(`${examDate}T09:00:00`).getTime() - now) / 86_400_000) : null;
  const hasRecentMock = mocks.some((m) => now - m.finishedAt < 30 * 86_400_000);

  const actions: { icon: React.ReactNode; title: string; detail: string; to: string; cta: string; tone?: 'brand' | 'warning' }[] = [];
  if (next) {
    actions.push({
      icon: <BookOpen className="size-4" />,
      title: lessons[next.id] ? `Continue: ${next.title}` : `Start: ${next.title}`,
      detail: `Module ${next.moduleNumber} · ${next.moduleTitle} · ${next.minutes} min`,
      to: `/learn/${next.moduleId}/${next.id}`,
      cta: lessons[next.id] ? 'Continue' : 'Start',
      tone: 'brand',
    });
  }
  if (due > 0 || (Object.keys(srs).length === 0 && completedLessons > 0)) {
    actions.push({
      icon: <Brain className="size-4" />,
      title: due > 0 ? `Review ${due} due flashcard${due === 1 ? '' : 's'}` : 'Start spaced repetition',
      detail: due > 0 ? 'Reviewing on time is what moves knowledge into long-term memory.' : `${newCards} flashcards ready for your first session.`,
      to: '/review',
      cta: 'Review',
    });
  }
  if (weak[0]) {
    actions.push({
      icon: <Target className="size-4" />,
      title: `Strengthen ${CONCEPT_INDEX[weak[0].id].name}`,
      detail: `${weak[0].stat.correct}/${weak[0].stat.attempts} correct so far. Re-read the concept, then practise it.`,
      to: `/practice?concept=${weak[0].id}`,
      cta: 'Practise',
      tone: 'warning',
    });
  }
  if (!hasRecentMock && readiness.practiceScore > 0.45) {
    actions.push({
      icon: <Timer className="size-4" />,
      title: 'Validate with a mock exam',
      detail: 'Readiness is capped until you complete a timed mock exam in the last 30 days.',
      to: '/exam',
      cta: 'Start mock',
    });
  }
  if (attempts.length === 0) {
    actions.push({
      icon: <Target className="size-4" />,
      title: 'Answer your first practice questions',
      detail: 'Readiness starts from evidence. Ten questions give the engine something to work with.',
      to: '/practice',
      cta: 'Practise',
    });
  }
  const unsolved = TROUBLE_SCENARIOS.find((t) => !trouble[t.id]);
  if (unsolved && actions.length < 5) {
    actions.push({
      icon: <Wrench className="size-4" />,
      title: `Troubleshoot: ${unsolved.title}`,
      detail: unsolved.summary,
      to: `/labs/troubleshoot/${unsolved.id}`,
      cta: 'Investigate',
    });
  }

  const labsDone = LABS.filter((l) => labs[l.id]?.completedAt).length;
  const troubleDone = TROUBLE_SCENARIOS.filter((t) => trouble[t.id]).length;

  return (
    <PageContainer wide>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Dashboard</div>
          <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">Your path to AZ-104</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-3">
            {completedLessons} of {LESSONS.length} lessons · {attempts.length} questions answered
            {acc7 !== null && ` · ${pct(acc7)} accuracy this week`}
            {daysToExam !== null && daysToExam >= 0 && ` · exam in ${daysToExam} day${daysToExam === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/practice" variant="secondary" icon={<Target className="size-4" />}>
            Practice
          </LinkButton>
          {next && (
            <LinkButton to={`/learn/${next.moduleId}/${next.id}`} iconRight={<ArrowRight className="size-4" />}>
              {completedLessons === 0 && !lessons[next.id] ? 'Start learning' : 'Continue learning'}
            </LinkButton>
          )}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ReadinessCard readiness={readiness} />
        </div>

        <Card className="p-5 xl:col-span-4">
          <h2 className="text-[15px] font-semibold text-ink">Do this next</h2>
          <p className="mt-0.5 text-xs text-ink-3">Chosen from your progress, weak spots and review schedule.</p>
          <ul className="mt-4 space-y-2.5">
            {actions.slice(0, 4).map((a) => (
              <li key={a.title}>
                <Link
                  to={a.to}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border p-3 transition-all hover:-translate-y-px hover:shadow-raised',
                    a.tone === 'brand' ? 'border-brand-150 bg-brand-25 hover:border-brand-300' : a.tone === 'warning' ? 'border-warning-100 bg-warning-50/60 hover:border-warning-500/40' : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      a.tone === 'brand' ? 'bg-brand-600 text-white' : a.tone === 'warning' ? 'bg-warning-100 text-warning-700' : 'bg-subtle text-ink-2',
                    )}
                  >
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] leading-snug font-semibold text-ink">{a.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-ink-3">{a.detail}</span>
                  </span>
                  <span className="mt-1 shrink-0 text-xs font-semibold text-brand-700 group-hover:underline">{a.cta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 xl:col-span-12">
          <SkillsHeatmap skillStats={mastery.skills} studiedSkills={studiedSkills} />
        </Card>

        <Card className="p-5 xl:col-span-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Concepts to revisit</h2>
              <p className="mt-0.5 text-xs text-ink-3">Concepts you have practised and keep missing.</p>
            </div>
            <Link to="/practice?mode=missed" className="text-xs font-semibold text-brand-700 hover:underline">
              Retry missed
            </Link>
          </div>
          {weak.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-3">
              {attempts.length < 10 ? 'Answer a few more questions and weak spots will appear here.' : 'No weak concepts right now. Keep mixing domains to stay sharp.'}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {weak.map((w) => {
                const c = CONCEPT_INDEX[w.id];
                return (
                  <li key={w.id} className="flex items-center gap-3 py-2.5">
                    <AreaChip area={c.area} compact />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-ink">{c.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <ProgressBar value={w.stat.mastery} tone="warning" size="sm" className="w-24" label={`${c.name} mastery`} />
                        <span className="text-2xs text-ink-3 tabular">
                          {w.stat.correct}/{w.stat.attempts} correct
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => openConcept(c.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-ink-2 hover:bg-subtle">
                      <Lightbulb className="size-3.5" aria-hidden="true" /> Explain again
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5 xl:col-span-4">
          <ActivityCalendar days={activityDays} attemptsByDay={attemptsByDay} />
        </Card>

        <Card className="p-5 xl:col-span-3">
          <h2 className="text-[15px] font-semibold text-ink">Mock exams</h2>
          {mocks.length === 0 ? (
            <>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">Timed, weighted like the real outline, with a domain breakdown and revision plan.</p>
              <LinkButton to="/exam" size="sm" variant="secondary" className="mt-4" icon={<Timer className="size-4" />}>
                Take your first mock
              </LinkButton>
            </>
          ) : (
            <>
              <div className="mt-3 flex h-24 items-end gap-1.5" role="img" aria-label="Recent mock exam scores">
                {mocks.slice(-8).map((m) => (
                  <Tooltip key={m.id} content={`${formatDate(new Date(m.finishedAt).toISOString())} · ${pct(m.percent)}`}>
                    <Link to={`/exam/results/${m.id}`} className="relative flex h-full flex-1 items-end">
                      <span className={cn('w-full rounded-t-[4px]', m.percent >= READY_TARGET ? 'bg-brand-600' : 'bg-brand-300')} style={{ height: `${Math.max(6, m.percent * 100)}%` }} />
                    </Link>
                  </Tooltip>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-ink-3">
                <span>
                  Latest <strong className="text-ink tabular">{pct(mocks[mocks.length - 1].percent)}</strong>
                </span>
                <span>{relativeTime(mocks[mocks.length - 1].finishedAt)}</span>
              </div>
              <LinkButton to="/exam" size="sm" variant="secondary" className="mt-3 w-full" icon={<Timer className="size-4" />}>
                New mock exam
              </LinkButton>
            </>
          )}
        </Card>

        <Card className="p-5 xl:col-span-8">
          <div className="flex items-end justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Course progress</h2>
            <Link to="/learn" className="text-xs font-semibold text-brand-700 hover:underline">
              Learning path
            </Link>
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {MODULES.map((m) => {
              const p = moduleProgress(lessons, m.id);
              return (
                <li key={m.id}>
                  <Link to={`/learn/${m.id}`} className="group flex items-center gap-3">
                    <IconTile area={m.area} icon={m.icon} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium text-ink-2 group-hover:text-ink">
                          {m.number}. {m.title}
                        </span>
                        <span className="shrink-0 text-ink-3 tabular">
                          {p.completed}/{p.total}
                        </span>
                      </div>
                      <ProgressBar value={p.ratio} size="sm" tone={p.ratio === 1 ? 'success' : 'brand'} className="mt-1.5" label={`${m.title} progress`} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 xl:col-span-4">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <FlaskConical className="size-4 text-brand-600" aria-hidden="true" /> Hands-on practice
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-[13px]">
                <dt className="text-ink-2">Guided labs</dt>
                <dd className="font-semibold text-ink tabular">
                  {labsDone}/{LABS.length}
                </dd>
              </div>
              <ProgressBar value={LABS.length ? labsDone / LABS.length : 0} size="sm" className="mt-1.5" label="Guided labs completed" />
            </div>
            <div>
              <div className="flex justify-between text-[13px]">
                <dt className="text-ink-2">Troubleshooting scenarios</dt>
                <dd className="font-semibold text-ink tabular">
                  {troubleDone}/{TROUBLE_SCENARIOS.length}
                </dd>
              </div>
              <ProgressBar value={TROUBLE_SCENARIOS.length ? troubleDone / TROUBLE_SCENARIOS.length : 0} size="sm" className="mt-1.5" label="Troubleshooting scenarios solved" />
            </div>
            <div className="flex justify-between text-[13px]">
              <dt className="text-ink-2">Simulators available</dt>
              <dd className="font-semibold text-ink tabular">{SIMULATORS.length}</dd>
            </div>
          </dl>
          <LinkButton to="/labs" size="sm" variant="secondary" className="mt-4 w-full" icon={<CalendarDays className="size-4" />}>
            Open labs
          </LinkButton>
        </Card>
      </div>
    </PageContainer>
  );
}
