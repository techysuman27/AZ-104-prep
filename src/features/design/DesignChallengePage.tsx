import { useState } from 'react';
import { useParams } from 'react-router';
import { ArrowRight, CircleCheck, CircleDot, CircleX, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { DESIGN_INDEX } from '@/content/design';
import { ADMIN_QUESTIONS } from '@/content/mindset';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/Progress';
import { FlowDiagram } from '@/components/diagrams/FlowDiagram';
import { InlineText } from '@/components/content/InlineText';
import { ConceptChip } from '@/components/content/ConnectionsPanel';
import { useLearner } from '@/store/learner';
import { cn } from '@/lib/cn';

export default function DesignChallengePage() {
  const { challengeId = '' } = useParams();
  const challenge = DESIGN_INDEX[challengeId];
  const saveDesign = useLearner((s) => s.saveDesign);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (!challenge) {
    return (
      <PageContainer>
        <EmptyState title="Challenge not found" action={<LinkButton to="/design">All challenges</LinkButton>} />
      </PageContainer>
    );
  }

  const max = challenge.decisions.length * 2;
  const score = challenge.decisions.reduce((s, d) => s + (d.options.find((o) => o.id === choices[d.id])?.score ?? 0), 0);
  const decision = challenge.decisions[step];
  const chosen = decision ? decision.options.find((o) => o.id === choices[decision.id]) : undefined;
  const allDone = challenge.decisions.every((d) => choices[d.id]);

  const reveal = () => {
    setRevealed(true);
    saveDesign(challenge.id, score, max);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setChoices({});
    setStep(0);
    setRevealed(false);
  };

  return (
    <PageContainer wide>
      <Breadcrumbs items={[{ label: 'Solution design lab', to: '/design' }, { label: challenge.title }]} />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="overflow-hidden">
            <div className="blueprint px-5 py-5 text-white">
              <div className="text-2xs font-semibold tracking-wide text-white/60 uppercase">{challenge.company}</div>
              <h1 className="mt-1 text-[22px] leading-snug font-semibold">{challenge.title}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/80">
                <InlineText text={challenge.brief} />
              </p>
            </div>
            <div className="px-5 py-4">
              <h2 className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Requirements</h2>
              <ul className="mt-2 space-y-2">
                {challenge.requirements.map((r) => (
                  <li key={r.id} className="flex gap-2.5 text-[13.5px] leading-snug text-ink-2">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-subtle text-ink-3" title={ADMIN_QUESTIONS[r.category].label}>
                      <Icon name={ADMIN_QUESTIONS[r.category].icon} className="size-3.5" />
                    </span>
                    <span>
                      <span className="mr-1 font-mono text-2xs text-ink-4">{r.id.toUpperCase()}</span>
                      <InlineText text={r.text} />
                    </span>
                  </li>
                ))}
              </ul>
              {challenge.constraints.length > 0 && (
                <>
                  <h2 className="mt-4 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Constraints</h2>
                  <ul className="mt-2 space-y-1.5">
                    {challenge.constraints.map((c) => (
                      <li key={c} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                        <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-4" aria-hidden="true" />
                        <InlineText text={c} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          {!revealed ? (
            <>
              <ol className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1" aria-label="Decisions">
                {challenge.decisions.map((d, i) => {
                  const c = d.options.find((o) => o.id === choices[d.id]);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setStep(i)}
                        aria-current={i === step ? 'step' : undefined}
                        className={cn(
                          'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold whitespace-nowrap',
                          i === step ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-3 hover:border-line-strong',
                        )}
                      >
                        {c ? (
                          c.score === 2 ? (
                            <CircleCheck className="size-3.5 text-success-600" aria-label="Strong choice" />
                          ) : c.score === 1 ? (
                            <CircleDot className="size-3.5 text-warning-600" aria-label="Acceptable choice" />
                          ) : (
                            <CircleX className="size-3.5 text-danger-500" aria-label="Weak choice" />
                          )
                        ) : (
                          <Icon name={ADMIN_QUESTIONS[d.lens].icon} className="size-3.5" />
                        )}
                        <span className="tabular text-ink-4">{i + 1}</span>
                        {ADMIN_QUESTIONS[d.lens].label}
                      </button>
                    </li>
                  );
                })}
              </ol>

              {decision && (
                <Card key={decision.id} className="animate-rise-in p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-2xs font-semibold tracking-wide text-brand-700 uppercase">
                    <Icon name={ADMIN_QUESTIONS[decision.lens].icon} className="size-3.5" /> Decision {step + 1} of {challenge.decisions.length} · {ADMIN_QUESTIONS[decision.lens].question}
                  </div>
                  <h2 className="mt-2 text-[20px] leading-snug font-semibold text-ink">{decision.question}</h2>
                  {decision.context && (
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">
                      <InlineText text={decision.context} />
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {decision.requirementIds.map((r) => (
                      <span key={r} className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-2xs text-ink-3">
                        {r.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {decision.options.map((o) => {
                      const picked = choices[decision.id] === o.id;
                      const locked = !!choices[decision.id];
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => setChoices((c) => ({ ...c, [decision.id]: o.id }))}
                            className={cn(
                              'w-full rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default',
                              !locked && 'border-line hover:border-brand-300 hover:bg-brand-25',
                              locked && picked && o.score === 2 && 'border-success-500/50 bg-success-50',
                              locked && picked && o.score === 1 && 'border-warning-500/50 bg-warning-50',
                              locked && picked && o.score === 0 && 'border-danger-500/50 bg-danger-50',
                              locked && !picked && o.score === 2 && 'border-success-500/40 bg-surface',
                              locked && !picked && o.score !== 2 && 'border-line bg-surface opacity-70',
                            )}
                          >
                            <span className="block text-[14.5px] font-semibold text-ink">
                              <InlineText text={o.label} />
                            </span>
                            {o.detail && (
                              <span className="mt-0.5 block text-[13px] text-ink-3">
                                <InlineText text={o.detail} />
                              </span>
                            )}
                            {locked && (picked || o.score === 2) && (
                              <span className="mt-2 block text-[13px] leading-relaxed text-ink-2">
                                <span className={cn('font-semibold', o.score === 2 ? 'text-success-700' : o.score === 1 ? 'text-warning-700' : 'text-danger-700')}>
                                  {o.score === 2 ? (picked ? 'Strong choice. ' : 'Recommended. ') : o.score === 1 ? 'Workable, with trade-offs. ' : 'Weak choice. '}
                                </span>
                                <InlineText text={o.feedback} />
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {chosen && (
                    <div className="mt-4 flex justify-end">
                      {step < challenge.decisions.length - 1 ? (
                        <Button onClick={() => setStep(step + 1)} iconRight={<ArrowRight className="size-4" />}>
                          Next decision
                        </Button>
                      ) : allDone ? (
                        <Button onClick={reveal} icon={<Sparkles className="size-4" />}>
                          Reveal the recommended architecture
                        </Button>
                      ) : (
                        <span className="text-[13px] text-ink-3">Answer every decision to reveal the architecture.</span>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-5">
              <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                <ProgressRing value={score / max} size={96} stroke={9} label={`Design score ${score} of ${max}`}>
                  <span className="text-[20px] font-semibold text-ink tabular">{Math.round((score / max) * 100)}</span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-semibold text-ink">Your design scored {score} of {max}</h2>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-3">
                    <InlineText text={challenge.solution.summary} />
                  </p>
                </div>
                <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={reset}>
                  Redesign
                </Button>
              </Card>

              <FlowDiagram spec={challenge.solution.diagram} title="Recommended architecture" alt={`Recommended architecture for ${challenge.title}`} />

              <Card className="p-5">
                <h2 className="text-[15px] font-semibold text-ink">Why this design</h2>
                <dl className="mt-3 divide-y divide-line">
                  {challenge.solution.rationale.map((r) => (
                    <div key={r.decision} className="grid gap-1 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[13.5px] font-semibold text-ink">
                        <InlineText text={r.decision} />
                      </dt>
                      <dd className="text-[14px] leading-relaxed text-ink-2">
                        <InlineText text={r.why} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="p-5">
                <h2 className="text-[15px] font-semibold text-ink">Your decisions, reviewed</h2>
                <ul className="mt-3 space-y-2">
                  {challenge.decisions.map((d) => {
                    const c = d.options.find((o) => o.id === choices[d.id]);
                    const best = d.options.find((o) => o.score === 2);
                    return (
                      <li key={d.id} className="rounded-xl border border-line px-4 py-3">
                        <div className="text-[13px] font-medium text-ink-3">{d.question}</div>
                        <div className="mt-1 flex items-start gap-2 text-[14px]">
                          {c?.score === 2 ? (
                            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-600" aria-label="Strong" />
                          ) : c?.score === 1 ? (
                            <CircleDot className="mt-0.5 size-4 shrink-0 text-warning-600" aria-label="Acceptable" />
                          ) : (
                            <CircleX className="mt-0.5 size-4 shrink-0 text-danger-500" aria-label="Weak" />
                          )}
                          <span className="text-ink">
                            <InlineText text={c?.label ?? '—'} />
                          </span>
                        </div>
                        {c && c.score < 2 && best && (
                          <div className="mt-1 pl-6 text-[13px] text-ink-3">
                            Recommended: <InlineText text={best.label} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card className="p-5">
                <h2 className="text-[15px] font-semibold text-ink">Alternatives worth knowing</h2>
                <ul className="mt-3 space-y-2">
                  {challenge.solution.alternatives.map((a) => (
                    <li key={a.option} className="rounded-xl bg-subtle/60 px-4 py-3 text-[14px] leading-relaxed text-ink-2">
                      <strong className="text-ink">
                        <InlineText text={a.option} />
                      </strong>{' '}
                      — <InlineText text={a.whenBetter} />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {challenge.concepts.map((c) => (
                    <ConceptChip key={c} id={c} />
                  ))}
                </div>
                <div className="mt-4 text-xs text-ink-3">
                  Sources:{' '}
                  {challenge.sources
                    .map((s) => SOURCES[s])
                    .filter(Boolean)
                    .map((s, i) => (
                      <span key={s.id}>
                        {i > 0 && ' · '}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                          {s.title}
                        </a>
                      </span>
                    ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
