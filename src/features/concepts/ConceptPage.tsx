import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, BadgeCheck, Bookmark, BookmarkCheck, CircleCheck, CircleX, FlaskConical, GraduationCap, Orbit, Sprout, Target, Wrench } from 'lucide-react';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LESSONS } from '@/content/curriculum';
import { questionsForConcept } from '@/content/questions';
import { FLASHCARDS } from '@/content/flashcards';
import { SIMULATORS } from '@/content/simulators';
import { TROUBLE_SCENARIOS } from '@/content/trouble';
import { LABS } from '@/content/labs';
import { ARCHITECTURES } from '@/content/architectures';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Button, LinkButton } from '@/components/ui/Button';
import { AreaChip, IconTile, TierBadge } from '@/components/ui/Badge';
import { Card, EmptyState } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Overlay';
import { InlineText } from '@/components/content/InlineText';
import { BlockView, Callout } from '@/components/content/Blocks';
import { ConceptChip, ConnectionsPanel } from '@/components/content/ConnectionsPanel';
import { InlineQuestion } from '@/components/questions/QuickCheck';
import { FlipCard } from '@/components/review/FlipCard';
import { useLearner, isBookmarked } from '@/store/learner';
import { ConceptPlace } from './ConceptSheet';

function Section({ id, title, children, eyebrow }: { id?: string; title: string; children: React.ReactNode; eyebrow?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-20">
      {eyebrow && <div className="text-2xs font-semibold tracking-[0.08em] text-brand-700 uppercase">{eyebrow}</div>}
      <h2 id={id ? `${id}-h` : undefined} className="mb-3 text-[19px] font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ConceptPage() {
  const { conceptId = '' } = useParams();
  const concept = CONCEPT_INDEX[conceptId];
  const globalMode = useLearner((s) => s.settings.explanationMode);
  const [mode, setMode] = useState<'technical' | 'simple' | null>(null);
  const pushRecent = useLearner((s) => s.pushRecent);
  const bookmarked = useLearner((s) => isBookmarked(s, 'concept', conceptId));
  const toggleBookmark = useLearner((s) => s.toggleBookmark);

  useEffect(() => {
    if (concept) pushRecent({ kind: 'concept', id: concept.id });
    setMode(null);
  }, [concept, pushRecent]);

  if (!concept) {
    return (
      <PageContainer>
        <EmptyState title="Concept not found" description="This concept does not exist." action={<LinkButton to="/concepts">Browse concepts</LinkButton>} />
      </PageContainer>
    );
  }

  const m = mode ?? globalMode;
  const lessons = LESSONS.filter((l) => l.concepts.includes(concept.id));
  const questions = questionsForConcept(concept.id);
  const cards = FLASHCARDS.filter((c) => c.concept === concept.id);
  const sims = SIMULATORS.filter((s) => s.concepts.includes(concept.id));
  const scenarios = TROUBLE_SCENARIOS.filter((s) => s.concepts.includes(concept.id));
  const labs = LABS.filter((l) => l.concepts.includes(concept.id));
  const archs = ARCHITECTURES.filter((a) => a.concepts.includes(concept.id));

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: 'Concept library', to: '/concepts' }, { label: concept.name }]} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 space-y-10">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AreaChip area={concept.area} />
              <TierBadge tier={concept.tier} />
            </div>
            <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink sm:text-[36px]">{concept.name}</h1>
            {concept.aliases && concept.aliases.length > 0 && <p className="mt-1 text-[13px] text-ink-3">Also called: {concept.aliases.join(', ')}</p>}
            {concept.place && concept.place.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Where it fits inside Azure</div>
                <ConceptPlace conceptId={concept.id} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={bookmarked ? <BookmarkCheck className="size-4 text-brand-600" /> : <Bookmark className="size-4" />}
                onClick={() => toggleBookmark({ kind: 'concept', id: concept.id })}
                aria-pressed={bookmarked}
              >
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <LinkButton to={`/map/${concept.id}`} variant="secondary" size="sm" icon={<Orbit className="size-4" />}>
                Knowledge map
              </LinkButton>
              {questions.length > 0 && (
                <LinkButton to={`/practice?concept=${concept.id}`} variant="secondary" size="sm" icon={<Target className="size-4" />}>
                  Practise ({questions.length})
                </LinkButton>
              )}
            </div>
          </header>

          <div className={m === 'simple' ? 'rounded-2xl border border-success-100 bg-success-50/50 p-5' : 'rounded-2xl border border-line bg-surface p-5'}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
                {m === 'simple' ? <Sprout className="size-4 text-success-700" aria-hidden="true" /> : null}
                {m === 'simple' ? 'Explained for someone new to Azure' : 'What it is'}
              </div>
              <Segmented
                size="sm"
                label="Explanation style"
                value={m}
                onChange={setMode}
                options={[
                  { value: 'technical', label: 'Technical' },
                  { value: 'simple', label: 'New to Azure' },
                ]}
              />
            </div>
            <p key={m} className="animate-fade-in text-[17px] leading-relaxed text-ink">
              <InlineText text={m === 'simple' ? concept.simple : concept.summary} />
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">Why it exists. </span>
              <InlineText text={concept.why} />
            </p>
          </div>

          {concept.visual && <BlockView block={concept.visual} />}

          {(concept.useWhen?.length || concept.avoidWhen?.length) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {concept.useWhen && concept.useWhen.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-success-700">
                    <CircleCheck className="size-4" aria-hidden="true" /> Use it when
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-2">
                    {concept.useWhen.map((u) => (
                      <li key={u}>
                        <InlineText text={u} />
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {concept.avoidWhen && concept.avoidWhen.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-warning-700">
                    <CircleX className="size-4" aria-hidden="true" /> Not the right choice when
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-2">
                    {concept.avoidWhen.map((u) => (
                      <li key={u}>
                        <InlineText text={u} />
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {concept.howItWorks && concept.howItWorks.length > 0 && (
            <Section title="How it works" eyebrow="Under the hood">
              <BlockView block={{ type: 'list', style: 'check', items: concept.howItWorks }} />
            </Section>
          )}

          {concept.example && (
            <Section title="A real company example" eyebrow="In practice">
              <Callout variant="real-world" text={concept.example} />
            </Section>
          )}

          <Section title="Azure connections" eyebrow="Connect this concept">
            <ConnectionsPanel conceptId={concept.id} compact />
          </Section>

          {concept.confusedWith && concept.confusedWith.length > 0 && (
            <Section title="Often confused with" eyebrow="Concept discrimination">
              <ul className="space-y-2">
                {concept.confusedWith.map((c) => (
                  <li key={c.id} className="rounded-xl border border-line bg-surface p-4">
                    <ConceptChip id={c.id} />
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
                      <InlineText text={c.difference} />
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {concept.mistakes && concept.mistakes.length > 0 && (
            <Section title="Common mistakes" eyebrow="Avoid these">
              <ul className="space-y-2">
                {concept.mistakes.map((mk) => (
                  <li key={mk} className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[14.5px] leading-relaxed text-ink-2">
                    <CircleX className="mt-1 size-4 shrink-0 text-danger-500" aria-hidden="true" />
                    <span>
                      <InlineText text={mk} />
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {concept.troubleshooting && concept.troubleshooting.length > 0 && (
            <Section id="troubleshooting" title="Troubleshooting" eyebrow="When it goes wrong">
              <ul className="space-y-2">
                {concept.troubleshooting.map((t) => (
                  <li key={t} className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[14.5px] leading-relaxed text-ink-2">
                    <Wrench className="mt-1 size-4 shrink-0 text-ink-3" aria-hidden="true" />
                    <span>
                      <InlineText text={t} />
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {concept.examTips && concept.examTips.length > 0 && (
            <Section title="How AZ-104 tests it" eyebrow="Exam angle">
              <div className="space-y-2">
                {concept.examTips.map((t) => (
                  <Callout key={t} variant="exam" text={t} />
                ))}
              </div>
            </Section>
          )}

          {questions.length > 0 && (
            <Section title="Practice questions" eyebrow="Test yourself">
              <div className="space-y-4">
                {questions.slice(0, 2).map((q) => (
                  <InlineQuestion key={q.id} question={q} mode="practice" />
                ))}
              </div>
              {questions.length > 2 && (
                <LinkButton to={`/practice?concept=${concept.id}`} variant="secondary" className="mt-4" icon={<Target className="size-4" />}>
                  All {questions.length} questions on {concept.name}
                </LinkButton>
              )}
            </Section>
          )}

          {cards.length > 0 && (
            <Section title="Flashcards" eyebrow="Remember it">
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c) => (
                  <FlipCard key={c.id} card={c} />
                ))}
              </div>
            </Section>
          )}

          {concept.sources && concept.sources.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface px-5 py-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <BadgeCheck className="size-4 text-success-600" aria-hidden="true" /> Verified against Microsoft documentation
              </div>
              <ul className="mt-2 space-y-1">
                {concept.sources
                  .map((s) => SOURCES[s])
                  .filter(Boolean)
                  .map((s) => (
                    <li key={s.id} className="text-[13.5px]">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                        {s.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </article>

        <aside className="space-y-4">
          {lessons.length > 0 && (
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
                <GraduationCap className="size-4 text-brand-600" aria-hidden="true" /> Learn it in
              </div>
              <ul className="space-y-1">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <Link to={`/learn/${l.moduleId}/${l.id}`} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-subtle">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug font-medium text-ink-2 group-hover:text-ink">{l.title}</span>
                        <span className="block text-2xs text-ink-4">Module {l.moduleNumber}</span>
                      </span>
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-ink-4 group-hover:text-brand-600" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {(sims.length > 0 || scenarios.length > 0 || labs.length > 0) && (
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
                <FlaskConical className="size-4 text-brand-600" aria-hidden="true" /> Hands-on
              </div>
              <ul className="space-y-1">
                {sims.map((s) => (
                  <li key={s.id}>
                    <Link to={`/labs/simulators/${s.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                      <IconTile area={s.area} icon={s.icon} size="sm" className="size-6 rounded-md" />
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    </Link>
                  </li>
                ))}
                {scenarios.map((s) => (
                  <li key={s.id}>
                    <Link to={`/labs/troubleshoot/${s.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                      <Wrench className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    </Link>
                  </li>
                ))}
                {labs.map((l) => (
                  <li key={l.id}>
                    <Link to={`/labs/guided/${l.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                      <FlaskConical className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        Lab {l.number}: {l.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {archs.length > 0 && (
            <Card className="p-4">
              <div className="mb-2 text-[13px] font-semibold text-ink">Used in architectures</div>
              <ul className="space-y-1">
                {archs.map((a) => (
                  <li key={a.id}>
                    <Link to={`/architectures/${a.id}`} className="block rounded-lg px-2 py-1.5 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">
                      {a.title}
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
