import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CircleCheck,
  Clock,
  Lightbulb,
  MessagesSquare,
  Network,
  Target,
} from 'lucide-react';
import type { Lesson, SectionKind } from '@/content/schema';
import { LESSON_INDEX, MODULE_INDEX, adjacentLessons } from '@/content/curriculum';
import { loadLesson } from '@/content/lessons';
import { CONCEPT_INDEX } from '@/content/concepts';
import { relevantQuestions, QUESTION_INDEX } from '@/content/questions';
import { SKILL_INDEX } from '@/content/exam';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Button, LinkButton } from '@/components/ui/Button';
import { AreaChip, LevelBadge, TierBadge } from '@/components/ui/Badge';
import { Card, EmptyState, Skeleton } from '@/components/ui/Card';
import { BlockList, ChangeNoteCard } from '@/components/content/Blocks';
import { InlineText } from '@/components/content/InlineText';
import { InlineQuestion } from '@/components/questions/QuickCheck';
import { useLearner, isBookmarked } from '@/store/learner';
import { useUi } from '@/store/ui';
import { useAsync } from '@/lib/useAsync';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

const KIND_LABEL: Record<SectionKind, string> = {
  intro: 'Overview',
  why: 'Why it matters',
  explain: 'The idea',
  visual: 'See it',
  how: 'How it works',
  example: 'In Azure',
  configure: 'Configure it',
  compare: 'Compare',
  decide: 'Decide',
  mistakes: 'Common mistakes',
  troubleshoot: 'Troubleshoot',
  connections: 'Connections',
  scenario: 'Real-world scenario',
  challenge: 'Challenge',
  exam: 'Exam angle',
};

interface TocItem {
  id: string;
  label: string;
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const markSectionSeen = useLearner((s) => s.markSectionSeen);
  const { lessonId = '' } = useParams();
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id;
          setActive(id);
          markSectionSeen(lessonId, id);
        }
      },
      { rootMargin: '-15% 0px -65% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids, lessonId, markSectionSeen]);
  return active;
}

export default function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams();
  const ref = LESSON_INDEX[lessonId];
  const state = useAsync(`${moduleId}/${lessonId}`, () => loadLesson(moduleId, lessonId));
  const visitLesson = useLearner((s) => s.visitLesson);
  const pushRecent = useLearner((s) => s.pushRecent);

  useEffect(() => {
    if (ref && ref.moduleId === moduleId) {
      visitLesson(ref.id);
      pushRecent({ kind: 'lesson', id: ref.id });
    }
  }, [ref, moduleId, visitLesson, pushRecent]);

  if (!ref || ref.moduleId !== moduleId) {
    return (
      <PageContainer>
        <EmptyState title="Lesson not found" description="This lesson does not exist or has moved." action={<LinkButton to="/learn">Back to learning path</LinkButton>} />
      </PageContainer>
    );
  }

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <div className="max-w-[760px] space-y-4" aria-busy="true" aria-label="Loading lesson">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (state.status === 'error' || !state.data) {
    return (
      <PageContainer>
        <EmptyState
          title={state.status === 'error' ? 'This lesson failed to load' : 'Lesson content is not available yet'}
          description={state.status === 'error' ? state.error.message : 'The lesson outline exists, but its content has not been published.'}
          action={<LinkButton to={`/learn/${moduleId}`}>Back to module</LinkButton>}
        />
      </PageContainer>
    );
  }

  return <LessonView lesson={state.data} />;
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const ref = LESSON_INDEX[lesson.id];
  const module = MODULE_INDEX[ref.moduleId];
  const { prev, next } = adjacentLessons(lesson.id);
  const progress = useLearner((s) => s.lessons[lesson.id]);
  const completeLesson = useLearner((s) => s.completeLesson);
  const bookmarked = useLearner((s) => isBookmarked(s, 'lesson', lesson.id));
  const toggleBookmark = useLearner((s) => s.toggleBookmark);
  const attempts = useLearner((s) => s.attempts);
  const openConcept = useUi((s) => s.openConcept);
  const topRef = useRef<HTMLDivElement>(null);

  const quickIds = useMemo(
    () => new Set(lesson.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === 'quickcheck' ? b.questionIds : [])))),
    [lesson],
  );
  const practice = useMemo(
    () => relevantQuestions({ skills: ref.skills, concepts: ref.concepts }).filter((q) => !quickIds.has(q.id)),
    [ref, quickIds],
  );

  const lessonQuestionIds = useMemo(() => new Set([...quickIds, ...practice.slice(0, 3).map((q) => q.id)]), [quickIds, practice]);
  const missedConcepts = useMemo(() => {
    const last = new Map<string, boolean>();
    for (const a of attempts) if (lessonQuestionIds.has(a.questionId)) last.set(a.questionId, a.correct);
    const ids = [...last.entries()].filter(([, ok]) => !ok).map(([id]) => id);
    return [...new Set(ids.flatMap((id) => QUESTION_INDEX[id]?.concepts ?? []))].filter((c) => CONCEPT_INDEX[c]);
  }, [attempts, lessonQuestionIds]);

  const toc: TocItem[] = [
    ...lesson.sections.map((s) => ({ id: s.id, label: s.title ?? KIND_LABEL[s.kind] })),
    ...(ref.concepts.length ? [{ id: 'related', label: 'Related concepts' }] : []),
    ...(practice.length ? [{ id: 'practice', label: 'Practice questions' }] : []),
    ...(lesson.interview?.length ? [{ id: 'interview', label: 'Interview questions' }] : []),
    { id: 'takeaways', label: 'Key takeaways' },
    ...(lesson.changes?.length ? [{ id: 'changes', label: 'What changed' }] : []),
    { id: 'sources', label: 'Sources' },
  ];
  const tocIds = useMemo(() => toc.map((t) => t.id), [lesson.id, practice.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = useActiveSection(tocIds);
  const seen = new Set(progress?.sectionsSeen ?? []);

  return (
    <PageContainer wide>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_248px]">
        <article className="mx-auto w-full max-w-[780px] min-w-0" ref={topRef}>
          <Breadcrumbs
            items={[
              { label: 'Learning path', to: '/learn' },
              { label: `${module.number}. ${module.title}`, to: `/learn/${module.id}` },
              { label: ref.chapterTitle },
            ]}
          />

          <header className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AreaChip area={module.area} />
              <TierBadge tier={ref.tier} />
              <LevelBadge level={ref.level} />
              <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                <Clock className="size-3.5" aria-hidden="true" /> {ref.minutes} min
              </span>
            </div>
            <h1 className="text-[30px] leading-[1.15] font-semibold tracking-tight text-ink sm:text-[36px]">{ref.title}</h1>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-3">{ref.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={bookmarked ? <BookmarkCheck className="size-4 text-brand-600" /> : <Bookmark className="size-4" />}
                onClick={() => toggleBookmark({ kind: 'lesson', id: lesson.id })}
                aria-pressed={bookmarked}
              >
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              {ref.concepts[0] && (
                <Button variant="secondary" size="sm" icon={<Network className="size-4" />} onClick={() => openConcept(ref.concepts[0])}>
                  Connect this concept
                </Button>
              )}
              {progress?.completedAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                  <CircleCheck className="size-3.5" aria-hidden="true" /> Completed {formatDate(new Date(progress.completedAt).toISOString())}
                </span>
              )}
            </div>
            {ref.skills.length > 0 && (
              <div className="mt-5 rounded-xl border border-line bg-surface px-4 py-3">
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">AZ-104 skills in this lesson</div>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {ref.skills
                    .filter((s) => SKILL_INDEX[s])
                    .map((s) => (
                      <li key={s}>
                        <Link to={`/skills#${s}`} className="inline-block rounded-md bg-subtle px-2 py-1 text-[12.5px] text-ink-2 hover:bg-muted hover:text-ink">
                          {SKILL_INDEX[s].text}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </header>

          <div className="space-y-12">
            {lesson.sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="scroll-mt-20">
                <div className="mb-4">
                  <div className="text-2xs font-semibold tracking-[0.08em] text-brand-700 uppercase">{KIND_LABEL[section.kind]}</div>
                  <h2 id={`${section.id}-h`} className="mt-1 text-[22px] leading-snug font-semibold text-ink">
                    {section.title ?? KIND_LABEL[section.kind]}
                  </h2>
                </div>
                <BlockList blocks={section.blocks} />
              </section>
            ))}

            {ref.concepts.length > 0 && (
              <section id="related" aria-labelledby="related-h" className="scroll-mt-20">
                <div className="mb-4">
                  <div className="text-2xs font-semibold tracking-[0.08em] text-brand-700 uppercase">Connections</div>
                  <h2 id="related-h" className="mt-1 text-[22px] font-semibold text-ink">
                    Related concepts
                  </h2>
                  <p className="mt-1 text-[14px] text-ink-3">Open any concept to see what it depends on, what secures it, and how it is monitored.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ref.concepts
                    .map((id) => CONCEPT_INDEX[id])
                    .filter(Boolean)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openConcept(c.id)}
                        className="group rounded-xl border border-line bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-raised"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <AreaChip area={c.area} />
                          <Network className="size-4 text-ink-4 group-hover:text-brand-600" aria-hidden="true" />
                        </div>
                        <div className="mt-2 text-[15px] font-semibold text-ink">{c.name}</div>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{c.summary}</p>
                      </button>
                    ))}
                </div>
              </section>
            )}

            {practice.length > 0 && (
              <section id="practice" aria-labelledby="practice-h" className="scroll-mt-20">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-2xs font-semibold tracking-[0.08em] text-brand-700 uppercase">Exam practice</div>
                    <h2 id="practice-h" className="mt-1 text-[22px] font-semibold text-ink">
                      Practice questions
                    </h2>
                  </div>
                  {practice.length > 3 && (
                    <LinkButton to={`/practice?lesson=${lesson.id}`} variant="secondary" size="sm" icon={<Target className="size-4" />}>
                      All {practice.length} questions
                    </LinkButton>
                  )}
                </div>
                <div className="space-y-4">
                  {practice.slice(0, 3).map((q) => (
                    <InlineQuestion key={q.id} question={q} />
                  ))}
                </div>
              </section>
            )}

            {lesson.interview && lesson.interview.length > 0 && (
              <section id="interview" aria-labelledby="interview-h" className="scroll-mt-20">
                <div className="mb-4">
                  <div className="text-2xs font-semibold tracking-[0.08em] text-brand-700 uppercase">Beyond the exam</div>
                  <h2 id="interview-h" className="mt-1 text-[22px] font-semibold text-ink">
                    Real interview questions
                  </h2>
                  <p className="mt-1 text-[14px] text-ink-3">How this topic comes up when hiring Azure administrators. Try answering before you open each one.</p>
                </div>
                <div className="space-y-2">
                  {lesson.interview.map((it) => (
                    <details key={it.q} className="group rounded-xl border border-line bg-surface open:shadow-card">
                      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                        <MessagesSquare className="mt-0.5 size-4 shrink-0 text-design-500" aria-hidden="true" />
                        <span className="flex-1 text-[15px] font-medium text-ink">{it.q}</span>
                        <span className="text-xs font-semibold text-brand-700 group-open:hidden">Show answer</span>
                      </summary>
                      <p className="border-t border-line px-4 py-3.5 pl-11 text-[14.5px] leading-relaxed text-ink-2">
                        <InlineText text={it.a} />
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section id="takeaways" aria-labelledby="takeaways-h" className="scroll-mt-20">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="border-b border-line bg-subtle/60 px-5 py-3">
                  <h2 id="takeaways-h" className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                    <Lightbulb className="size-5 text-warning-600" aria-hidden="true" /> Key takeaways
                  </h2>
                </div>
                <ul className="space-y-2.5 px-5 py-4">
                  {lesson.takeaways.map((t) => (
                    <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                      <CircleCheck className="mt-1 size-4 shrink-0 text-success-600" aria-hidden="true" />
                      <span>
                        <InlineText text={t} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {lesson.changes && lesson.changes.length > 0 && (
              <section id="changes" aria-labelledby="changes-h" className="scroll-mt-20">
                <h2 id="changes-h" className="mb-4 text-[22px] font-semibold text-ink">
                  What changed
                </h2>
                <div className="space-y-3">
                  {lesson.changes.map((c) => (
                    <ChangeNoteCard key={c.topic} note={c} />
                  ))}
                </div>
              </section>
            )}

            <section id="sources" aria-labelledby="sources-h" className="scroll-mt-20">
              <div className="rounded-2xl border border-line bg-surface px-5 py-4">
                <h2 id="sources-h" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <BadgeCheck className="size-4 text-success-600" aria-hidden="true" /> Sources &amp; verification
                </h2>
                <p className="mt-1 text-[13px] text-ink-3">
                  Content verified against official Microsoft documentation on {formatDate(lesson.verified)}.{' '}
                  <Link to="/sources" className="font-medium text-brand-700 hover:underline">
                    How Stratus validates content
                  </Link>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {lesson.sources
                    .map((s) => SOURCES[s])
                    .filter(Boolean)
                    .map((s) => (
                      <li key={s.id} className="text-[13.5px]">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                          {s.title}
                        </a>
                        <span className="text-ink-4"> · {s.publisher}</span>
                        {s.pageUpdated && <span className="text-ink-4"> · page updated {formatDate(s.pageUpdated)}</span>}
                      </li>
                    ))}
                </ul>
              </div>
            </section>

            <section aria-label="Finish lesson" className="space-y-4">
              {missedConcepts.length > 0 && (
                <div className="rounded-2xl border border-warning-100 bg-warning-50 px-5 py-4">
                  <div className="text-[14px] font-semibold text-warning-700">Before you move on</div>
                  <p className="mt-1 text-[14px] text-ink-2">You missed questions on these concepts. Revisit them — it takes a minute and it sticks.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missedConcepts.map((c) => (
                      <Button key={c} variant="secondary" size="sm" icon={<Lightbulb className="size-3.5" />} onClick={() => openConcept(c)}>
                        Explain {CONCEPT_INDEX[c].name} again
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[15px] font-semibold text-ink">{progress?.completedAt ? 'Lesson complete' : 'Finished reading?'}</div>
                  <p className="text-[13.5px] text-ink-3">
                    Completing lessons adds coverage. Readiness also needs practice questions and flashcard reviews.
                  </p>
                </div>
                {!progress?.completedAt ? (
                  <Button onClick={() => completeLesson(lesson.id)} icon={<CircleCheck className="size-4" />}>
                    Mark lesson complete
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-700">
                    <CircleCheck className="size-4" aria-hidden="true" /> Completed
                  </span>
                )}
              </div>

              <nav aria-label="Lesson navigation" className="grid gap-3 sm:grid-cols-2">
                {prev ? (
                  <Link to={`/learn/${prev.moduleId}/${prev.id}`} className="group rounded-xl border border-line bg-surface p-4 hover:border-line-strong hover:shadow-card">
                    <span className="flex items-center gap-1 text-xs font-medium text-ink-3">
                      <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
                    </span>
                    <span className="mt-1 block text-[14px] font-semibold text-ink group-hover:text-brand-800">{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link
                    to={`/learn/${next.moduleId}/${next.id}`}
                    className="group rounded-xl border border-brand-200 bg-brand-25 p-4 text-right hover:border-brand-300 hover:shadow-card"
                  >
                    <span className="flex items-center justify-end gap-1 text-xs font-medium text-brand-700">
                      Next {next.moduleId !== ref.moduleId && `· Module ${next.moduleNumber}`} <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-[14px] font-semibold text-ink group-hover:text-brand-800">{next.title}</span>
                  </Link>
                )}
              </nav>
            </section>
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-8 space-y-5">
            <nav aria-label="On this page">
              <div className="mb-2 text-2xs font-semibold tracking-[0.08em] text-ink-4 uppercase">On this page</div>
              <ol className="space-y-0.5 border-l border-line">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={cn(
                        '-ml-px flex items-center justify-between gap-2 border-l-2 py-1 pr-1 pl-3 text-[13px] transition-colors',
                        active === t.id ? 'border-brand-600 font-medium text-ink' : 'border-transparent text-ink-3 hover:text-ink',
                      )}
                    >
                      <span className="truncate">{t.label}</span>
                      {seen.has(t.id) && <CircleCheck className="size-3 shrink-0 text-success-600" aria-label="Seen" />}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {ref.concepts.length > 0 && (
              <Card className="p-4">
                <div className="mb-2 text-2xs font-semibold tracking-[0.08em] text-ink-4 uppercase">Connect a concept</div>
                <ul className="space-y-1">
                  {ref.concepts
                    .filter((c) => CONCEPT_INDEX[c])
                    .map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => openConcept(c)}
                          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] text-ink-2 hover:bg-subtle hover:text-ink"
                        >
                          <AreaChip area={CONCEPT_INDEX[c].area} compact />
                          <span className="truncate">{CONCEPT_INDEX[c].name}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
