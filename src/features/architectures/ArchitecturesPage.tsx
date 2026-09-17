import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { ARCHITECTURES } from '@/content/architectures';
import { CONCEPT_INDEX } from '@/content/concepts';
import { PageContainer } from '@/components/layout/Page';
import { EmptyState, PageHeader } from '@/components/ui/Card';
import { FlowDiagram } from '@/components/diagrams/FlowDiagram';

export default function ArchitecturesPage() {
  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Architecture library</span>}
        title="Reference architectures, explained"
        description="Common Azure solutions an administrator builds and supports — with the services used and why, plus the security, networking, monitoring, governance, availability and cost decisions behind them."
      />
      {ARCHITECTURES.length === 0 ? (
        <EmptyState title="Architectures are being prepared" />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {ARCHITECTURES.map((a) => (
            <li key={a.id}>
              <Link
                to={`/architectures/${a.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
              >
                <div className="pointer-events-none max-h-[240px] overflow-hidden border-b border-line" aria-hidden="true">
                  <div className="origin-top scale-[0.8]">
                    <FlowDiagram spec={a.diagram} alt="" compact className="rounded-none border-0" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[17px] font-semibold text-ink group-hover:text-brand-800">{a.title}</h2>
                  <p className="mt-1 flex-1 text-[13.5px] leading-relaxed text-ink-3">{a.subtitle}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {a.services.slice(0, 5).map((s) => (
                      <span key={s.concept} className="rounded-md bg-subtle px-1.5 py-0.5 text-2xs font-medium text-ink-2">
                        {CONCEPT_INDEX[s.concept]?.name ?? s.concept}
                      </span>
                    ))}
                    <ArrowRight className="ml-auto size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
