import { useEffect, useMemo, useState } from 'react';
import { Brain, CircleCheck, Eye, Lightbulb, Play, X } from 'lucide-react';
import type { DomainId, Flashcard } from '@/content/schema';
import { FLASHCARDS } from '@/content/flashcards';
import { EXAM_DOMAINS } from '@/content/exam';
import { CONCEPT_INDEX } from '@/content/concepts';
import { formatInterval, isDue, previewIntervals, type SrsGrade } from '@/engine/srs';
import { createRng, shuffle } from '@/lib/random';
import { PageContainer } from '@/components/layout/Page';
import { Card, EmptyState, Kbd, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AreaChip, TierBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { InlineText } from '@/components/content/InlineText';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';

const NEW_PER_SESSION = 15;

const GRADES: { grade: SrsGrade; label: string; key: string; cls: string; help: string }[] = [
  { grade: 0, label: 'Again', key: '1', cls: 'border-danger-100 bg-danger-50 text-danger-700 hover:border-danger-500/40', help: 'I did not remember' },
  { grade: 1, label: 'Hard', key: '2', cls: 'border-warning-100 bg-warning-50 text-warning-700 hover:border-warning-500/40', help: 'Remembered with effort' },
  { grade: 2, label: 'Good', key: '3', cls: 'border-brand-150 bg-brand-50 text-brand-800 hover:border-brand-300', help: 'Remembered' },
  { grade: 3, label: 'Easy', key: '4', cls: 'border-success-100 bg-success-50 text-success-700 hover:border-success-500/40', help: 'Instant recall' },
];

export default function ReviewPage() {
  const srs = useLearner((s) => s.srs);
  const gradeCard = useLearner((s) => s.gradeCard);
  const openConcept = useUi((s) => s.openConcept);
  const [domain, setDomain] = useState<DomainId | 'foundations' | 'all'>('all');
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState<Record<SrsGrade, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  const now = Date.now();
  const scoped = useMemo(() => FLASHCARDS.filter((c) => domain === 'all' || c.domain === domain), [domain]);
  const due = scoped.filter((c) => srs[c.id] && isDue(srs[c.id], now));
  const fresh = scoped.filter((c) => !srs[c.id]);
  const learned = FLASHCARDS.filter((c) => srs[c.id]?.reps).length;
  const mature = FLASHCARDS.filter((c) => (srs[c.id]?.interval ?? 0) >= 21).length;

  const startSession = () => {
    const rng = createRng(Date.now());
    const q = [...shuffle(due, rng), ...shuffle(fresh, rng).slice(0, NEW_PER_SESSION)];
    setQueue(q);
    setPos(0);
    setShown(false);
    setGraded({ 0: 0, 1: 0, 2: 0, 3: 0 });
  };

  const card = queue?.[pos];

  const grade = (g: SrsGrade) => {
    if (!card || !queue) return;
    gradeCard(card.id, g);
    setGraded((x) => ({ ...x, [g]: x[g] + 1 }));
    // Cards marked "Again" return at the end of this session.
    if (g === 0) setQueue([...queue, card]);
    setPos((p) => p + 1);
    setShown(false);
  };

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && !shown) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ['1', '2', '3', '4'].includes(e.key)) {
        grade(Number(e.key) - 1 as SrsGrade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (queue && card) {
    const preview = previewIntervals(srs[card.id], card.id);
    const concept = CONCEPT_INDEX[card.concept];
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center gap-4">
            <button type="button" onClick={() => setQueue(null)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-3 hover:bg-subtle hover:text-ink">
              <X className="size-4" aria-hidden="true" /> End
            </button>
            <ProgressBar value={pos / queue.length} label="Review progress" />
            <span className="shrink-0 text-[13px] text-ink-3 tabular">
              {pos + 1} / {queue.length}
            </span>
          </div>

          <Card key={`${card.id}-${pos}`} className="animate-rise-in overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
              <AreaChip area={card.domain} />
              <div className="flex items-center gap-2">
                {!srs[card.id] && <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-2xs font-semibold text-brand-800">New</span>}
                <TierBadge tier={card.tier} />
              </div>
            </div>
            <div className="min-h-[180px] px-6 py-8">
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Question</div>
              <p className="mt-2 text-[20px] leading-snug font-medium text-ink">
                <InlineText text={card.front} />
              </p>
              {shown && (
                <div className="mt-6 animate-fade-in border-t border-dashed border-line-strong pt-6">
                  <div className="text-2xs font-semibold tracking-wide text-success-700 uppercase">Answer</div>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
                    <InlineText text={card.back} />
                  </p>
                  {concept && (
                    <button type="button" onClick={() => openConcept(concept.id)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
                      <Lightbulb className="size-3.5" aria-hidden="true" /> Explain {concept.name} again
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-line bg-subtle/50 px-5 py-4">
              {!shown ? (
                <Button className="w-full" size="lg" icon={<Eye className="size-4" />} onClick={() => setShown(true)}>
                  Show answer <Kbd className="ml-2 border-white/30 bg-white/15 text-white">Space</Kbd>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GRADES.map((g) => (
                    <button key={g.grade} type="button" onClick={() => grade(g.grade)} className={cn('rounded-xl border px-3 py-2.5 text-center transition-colors', g.cls)}>
                      <span className="block text-[14px] font-semibold">{g.label}</span>
                      <span className="block text-2xs opacity-80">
                        {formatInterval(preview[g.grade])} · <span className="hidden sm:inline">key </span>
                        {g.key}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
          <p className="mt-3 text-center text-xs text-ink-4">Grade honestly — the schedule adapts to how well you actually remembered.</p>
        </div>
      </PageContainer>
    );
  }

  if (queue && !card) {
    const total = Object.values(graded).reduce((a, b) => a + b, 0);
    return (
      <PageContainer>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-success-50 text-success-700">
            <CircleCheck className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-[22px] font-semibold text-ink">Review complete</h1>
          <p className="mt-1 text-[14px] text-ink-3">{total} reviews. Cards you found hard will come back sooner.</p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <div key={g.grade} className={cn('rounded-xl border px-2 py-2', g.cls)}>
                <div className="text-[18px] font-semibold tabular">{graded[g.grade]}</div>
                <div className="text-2xs">{g.label}</div>
              </div>
            ))}
          </div>
          <Button className="mt-6" variant="secondary" onClick={() => setQueue(null)}>
            Back to review
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Flashcard review</span>}
        title="Remember it for exam day — and after"
        description="Spaced repetition schedules each card just before you are likely to forget it. Short daily sessions beat long cramming sessions."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by area">
            {(['all', 'foundations', ...EXAM_DOMAINS.map((d) => d.id)] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={domain === d}
                onClick={() => setDomain(d)}
                className={cn(
                  'h-8 rounded-full border px-3 text-xs font-medium',
                  domain === d ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                {d === 'all' ? 'All areas' : d === 'foundations' ? 'Foundations' : EXAM_DOMAINS.find((x) => x.id === d)!.shortTitle}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line p-4">
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Due now</div>
              <div className="mt-1 text-[32px] leading-none font-semibold text-ink tabular">{due.length}</div>
            </div>
            <div className="rounded-xl border border-line p-4">
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">New available</div>
              <div className="mt-1 text-[32px] leading-none font-semibold text-ink tabular">{fresh.length}</div>
              <div className="mt-1 text-2xs text-ink-3">Up to {NEW_PER_SESSION} per session</div>
            </div>
            <div className="rounded-xl border border-line p-4">
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Session size</div>
              <div className="mt-1 text-[32px] leading-none font-semibold text-ink tabular">{due.length + Math.min(fresh.length, NEW_PER_SESSION)}</div>
            </div>
          </div>

          {FLASHCARDS.length === 0 ? (
            <EmptyState className="mt-6" title="No flashcards yet" />
          ) : due.length + fresh.length === 0 ? (
            <div className="mt-6 rounded-xl bg-success-50 px-4 py-3 text-[14px] text-success-700">You are all caught up in this area. Come back tomorrow.</div>
          ) : (
            <Button size="lg" className="mt-6" icon={<Play className="size-4" />} onClick={startSession}>
              Start review
            </Button>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Brain className="size-4 text-brand-600" aria-hidden="true" /> Your memory
          </h2>
          <dl className="mt-4 space-y-3 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-2">Cards in the deck</dt>
              <dd className="font-semibold text-ink tabular">{FLASHCARDS.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Learned (reviewed successfully)</dt>
              <dd className="font-semibold text-ink tabular">{learned}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Mature (interval ≥ 21 days)</dt>
              <dd className="font-semibold text-ink tabular">{mature}</dd>
            </div>
          </dl>
          <ProgressBar className="mt-4" value={FLASHCARDS.length ? learned / FLASHCARDS.length : 0} label="Share of deck learned" />
          <p className="mt-4 text-xs leading-relaxed text-ink-3">
            Flashcard recall feeds the <strong className="text-ink-2">retention</strong> part of your readiness score.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
