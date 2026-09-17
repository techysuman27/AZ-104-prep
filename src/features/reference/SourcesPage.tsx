import { BadgeCheck, BookOpen, CircleX, ExternalLink, RefreshCw, ScanSearch, ShieldCheck } from 'lucide-react';
import { SOURCE_LIST } from '@/content/sources';
import { LESSONS } from '@/content/curriculum';
import { CONCEPTS } from '@/content/concepts';
import { QUESTIONS } from '@/content/questions';
import { EXAM_META } from '@/content/exam';
import { PageContainer } from '@/components/layout/Page';
import { Card, PageHeader } from '@/components/ui/Card';
import { TierBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';

const PRINCIPLES = [
  {
    icon: BookOpen,
    title: 'Official documentation is the authority',
    text: 'Every fact is checked against the current AZ-104 study guide and Microsoft Learn. Third-party material can help explain an idea but never overrides Microsoft documentation.',
  },
  {
    icon: CircleX,
    title: 'Nothing invented',
    text: 'Stratus does not invent features, portal settings, CLI parameters, limits, prices or exam objectives. If a detail cannot be verified, it is left out rather than presented as fact.',
  },
  {
    icon: RefreshCw,
    title: 'Current, not historical',
    text: 'Retired and renamed features are called out with “Previously / Now / What matters for AZ-104” notes instead of being taught as current.',
  },
  {
    icon: ScanSearch,
    title: 'Traceable',
    text: 'Lessons, concepts, questions and labs record the sources they were verified against and the date of verification, so reviews can target exactly what a documentation change affects.',
  },
];

const WORKFLOW = [
  'Check the AZ-104 study guide for outline changes (skills added, removed or reworded).',
  'Review Azure Updates and the “What’s new” pages for retirements and renames in exam services.',
  'Re-verify every source whose Microsoft Learn update date is newer than its last verification.',
  'Update affected lessons, questions and flashcards together; add change notes for anything learners may have seen in older material.',
  'Run the automated content checks (every reference resolves, every question explains every option, every lesson has sources) before publishing.',
];

export default function SourcesPage() {
  const byPublisher = SOURCE_LIST.slice().sort((a, b) => a.title.localeCompare(b.title));
  const lastVerified = SOURCE_LIST.reduce((m, s) => (s.verified > m ? s.verified : m), '0000-00-00');

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Sources &amp; freshness</span>}
        title="How Stratus keeps content accurate"
        description={`Accuracy comes first. All content was last verified on ${formatDate(lastVerified)} against the ${EXAM_META.code} skills outline dated ${formatDate(EXAM_META.skillsAsOf)} and current Microsoft Learn documentation.`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <Card key={p.title} className="p-5">
            <p.icon className="size-5 text-brand-600" aria-hidden="true" />
            <h2 className="mt-3 text-[15px] font-semibold text-ink">{p.title}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{p.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <ShieldCheck className="size-4 text-success-600" aria-hidden="true" /> Content review workflow
          </h2>
          <ol className="mt-3 space-y-2.5">
            {WORKFLOW.map((w, i) => (
              <li key={w} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 tabular">{i + 1}</span>
                {w}
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Exam importance tiers</h2>
          <ul className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-ink-2">
            <li>
              <TierBadge tier="must" />
              <p className="mt-1">Directly tested and critical. Master these first.</p>
            </li>
            <li>
              <TierBadge tier="should" />
              <p className="mt-1">Supporting knowledge that makes must-know topics make sense and appears in scenarios.</p>
            </li>
            <li>
              <TierBadge tier="advanced" />
              <p className="mt-1">Real-world depth beyond the core exam. Useful on the job; optional for the exam.</p>
            </li>
          </ul>
          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <div>
              <dt className="text-2xs text-ink-3">Lessons</dt>
              <dd className="text-[17px] font-semibold text-ink tabular">{LESSONS.length}</dd>
            </div>
            <div>
              <dt className="text-2xs text-ink-3">Concepts</dt>
              <dd className="text-[17px] font-semibold text-ink tabular">{CONCEPTS.length}</dd>
            </div>
            <div>
              <dt className="text-2xs text-ink-3">Questions</dt>
              <dd className="text-[17px] font-semibold text-ink tabular">{QUESTIONS.length}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <BadgeCheck className="size-4 text-success-600" aria-hidden="true" /> Verified sources ({SOURCE_LIST.length})
          </h2>
          <span className="text-xs text-ink-3">“Page updated” is the date shown in the Microsoft Learn page metadata.</span>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="bg-subtle/60 text-2xs tracking-wide text-ink-3 uppercase">
              <tr>
                <th className="px-5 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">Page updated</th>
                <th className="px-5 py-2 font-semibold whitespace-nowrap">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {byPublisher.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-2">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                      {s.title} <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                    <div className="text-2xs text-ink-4">{s.publisher}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-3 tabular">{s.pageUpdated ? formatDate(s.pageUpdated) : '—'}</td>
                  <td className="px-5 py-2 whitespace-nowrap text-ink-3 tabular">{formatDate(s.verified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
