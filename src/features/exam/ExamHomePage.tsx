import { Link, useNavigate } from 'react-router';
import { ArrowRight, CircleAlert, Clock, Flag, ListChecks, Play, Timer } from 'lucide-react';
import { QUESTIONS } from '@/content/questions';
import { EXAM_DOMAINS, EXAM_META } from '@/content/exam';
import { BLUEPRINTS, allocateByWeight, assembleMockExam, type Blueprint } from '@/engine/mockExam';
import { READY_TARGET } from '@/engine/readiness';
import { PageContainer } from '@/components/layout/Page';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { useExamSession } from '@/store/examSession';
import { useLearner } from '@/store/learner';
import { formatDate, formatDuration, pct } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { DomainId } from '@/content/schema';

export default function ExamHomePage() {
  const navigate = useNavigate();
  const mocks = useLearner((s) => s.mocks);
  const session = useExamSession((s) => s.session);
  const startSession = useExamSession((s) => s.start);
  const clear = useExamSession((s) => s.clear);

  const available = Object.fromEntries(EXAM_DOMAINS.map((d) => [d.id, QUESTIONS.filter((q) => q.domain === d.id).length])) as Record<DomainId, number>;

  const begin = (blueprint: Blueprint) => {
    const recentlySeen = new Set(mocks.slice(-2).flatMap((m) => m.questionIds));
    const seed = Date.now();
    const questions = assembleMockExam(QUESTIONS, blueprint, seed, recentlySeen);
    if (!questions.length) return;
    const now = Date.now();
    startSession({
      id: `mock-${now.toString(36)}`,
      blueprint,
      questionIds: questions.map((q) => q.id),
      answers: {},
      flagged: [],
      current: 0,
      startedAt: now,
      endsAt: now + BLUEPRINTS[blueprint].minutes * 60_000,
    });
    navigate('/exam/session');
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Mock exams</span>}
        title="Rehearse exam day"
        description="Timed, mixed-difficulty exams weighted like the official skills outline. No feedback until you submit — then a full breakdown by domain and a specific revision plan."
      />

      {session && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning-100 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-700" aria-hidden="true" />
            <div>
              <div className="text-[14px] font-semibold text-ink">You have an exam in progress</div>
              <p className="text-[13px] text-ink-2">
                {BLUEPRINTS[session.blueprint].label} · {Object.keys(session.answers).length}/{session.questionIds.length} answered
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              Discard
            </Button>
            <LinkButton to="/exam/session" size="sm" iconRight={<ArrowRight className="size-4" />}>
              Resume
            </LinkButton>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(BLUEPRINTS) as Blueprint[]).map((b) => {
          const bp = BLUEPRINTS[b];
          const n = Math.min(bp.questions, QUESTIONS.length);
          const alloc = allocateByWeight(n, available);
          return (
            <Card key={b} className={cn('flex flex-col p-5', b === 'full' && 'border-brand-200 ring-1 ring-brand-100')}>
              <div className="flex items-center justify-between">
                <span className={cn('grid size-10 place-items-center rounded-xl', b === 'full' ? 'bg-brand-600 text-white' : 'bg-subtle text-ink-2')}>
                  <Timer className="size-5" aria-hidden="true" />
                </span>
                {b === 'full' && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-800">Recommended before booking</span>}
              </div>
              <h2 className="mt-4 text-[17px] font-semibold text-ink">{bp.label}</h2>
              <p className="mt-1 text-[13.5px] text-ink-3">{bp.description}</p>
              <dl className="mt-4 space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-ink-3">Questions</dt>
                  <dd className="font-semibold text-ink tabular">{n}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">Time</dt>
                  <dd className="font-semibold text-ink tabular">{bp.minutes} min</dd>
                </div>
              </dl>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-label="Questions by domain">
                {EXAM_DOMAINS.map((d, i) => (
                  <span
                    key={d.id}
                    title={`${d.shortTitle}: ${alloc[d.id]}`}
                    className={cn('h-full', i > 0 && 'border-l-2 border-surface')}
                    style={{ width: `${(alloc[d.id] / Math.max(n, 1)) * 100}%`, background: `var(--color-${['identity', 'storage', 'compute', 'networking', 'monitoring'][i]})` }}
                  />
                ))}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs text-ink-3">
                {EXAM_DOMAINS.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span className="truncate">{d.shortTitle}</span>
                    <span className="tabular">{alloc[d.id]}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-5" variant={b === 'full' ? 'primary' : 'secondary'} icon={<Play className="size-4" />} onClick={() => begin(b)} disabled={QUESTIONS.length === 0}>
                Start
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Your mock exam history</h2>
          {mocks.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-ink-3">No mock exams yet. Your results, domain breakdowns and revision plans will appear here.</p>
          ) : (
            <div className="scrollbar-thin mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-2xs tracking-wide text-ink-3 uppercase">
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 font-semibold">Type</th>
                    <th className="py-2 font-semibold">Score</th>
                    <th className="py-2 font-semibold">Time used</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...mocks].reverse().map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 text-ink-2">{formatDate(new Date(m.finishedAt).toISOString())}</td>
                      <td className="py-2.5 text-ink-2">{BLUEPRINTS[m.blueprint].label}</td>
                      <td className="py-2.5">
                        <span className={cn('font-semibold tabular', m.percent >= READY_TARGET ? 'text-success-700' : 'text-ink')}>{pct(m.percent)}</span>
                      </td>
                      <td className="py-2.5 text-ink-3 tabular">{formatDuration(m.durationMs)}</td>
                      <td className="py-2.5 text-right">
                        <Link to={`/exam/results/${m.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">How it works</h2>
          <ul className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-ink-2">
            <li className="flex gap-2.5">
              <ListChecks className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
              Questions are weighted by domain using the midpoint of each official range, mixed in difficulty and type, and favour questions you have not seen in recent mocks.
            </li>
            <li className="flex gap-2.5">
              <Flag className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
              Flag questions to revisit and review everything before submitting. Answers save automatically if you close the tab.
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
              When time runs out, the exam submits automatically.
            </li>
            <li className="flex gap-2.5">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden="true" />
              Microsoft reports a scaled score where {EXAM_META.passingScore} is required to pass, and a scaled score is not a percentage of questions answered correctly. Stratus reports your percentage and uses {pct(READY_TARGET)} as a conservative readiness target.
            </li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
