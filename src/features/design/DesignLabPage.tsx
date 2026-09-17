import { Link } from 'react-router';
import { ArrowRight, CircleCheck, DraftingCompass } from 'lucide-react';
import { DESIGN_CHALLENGES } from '@/content/design';
import { ADMIN_QUESTIONS, ADMIN_QUESTION_ORDER } from '@/content/mindset';
import { PageContainer } from '@/components/layout/Page';
import { EmptyState, PageHeader } from '@/components/ui/Card';
import { AreaChip } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useLearner } from '@/store/learner';

export default function DesignLabPage() {
  const design = useLearner((s) => s.design);
  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Solution design lab</span>}
        title="From business requirements to architecture"
        description="Each challenge describes a real organization. You make the decisions an administrator would make — identity, networking, access, governance, monitoring, backup and cost — and get feedback on every choice before the recommended architecture is revealed."
      />

      <div className="blueprint mb-8 overflow-hidden rounded-2xl px-6 py-5 text-white">
        <div className="flex items-center gap-2 text-2xs font-semibold tracking-wide text-white/60 uppercase">
          <DraftingCompass className="size-3.5" aria-hidden="true" /> The method
        </div>
        <ol className="mt-3 flex flex-wrap gap-2">
          {ADMIN_QUESTION_ORDER.map((q, i) => (
            <li key={q} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12.5px] font-medium text-white/90">
              <span className="text-white/50 tabular">{i + 1}</span>
              <Icon name={ADMIN_QUESTIONS[q].icon} className="size-3.5" />
              {ADMIN_QUESTIONS[q].label}
            </li>
          ))}
        </ol>
      </div>

      {DESIGN_CHALLENGES.length === 0 ? (
        <EmptyState title="Design challenges are being prepared" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {DESIGN_CHALLENGES.map((d) => {
            const r = design[d.id];
            return (
              <li key={d.id}>
                <Link
                  to={`/design/${d.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink-3">{d.company}</span>
                    {r ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-2xs font-semibold text-success-700">
                        <CircleCheck className="size-3" aria-hidden="true" /> Best {Math.round((r.score / r.max) * 100)}%
                      </span>
                    ) : (
                      <span className="text-2xs font-medium text-ink-4">{['', 'Foundation', 'Intermediate', 'Advanced'][d.difficulty]}</span>
                    )}
                  </div>
                  <h2 className="mt-2 text-[17px] font-semibold text-ink group-hover:text-brand-800">{d.title}</h2>
                  <p className="mt-1 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-ink-3">{d.brief}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {d.domains.map((dm) => (
                      <AreaChip key={dm} area={dm} compact />
                    ))}
                    <span className="text-xs text-ink-3">
                      {d.requirements.length} requirements · {d.decisions.length} decisions
                    </span>
                    <ArrowRight className="ml-auto size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
