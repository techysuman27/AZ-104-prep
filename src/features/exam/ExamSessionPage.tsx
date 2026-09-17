import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Clock, Flag, LayoutGrid, Send } from 'lucide-react';
import type { DomainId } from '@/content/schema';
import { QUESTION_INDEX } from '@/content/questions';
import { EXAM_DOMAINS } from '@/content/exam';
import { gradeQuestion, isAnswered } from '@/engine/grading';
import { BLUEPRINTS } from '@/engine/mockExam';
import { PageContainer } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Overlay';
import { QuestionBody, QuestionStem } from '@/components/questions/QuestionCard';
import { useExamSession } from '@/store/examSession';
import { useLearner, type MockResult } from '@/store/learner';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ExamSessionPage() {
  const navigate = useNavigate();
  const session = useExamSession((s) => s.session);
  const answerQ = useExamSession((s) => s.answer);
  const toggleFlag = useExamSession((s) => s.toggleFlag);
  const goTo = useExamSession((s) => s.goTo);
  const clear = useExamSession((s) => s.clear);
  const saveMock = useLearner((s) => s.saveMock);
  const recordAttempts = useLearner((s) => s.recordAttempts);
  const [now, setNow] = useState(() => Date.now());
  const [reviewOpen, setReviewOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const questions = useMemo(() => (session ? session.questionIds.map((id) => QUESTION_INDEX[id]).filter(Boolean) : []), [session]);

  const submit = useCallback(() => {
    const s = useExamSession.getState().session;
    if (!s) return;
    const finishedAt = Date.now();
    const results: MockResult['results'] = {};
    const byDomain = Object.fromEntries(EXAM_DOMAINS.map((d) => [d.id, { correct: 0, total: 0 }])) as Record<DomainId, { correct: number; total: number }>;
    let correct = 0;
    const qs = s.questionIds.map((id) => QUESTION_INDEX[id]).filter(Boolean);
    for (const q of qs) {
      const r = gradeQuestion(q, s.answers[q.id]);
      results[q.id] = { correct: r.correct, score: r.score };
      byDomain[q.domain].total += 1;
      if (r.correct) {
        byDomain[q.domain].correct += 1;
        correct += 1;
      }
    }
    const mock: MockResult = {
      id: s.id,
      blueprint: s.blueprint,
      startedAt: s.startedAt,
      finishedAt,
      durationMs: Math.min(finishedAt, s.endsAt) - s.startedAt,
      questionIds: s.questionIds,
      answers: s.answers,
      flagged: s.flagged,
      results,
      byDomain,
      percent: qs.length ? correct / qs.length : 0,
    };
    saveMock(mock);
    recordAttempts(
      qs
        .filter((q) => isAnswered(q, s.answers[q.id]))
        .map((q) => ({ questionId: q.id, correct: results[q.id].correct, score: results[q.id].score, at: finishedAt, mode: 'mock' as const })),
    );
    clear();
    navigate(`/exam/results/${mock.id}`, { replace: true });
  }, [clear, navigate, recordAttempts, saveMock]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (session && now >= session.endsAt) submit();
  }, [now, session, submit]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useExamSession.getState().session) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  if (!session) return <Navigate to="/exam" replace />;
  if (!questions.length) {
    return (
      <PageContainer>
        <p className="text-ink-2">This exam could not be loaded.</p>
        <Button className="mt-4" onClick={clear}>
          Discard exam
        </Button>
      </PageContainer>
    );
  }

  const index = Math.min(session.current, questions.length - 1);
  const q = questions[index];
  const remaining = session.endsAt - now;
  const answeredCount = questions.filter((qq) => isAnswered(qq, session.answers[qq.id])).length;
  const flagged = session.flagged.includes(q.id);
  const lowTime = remaining < 5 * 60_000;

  const Navigator = (
    <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-10" aria-label="Question navigator">
      {questions.map((qq, i) => {
        const a = isAnswered(qq, session.answers[qq.id]);
        const f = session.flagged.includes(qq.id);
        return (
          <li key={qq.id}>
            <button
              type="button"
              onClick={() => {
                goTo(i);
                setNavOpen(false);
                setReviewOpen(false);
              }}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Question ${i + 1}${a ? ', answered' : ', unanswered'}${f ? ', flagged' : ''}`}
              className={cn(
                'relative grid h-9 w-full place-items-center rounded-lg border text-xs font-semibold tabular transition-colors',
                i === index ? 'border-brand-600 bg-brand-600 text-white' : a ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-3 hover:border-line-strong',
              )}
            >
              {i + 1}
              {f && <Flag className="absolute -top-1 -right-1 size-3 fill-warning-500 text-warning-600" aria-hidden="true" />}
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <PageContainer wide>
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink">{BLUEPRINTS[session.blueprint].label}</div>
            <div className="text-xs text-ink-3 tabular">
              {answeredCount}/{questions.length} answered · {session.flagged.length} flagged
            </div>
          </div>
          <div
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-semibold tabular',
              lowTime ? 'bg-danger-50 text-danger-700' : 'bg-surface text-ink shadow-xs',
            )}
            role="timer"
            aria-label={`Time remaining ${formatDuration(remaining)}`}
          >
            <Clock className="size-4" aria-hidden="true" /> {formatDuration(remaining)}
          </div>
          <Button variant="secondary" size="sm" className="lg:hidden" icon={<LayoutGrid className="size-4" />} onClick={() => setNavOpen(true)}>
            Questions
          </Button>
          <Button size="sm" icon={<Send className="size-4" />} onClick={() => setReviewOpen(true)}>
            Finish
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card key={q.id} className="animate-fade-in space-y-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <QuestionStem question={q} number={index + 1} total={questions.length} />
            <button
              type="button"
              onClick={() => toggleFlag(q.id)}
              aria-pressed={flagged}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold',
                flagged ? 'border-warning-500/50 bg-warning-50 text-warning-700' : 'border-line text-ink-3 hover:border-line-strong',
              )}
            >
              <Flag className={cn('size-3.5', flagged && 'fill-warning-500')} aria-hidden="true" /> {flagged ? 'Flagged' : 'Flag'}
            </button>
          </div>
          <QuestionBody question={q} answer={session.answers[q.id]} onAnswerChange={(a) => answerQ(q.id, a)} revealed={false} />
          <div className="flex items-center justify-between border-t border-line pt-4">
            <Button variant="secondary" icon={<ArrowLeft className="size-4" />} disabled={index === 0} onClick={() => goTo(index - 1)}>
              Previous
            </Button>
            {index < questions.length - 1 ? (
              <Button iconRight={<ArrowRight className="size-4" />} onClick={() => goTo(index + 1)}>
                Next
              </Button>
            ) : (
              <Button icon={<Send className="size-4" />} onClick={() => setReviewOpen(true)}>
                Review and submit
              </Button>
            )}
          </div>
        </Card>

        <aside className="hidden lg:block">
          <Card className="sticky top-24 p-4">
            <div className="mb-3 text-[13px] font-semibold text-ink">Questions</div>
            {Navigator}
            <div className="mt-3 flex flex-wrap gap-3 text-2xs text-ink-3">
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded-sm border border-brand-200 bg-brand-50" /> Answered
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded-sm border border-line bg-surface" /> Unanswered
              </span>
              <span className="inline-flex items-center gap-1">
                <Flag className="size-2.5 fill-warning-500 text-warning-600" aria-hidden="true" /> Flagged
              </span>
            </div>
          </Card>
        </aside>
      </div>

      <Dialog open={navOpen} onOpenChange={setNavOpen} title="Questions">
        <div className="p-5">{Navigator}</div>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen} title="Review before submitting" description="You can still change any answer.">
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-line p-3">
              <div className="text-[22px] font-semibold text-ink tabular">{answeredCount}</div>
              <div className="text-2xs text-ink-3">Answered</div>
            </div>
            <div className={cn('rounded-xl border p-3', questions.length - answeredCount > 0 ? 'border-warning-100 bg-warning-50' : 'border-line')}>
              <div className="text-[22px] font-semibold text-ink tabular">{questions.length - answeredCount}</div>
              <div className="text-2xs text-ink-3">Unanswered</div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-[22px] font-semibold text-ink tabular">{session.flagged.length}</div>
              <div className="text-2xs text-ink-3">Flagged</div>
            </div>
          </div>
          {Navigator}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Keep working
            </Button>
            <Button icon={<Send className="size-4" />} onClick={submit}>
              Submit exam
            </Button>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
