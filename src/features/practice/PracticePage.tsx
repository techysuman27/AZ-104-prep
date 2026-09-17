import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, CircleCheck, CircleX, Lightbulb, Play, RotateCcw, Target, X } from 'lucide-react';
import type { DomainId, Question, QuestionKind } from '@/content/schema';
import { QUESTION_KIND_LABELS } from '@/content/schema';
import { QUESTIONS, relevantQuestions } from '@/content/questions';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LESSON_INDEX } from '@/content/curriculum';
import { DOMAIN_INDEX, EXAM_DOMAINS, SKILL_INDEX } from '@/content/exam';
import { gradeQuestion, isAnswered, type Answer } from '@/engine/grading';
import { missedQuestions, weakConcepts } from '@/engine/mastery';
import { createRng, shuffle } from '@/lib/random';
import { PageContainer } from '@/components/layout/Page';
import { Card, EmptyState, Kbd, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AreaChip } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { ExplanationPanel, QuestionBody, QuestionMeta, QuestionStem } from '@/components/questions/QuestionCard';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';
import { pct } from '@/lib/format';
import { useMastery } from '@/features/dashboard/useReadiness';

type SourceMode = 'all' | 'unseen' | 'missed' | 'weak' | 'bookmarked';

const SOURCE_LABELS: Record<SourceMode, { label: string; help: string }> = {
  all: { label: 'All questions', help: 'Everything matching your filters' },
  unseen: { label: 'Not yet answered', help: 'Questions you have never attempted' },
  missed: { label: 'Missed questions', help: 'Answered wrong and not yet answered right' },
  weak: { label: 'Weak concepts', help: 'Questions on concepts you keep missing' },
  bookmarked: { label: 'Bookmarked', help: 'Questions you saved' },
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
      )}
    >
      {children}
    </button>
  );
}

interface SessionState {
  questions: Question[];
  index: number;
  answers: Record<string, Answer>;
  revealed: Record<string, boolean>;
  startedAt: number;
  qStart: number;
}

export default function PracticePage() {
  const [params, setParams] = useSearchParams();
  const attempts = useLearner((s) => s.attempts);
  const bookmarks = useLearner((s) => s.bookmarks);
  const recordAttempts = useLearner((s) => s.recordAttempts);
  const openConcept = useUi((s) => s.openConcept);
  const mastery = useMastery();

  const conceptFocus = params.get('concept');
  const lessonFocus = params.get('lesson');
  const skillFocus = params.get('skill');
  const presetDomain = params.get('domain') as DomainId | null;
  const presetMode = params.get('mode') as SourceMode | null;

  const [domains, setDomains] = useState<Set<DomainId>>(() => new Set(presetDomain && DOMAIN_INDEX[presetDomain] ? [presetDomain] : []));
  const [kinds, setKinds] = useState<Set<QuestionKind>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<SourceMode>(presetMode && SOURCE_LABELS[presetMode] ? presetMode : 'all');
  const [count, setCount] = useState<number>(10);
  const [session, setSession] = useState<SessionState | null>(null);

  const answered = useMemo(() => new Set(attempts.map((a) => a.questionId)), [attempts]);
  const missed = useMemo(() => new Set(missedQuestions(attempts)), [attempts]);
  const weak = useMemo(() => new Set(weakConcepts(mastery.concepts, 12).map((w) => w.id)), [mastery]);
  const bookmarked = useMemo(() => new Set(bookmarks.filter((b) => b.kind === 'question').map((b) => b.id)), [bookmarks]);

  const pool = useMemo(() => {
    let base: Question[] = QUESTIONS;
    if (conceptFocus) base = base.filter((q) => q.concepts.includes(conceptFocus));
    if (skillFocus) base = base.filter((q) => q.skills.includes(skillFocus));
    if (lessonFocus && LESSON_INDEX[lessonFocus]) {
      const l = LESSON_INDEX[lessonFocus];
      base = relevantQuestions({ skills: l.skills, concepts: l.concepts });
    }
    return base.filter(
      (q) =>
        (domains.size === 0 || domains.has(q.domain)) &&
        (kinds.size === 0 || kinds.has(q.kind)) &&
        (difficulties.size === 0 || difficulties.has(q.difficulty)) &&
        (source === 'all' ||
          (source === 'unseen' && !answered.has(q.id)) ||
          (source === 'missed' && missed.has(q.id)) ||
          (source === 'weak' && q.concepts.some((c) => weak.has(c))) ||
          (source === 'bookmarked' && bookmarked.has(q.id))),
    );
  }, [conceptFocus, skillFocus, lessonFocus, domains, kinds, difficulties, source, answered, missed, weak, bookmarked]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const start = (questions?: Question[]) => {
    const rng = createRng(Date.now());
    const chosen = questions ?? shuffle(pool, rng).slice(0, count === 0 ? pool.length : count);
    if (!chosen.length) return;
    setSession({ questions: chosen, index: 0, answers: {}, revealed: {}, startedAt: Date.now(), qStart: Date.now() });
    window.scrollTo({ top: 0 });
  };

  const clearFocus = () => {
    const next = new URLSearchParams(params);
    ['concept', 'lesson', 'skill'].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };

  const focusLabel = conceptFocus
    ? CONCEPT_INDEX[conceptFocus]?.name
    : lessonFocus
      ? LESSON_INDEX[lessonFocus]?.title
      : skillFocus
        ? SKILL_INDEX[skillFocus]?.text
        : null;

  if (session) {
    return (
      <PracticeSession
        session={session}
        setSession={setSession}
        onExit={() => setSession(null)}
        onRestart={(qs) => start(qs)}
        recordAttempts={recordAttempts}
        openConcept={openConcept}
      />
    );
  }

  const domainCounts = EXAM_DOMAINS.map((d) => ({ d, n: QUESTIONS.filter((q) => q.domain === d.id).length }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Practice questions</span>}
        title="Practise with purpose"
        description="Every answer is explained: why the right option is right, why each other option is wrong, the concept being tested, the real-world relevance and the exam trap."
      />

      {focusLabel && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-brand-150 bg-brand-25 px-4 py-2.5 text-[13.5px]">
          <Target className="size-4 text-brand-600" aria-hidden="true" />
          <span className="text-ink-2">
            Focused on <strong className="text-ink">{focusLabel}</strong>
          </span>
          <button type="button" onClick={clearFocus} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
            <X className="size-3.5" aria-hidden="true" /> Clear focus
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-5 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink">Exam domains</legend>
            <div className="flex flex-wrap gap-2">
              {domainCounts.map(({ d, n }) => (
                <Chip key={d.id} on={domains.has(d.id)} onClick={() => toggle(domains, d.id, setDomains)}>
                  {d.shortTitle} <span className={cn('tabular', domains.has(d.id) ? 'text-white/70' : 'text-ink-4')}>{n}</span>
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink">Question types</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(QUESTION_KIND_LABELS) as QuestionKind[]).map((k) => (
                <Chip key={k} on={kinds.has(k)} onClick={() => toggle(kinds, k, setKinds)}>
                  {QUESTION_KIND_LABELS[k]}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-ink">Difficulty</legend>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((d) => (
                  <Chip key={d} on={difficulties.has(d)} onClick={() => toggle(difficulties, d, setDifficulties)}>
                    {d === 1 ? 'Foundation' : d === 2 ? 'Intermediate' : 'Hard'}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-ink">Session length</legend>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20, 40, 0].map((c) => (
                  <Chip key={c} on={count === c} onClick={() => setCount(c)}>
                    {c === 0 ? 'All' : c}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink">Question source</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(SOURCE_LABELS) as SourceMode[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={source === s}
                  onClick={() => setSource(s)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left transition-colors',
                    source === s ? 'border-brand-400 bg-brand-25 ring-2 ring-brand-100' : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span className="block text-[13.5px] font-semibold text-ink">{SOURCE_LABELS[s].label}</span>
                  <span className="block text-xs text-ink-3">{SOURCE_LABELS[s].help}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </Card>

        <div className="space-y-4">
          <Card className="sticky top-6 p-5">
            <div className="text-[13px] text-ink-3">Matching questions</div>
            <div className="mt-1 text-[36px] leading-none font-semibold text-ink tabular">{pool.length}</div>
            <p className="mt-2 text-[13px] text-ink-3">
              {pool.length === 0
                ? 'Nothing matches. Loosen a filter.'
                : `Session of ${count === 0 || count > pool.length ? pool.length : count}, shuffled. Feedback after each question.`}
            </p>
            <Button className="mt-4 w-full" size="lg" disabled={pool.length === 0} onClick={() => start()} icon={<Play className="size-4" />}>
              Start practice
            </Button>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              <div>
                <div className="text-[17px] font-semibold text-ink tabular">{answered.size}</div>
                <div className="text-2xs text-ink-3">Answered</div>
              </div>
              <div>
                <div className="text-[17px] font-semibold text-ink tabular">{missed.size}</div>
                <div className="text-2xs text-ink-3">To retry</div>
              </div>
              <div>
                <div className="text-[17px] font-semibold text-ink tabular">{QUESTIONS.length}</div>
                <div className="text-2xs text-ink-3">In bank</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function PracticeSession({
  session,
  setSession,
  onExit,
  onRestart,
  recordAttempts,
  openConcept,
}: {
  session: SessionState;
  setSession: (s: SessionState) => void;
  onExit: () => void;
  onRestart: (qs?: Question[]) => void;
  recordAttempts: ReturnType<typeof useLearner.getState>['recordAttempts'];
  openConcept: (id: string) => void;
}) {
  const done = session.index >= session.questions.length;
  const q = session.questions[Math.min(session.index, session.questions.length - 1)];
  const answer = session.answers[q.id];
  const revealed = !!session.revealed[q.id];

  const check = () => {
    if (!isAnswered(q, answer) || revealed) return;
    const r = gradeQuestion(q, answer);
    recordAttempts([{ questionId: q.id, correct: r.correct, score: r.score, at: Date.now(), mode: 'practice', ms: Date.now() - session.qStart }]);
    setSession({ ...session, revealed: { ...session.revealed, [q.id]: true } });
  };
  const next = () => {
    setSession({ ...session, index: session.index + 1, qStart: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLSelectElement || e.target instanceof HTMLButtonElement) return;
      if (done) return;
      if (revealed) next();
      else check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    const results = session.questions.map((qq) => ({ q: qq, r: gradeQuestion(qq, session.answers[qq.id]) }));
    const correct = results.filter((x) => x.r.correct).length;
    const wrong = results.filter((x) => !x.r.correct);
    const byDomain = EXAM_DOMAINS.map((d) => {
      const items = results.filter((x) => x.q.domain === d.id);
      return { d, total: items.length, correct: items.filter((x) => x.r.correct).length };
    }).filter((x) => x.total > 0);
    const concepts = [...new Set(wrong.flatMap((x) => x.q.concepts))].filter((c) => CONCEPT_INDEX[c]);

    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="overflow-hidden">
            <div className="blueprint px-6 py-6 text-white">
              <div className="text-2xs font-semibold tracking-wide text-white/60 uppercase">Session complete</div>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-[44px] leading-none font-semibold tabular">{pct(correct / results.length)}</span>
                <span className="pb-1 text-[15px] text-white/75">
                  {correct} of {results.length} correct
                </span>
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">By domain</div>
                <ul className="mt-2 space-y-2.5">
                  {byDomain.map((x) => (
                    <li key={x.d.id}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <AreaChip area={x.d.id} />
                        <span className="text-ink-3 tabular">
                          {x.correct}/{x.total}
                        </span>
                      </div>
                      <ProgressBar value={x.correct / x.total} size="sm" label={`${x.d.shortTitle} accuracy`} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Revisit these concepts</div>
                {concepts.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-ink-2">Nothing missed. Try harder questions or a mock exam.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {concepts.map((c) => (
                      <li key={c}>
                        <button type="button" onClick={() => openConcept(c)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[13px] font-medium text-ink-2 hover:border-brand-300 hover:text-ink">
                          <Lightbulb className="size-3.5 text-warning-600" aria-hidden="true" /> {CONCEPT_INDEX[c].name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line px-6 py-4">
              {wrong.length > 0 && (
                <Button icon={<RotateCcw className="size-4" />} onClick={() => onRestart(wrong.map((x) => x.q))}>
                  Retry {wrong.length} missed
                </Button>
              )}
              <Button variant="secondary" onClick={onExit}>
                New session
              </Button>
              <Link to="/" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-ink-2 hover:bg-subtle">
                Dashboard
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Question review</h2>
            <ul className="mt-3 divide-y divide-line">
              {results.map(({ q: qq, r }, i) => (
                <li key={qq.id} className="py-3">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                      {r.correct ? (
                        <CircleCheck className="mt-0.5 size-5 shrink-0 text-success-600" aria-label="Correct" />
                      ) : (
                        <CircleX className="mt-0.5 size-5 shrink-0 text-danger-500" aria-label="Incorrect" />
                      )}
                      <span className="line-clamp-2 flex-1 text-[14px] text-ink-2 group-open:line-clamp-none">
                        <span className="font-semibold text-ink-3 tabular">{i + 1}. </span>
                        {qq.stem}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 pl-8">
                      <QuestionBody question={qq} answer={session.answers[qq.id]} onAnswerChange={() => undefined} revealed />
                      <ExplanationPanel question={qq} answer={session.answers[qq.id]} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-4">
          <button type="button" onClick={onExit} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-3 hover:bg-subtle hover:text-ink">
            <X className="size-4" aria-hidden="true" /> End
          </button>
          <ProgressBar value={session.index / session.questions.length} label="Session progress" />
          <span className="shrink-0 text-[13px] text-ink-3 tabular">
            {session.index + 1} / {session.questions.length}
          </span>
        </div>

        <Card key={q.id} className="animate-rise-in space-y-5 p-5 sm:p-7">
          <QuestionMeta question={q} />
          <QuestionStem question={q} />
          <QuestionBody
            question={q}
            answer={answer}
            revealed={revealed}
            onAnswerChange={(a) => setSession({ ...session, answers: { ...session.answers, [q.id]: a } })}
          />
          {revealed && <ExplanationPanel question={q} answer={answer} />}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="hidden items-center gap-1.5 text-xs text-ink-4 sm:inline-flex">
              <Kbd>Enter</Kbd> {revealed ? 'next question' : 'check answer'}
            </span>
            {revealed ? (
              <Button onClick={next} iconRight={<ArrowRight className="size-4" />} className="ml-auto">
                {session.index === session.questions.length - 1 ? 'See results' : 'Next question'}
              </Button>
            ) : (
              <Button onClick={check} disabled={!isAnswered(q, answer)} className="ml-auto">
                Check answer
              </Button>
            )}
          </div>
        </Card>
        {QUESTIONS.length === 0 && <EmptyState title="No questions available" />}
      </div>
    </PageContainer>
  );
}
