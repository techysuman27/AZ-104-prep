import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ExternalLink, Target } from 'lucide-react';
import { EXAM_DOMAINS, EXAM_META, PLATFORM_CHANGES, DOMAIN_META } from '@/content/exam';
import { LESSONS } from '@/content/curriculum';
import { QUESTIONS } from '@/content/questions';
import { SOURCES } from '@/content/sources';
import { PageContainer } from '@/components/layout/Page';
import { Card, PageHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ChangeNoteCard } from '@/components/content/Blocks';
import { useMastery } from '@/features/dashboard/useReadiness';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

const STATE_LABEL: Record<string, { label: string; cls: string }> = {
  unseen: { label: 'Not practised', cls: 'bg-subtle text-ink-3' },
  learning: { label: 'Learning', cls: 'bg-brand-50 text-brand-800' },
  practicing: { label: 'Practising', cls: 'bg-brand-100 text-brand-800' },
  strong: { label: 'Strong', cls: 'bg-brand-600 text-white' },
  mastered: { label: 'Mastered', cls: 'bg-brand-800 text-white' },
};

export default function SkillsPage() {
  const { hash } = useLocation();
  const mastery = useMastery();
  const source = SOURCES[EXAM_META.sourceId];

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('ring-2', 'ring-brand-300');
      const t = window.setTimeout(() => el.classList.remove('ring-2', 'ring-brand-300'), 2200);
      return () => window.clearTimeout(t);
    }
  }, [hash]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Exam skills outline</span>}
        title={`${EXAM_META.code}: ${EXAM_META.title}`}
        description={`The official skills measured as of ${formatDate(EXAM_META.skillsAsOf)}, reproduced verbatim and mapped to Stratus lessons and practice questions.`}
        actions={
          source && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink-2 hover:bg-subtle"
            >
              Official study guide <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )
        }
      />

      <div className="space-y-8">
        {EXAM_DOMAINS.map((d) => {
          const meta = DOMAIN_META[d.id];
          return (
            <section key={d.id} aria-labelledby={`domain-${d.id}`}>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl" style={{ background: meta.soft, color: meta.ink }}>
                  <Icon name={meta.icon} className="size-5" />
                </span>
                <h2 id={`domain-${d.id}`} className="text-[18px] font-semibold text-ink">
                  {d.title}
                </h2>
                <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white tabular">
                  {d.weight.min}–{d.weight.max}%
                </span>
              </div>
              <div className="space-y-4">
                {d.groups.map((g) => (
                  <Card key={g.id} className="overflow-hidden">
                    <h3 className="border-b border-line bg-subtle/60 px-5 py-2.5 text-[14px] font-semibold text-ink">{g.title}</h3>
                    <ul className="divide-y divide-line">
                      {g.skills.map((s) => {
                        const lessons = LESSONS.filter((l) => l.skills.includes(s.id));
                        const qCount = QUESTIONS.filter((q) => q.skills.includes(s.id)).length;
                        const stat = mastery.skills[s.id];
                        const st = STATE_LABEL[stat?.state ?? 'unseen'];
                        return (
                          <li key={s.id} id={s.id} className="scroll-mt-24 rounded-md px-5 py-3 transition-shadow">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="text-[14.5px] font-medium text-ink">{s.text}</div>
                                {lessons.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                    {lessons.map((l) => (
                                      <Link key={l.id} to={`/learn/${l.moduleId}/${l.id}`} className="text-[12.5px] text-brand-700 hover:underline">
                                        {l.title}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className={cn('rounded-md px-1.5 py-0.5 text-2xs font-semibold', st.cls)}>{st.label}</span>
                                {qCount > 0 && (
                                  <Link
                                    to={`/practice?skill=${s.id}`}
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line px-2 text-2xs font-semibold text-ink-2 hover:border-brand-300 hover:text-ink"
                                  >
                                    <Target className="size-3" aria-hidden="true" /> {qCount} questions
                                  </Link>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        <section aria-labelledby="changes-h">
          <h2 id="changes-h" className="text-[18px] font-semibold text-ink">
            What changed — and what older material gets wrong
          </h2>
          <p className="mt-1 mb-4 text-[14px] text-ink-3">Outline updates and Azure platform changes, each verified against Microsoft documentation.</p>
          <div className="space-y-3">
            {PLATFORM_CHANGES.map((c) => (
              <div key={c.topic}>
                <ChangeNoteCard note={c} />
                {SOURCES[c.sourceId] && (
                  <a href={SOURCES[c.sourceId].url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-2xs text-brand-700 hover:underline">
                    Source: {SOURCES[c.sourceId].title}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
