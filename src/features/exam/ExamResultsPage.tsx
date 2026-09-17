import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, CircleCheck, CircleX, Flag, Lightbulb, RotateCcw, Timer } from 'lucide-react';
import type { Question, QuestionKind } from '@/content/schema';
import { QUESTION_KIND_LABELS } from '@/content/schema';
import { QUESTION_INDEX } from '@/content/questions';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LESSONS } from '@/content/curriculum';
import { DOMAIN_INDEX, EXAM_DOMAINS, SKILL_INDEX } from '@/content/exam';
import { BLUEPRINTS } from '@/engine/mockExam';
import { READY_TARGET } from '@/engine/readiness';
import type { Answer } from '@/engine/grading';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { AreaChip } from '@/components/ui/Badge';
import { ExhibitView, ExplanationPanel, QuestionBody, QuestionMeta } from '@/components/questions/QuestionCard';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';
import { formatDate, formatDuration, pct } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ExamResultsPage() {
  const { mockId = '' } = useParams();
  const mock = useLearner((s) => s.mocks.find((m) => m.id === mockId));
  const openConcept = useUi((s) => s.openConcept);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'flagged'>('incorrect');

  const questions = useMemo(() => (mock ? mock.questionIds.map((id) => QUESTION_INDEX[id]).filter(Boolean) : []), [mock]);

  if (!mock) {
    return (
      <PageContainer>
        <EmptyState title="Result not found" description="This mock exam result is not available on this device." action={<LinkButton to="/exam">Mock exams</LinkButton>} />
      </PageContainer>
    );
  }

  const wrong = questions.filter((q) => !mock.results[q.id]?.correct);
  const passed = mock.percent >= READY_TARGET;

  const kinds = (Object.keys(QUESTION_KIND_LABELS) as QuestionKind[])
    .map((k) => {
      const items = questions.filter((q) => q.kind === k);
      return { k, total: items.length, correct: items.filter((q) => mock.results[q.id]?.correct).length };
    })
    .filter((x) => x.total > 0);

  const skillMisses = new Map<string, number>();
  const conceptMisses = new Map<string, number>();
  for (const q of wrong) {
    q.skills.forEach((s) => skillMisses.set(s, (skillMisses.get(s) ?? 0) + 1));
    q.concepts.forEach((c) => conceptMisses.set(c, (conceptMisses.get(c) ?? 0) + 1));
  }
  const topSkills = [...skillMisses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topConcepts = [...conceptMisses.entries()].filter(([c]) => CONCEPT_INDEX[c]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const lessonsToRevisit = LESSONS.map((l) => ({ l, hits: topSkills.filter(([s]) => l.skills.includes(s)).length + topConcepts.filter(([c]) => l.concepts.includes(c)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 4);

  const listed = questions.filter((q) => (filter === 'all' ? true : filter === 'incorrect' ? !mock.results[q.id]?.correct : mock.flagged.includes(q.id)));

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: 'Mock exams', to: '/exam' }, { label: `Results · ${formatDate(new Date(mock.finishedAt).toISOString())}` }]} />

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="blueprint px-6 py-7 text-white">
            <div className="text-2xs font-semibold tracking-wide text-white/60 uppercase">{BLUEPRINTS[mock.blueprint].label}</div>
            <div className="mt-3 text-[56px] leading-none font-semibold tabular">{pct(mock.percent)}</div>
            <div className="mt-2 text-[14px] text-white/80">
              {questions.length - wrong.length} of {questions.length} correct
            </div>
            <div className={cn('mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', passed ? 'bg-success-500/20 text-white' : 'bg-white/10 text-white/85')}>
              {passed ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <Timer className="size-3.5" aria-hidden="true" />}
              {passed ? `At or above the ${pct(READY_TARGET)} readiness target` : `Below the ${pct(READY_TARGET)} readiness target`}
            </div>
            <div className="mt-5 text-xs text-white/60">Time used {formatDuration(mock.durationMs)} of {BLUEPRINTS[mock.blueprint].minutes} min</div>
          </div>
          <div className="p-6">
            <h2 className="text-[15px] font-semibold text-ink">Score by exam domain</h2>
            <ul className="mt-4 space-y-3.5">
              {EXAM_DOMAINS.map((d) => {
                const r = mock.byDomain[d.id];
                if (!r || r.total === 0) return null;
                const v = r.correct / r.total;
                return (
                  <li key={d.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                      <AreaChip area={d.id} />
                      <span className="text-ink-3 tabular">
                        {r.correct}/{r.total} · <strong className="text-ink">{pct(v)}</strong>
                      </span>
                    </div>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', v >= READY_TARGET ? 'bg-brand-600' : 'bg-brand-300')} style={{ width: `${Math.max(2, v * 100)}%` }} />
                      <span className="absolute top-0 bottom-0 w-px bg-ink/50" style={{ left: `${READY_TARGET * 100}%` }} aria-hidden="true" />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {kinds.map((k) => (
                <div key={k.k} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
                  <span className="text-ink-2">{QUESTION_KIND_LABELS[k.k]}</span>
                  <span className="font-semibold text-ink tabular">
                    {k.correct}/{k.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Your revision plan</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">Built from the skills and concepts behind the questions you missed.</p>
          {wrong.length === 0 ? (
            <p className="mt-4 text-[14px] text-success-700">A perfect score. Keep your knowledge fresh with flashcards and try another mock in a week.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {lessonsToRevisit.length > 0 && (
                <li>
                  <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">1 · Re-read these lessons</div>
                  <ul className="mt-2 space-y-1.5">
                    {lessonsToRevisit.map(({ l }) => (
                      <li key={l.id}>
                        <Link to={`/learn/${l.moduleId}/${l.id}`} className="group flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13.5px] hover:border-brand-300">
                          <span className="font-medium text-ink-2 group-hover:text-ink">{l.title}</span>
                          <ArrowRight className="size-3.5 shrink-0 text-ink-4" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
              {topConcepts.length > 0 && (
                <li>
                  <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">2 · Clarify these concepts</div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {topConcepts.map(([c, n]) => (
                      <li key={c}>
                        <button type="button" onClick={() => openConcept(c)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[13px] font-medium text-ink-2 hover:border-brand-300 hover:text-ink">
                          <Lightbulb className="size-3.5 text-warning-600" aria-hidden="true" /> {CONCEPT_INDEX[c].name}
                          <span className="text-ink-4 tabular">×{n}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
              <li>
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">3 · Practise the gaps</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LinkButton to="/practice?mode=missed" size="sm" icon={<RotateCcw className="size-3.5" />}>
                    Retry missed questions
                  </LinkButton>
                  {topSkills[0] && SKILL_INDEX[topSkills[0][0]] && (
                    <LinkButton to={`/practice?skill=${topSkills[0][0]}`} size="sm" variant="secondary">
                      Practise “{SKILL_INDEX[topSkills[0][0]].text}”
                    </LinkButton>
                  )}
                </div>
              </li>
            </ol>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Skills you missed most</h2>
          {topSkills.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-ink-3">No missed skills.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {topSkills.map(([s, n]) => (
                <li key={s} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                  <span className="min-w-0">
                    <span className="block text-ink-2">{SKILL_INDEX[s]?.text ?? s}</span>
                    <span className="block text-2xs text-ink-4">{SKILL_INDEX[s] ? DOMAIN_INDEX[SKILL_INDEX[s].domain].shortTitle : ''}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-danger-50 px-1.5 py-0.5 text-xs font-semibold text-danger-700 tabular">{n} missed</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-ink">Review every question</h2>
          <div className="flex gap-1.5" role="group" aria-label="Filter questions">
            {(['incorrect', 'flagged', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn('h-8 rounded-full border px-3 text-xs font-medium', filter === f ? 'border-ink bg-ink text-white' : 'border-line text-ink-2 hover:border-line-strong')}
              >
                {f === 'incorrect' ? `Incorrect (${wrong.length})` : f === 'flagged' ? `Flagged (${mock.flagged.length})` : `All (${questions.length})`}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-4 space-y-3">
          {listed.map((q) => (
            <ReviewItem key={q.id} q={q} n={questions.indexOf(q) + 1} answer={mock.answers[q.id] as Answer} correct={!!mock.results[q.id]?.correct} flagged={mock.flagged.includes(q.id)} />
          ))}
          {listed.length === 0 && <li className="py-6 text-center text-[13.5px] text-ink-3">Nothing to show for this filter.</li>}
        </ul>
      </Card>
    </PageContainer>
  );
}

function ReviewItem({ q, n, answer, correct, flagged }: { q: Question; n: number; answer: Answer; correct: boolean; flagged: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        {correct ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success-600" aria-label="Correct" /> : <CircleX className="mt-0.5 size-5 shrink-0 text-danger-500" aria-label="Incorrect" />}
        <span className={cn('flex-1 text-[14px] text-ink-2', !open && 'line-clamp-2')}>
          <span className="font-semibold text-ink-3 tabular">{n}. </span>
          {q.stem}
        </span>
        {flagged && <Flag className="mt-1 size-3.5 shrink-0 fill-warning-500 text-warning-600" aria-label="Flagged" />}
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          <QuestionMeta question={q} />
          {q.exhibit && <ExhibitView exhibit={q.exhibit} />}
          <QuestionBody question={q} answer={answer} onAnswerChange={() => undefined} revealed />
          <ExplanationPanel question={q} answer={answer} />
        </div>
      )}
    </li>
  );
}
