import { useParams } from 'react-router';
import { CircleCheck, Scale } from 'lucide-react';
import { ARCHITECTURE_INDEX } from '@/content/architectures';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Overlay';
import { FlowDiagram } from '@/components/diagrams/FlowDiagram';
import { InlineText } from '@/components/content/InlineText';
import { ConceptChip } from '@/components/content/ConnectionsPanel';

const ASPECTS = [
  { key: 'security', label: 'Security' },
  { key: 'networking', label: 'Networking' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'governance', label: 'Governance' },
  { key: 'availability', label: 'Availability' },
  { key: 'cost', label: 'Cost' },
] as const;

export default function ArchitecturePage() {
  const { archId = '' } = useParams();
  const arch = ARCHITECTURE_INDEX[archId];

  if (!arch) {
    return (
      <PageContainer>
        <EmptyState title="Architecture not found" action={<LinkButton to="/architectures">Architecture library</LinkButton>} />
      </PageContainer>
    );
  }

  return (
    <PageContainer wide>
      <Breadcrumbs items={[{ label: 'Architecture library', to: '/architectures' }, { label: arch.title }]} />
      <header className="mb-6 max-w-4xl">
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-ink">{arch.title}</h1>
        <p className="mt-1 text-[16px] text-ink-3">{arch.subtitle}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Scenario</div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
              <InlineText text={arch.scenario} />
            </p>
          </Card>

          <FlowDiagram spec={arch.diagram} title="Architecture" alt={`Architecture diagram: ${arch.title}`} />

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Services and why they were chosen</h2>
            <ul className="mt-3 divide-y divide-line">
              {arch.services.map((s) => (
                <li key={s.concept} className="grid gap-2 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                  <div>
                    <ConceptChip id={s.concept} />
                    <div className="mt-1 text-xs text-ink-3">
                      <InlineText text={s.role} />
                    </div>
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink-2">
                    <InlineText text={s.why} />
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <Tabs
              tabs={ASPECTS.map((a) => ({
                value: a.key,
                label: a.label,
                content: (
                  <ul className="space-y-2 pt-4">
                    {arch.aspects[a.key].map((p) => (
                      <li key={p} className="flex gap-2.5 text-[14.5px] leading-relaxed text-ink-2">
                        <CircleCheck className="mt-1 size-4 shrink-0 text-success-600" aria-hidden="true" />
                        <span>
                          <InlineText text={p} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ),
              }))}
            />
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold text-ink">Requirements</h2>
            <ul className="mt-3 space-y-2">
              {arch.requirements.map((r) => (
                <li key={r} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  <InlineText text={r} />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Scale className="size-4 text-ink-3" aria-hidden="true" /> Alternatives and trade-offs
            </h2>
            <ul className="mt-3 space-y-3">
              {arch.alternatives.map((a) => (
                <li key={a.option} className="text-[13.5px] leading-relaxed text-ink-2">
                  <div className="font-semibold text-ink">
                    <InlineText text={a.option} />
                  </div>
                  <InlineText text={a.tradeoff} />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold text-ink">Concepts in this architecture</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {arch.concepts.map((c) => (
                <ConceptChip key={c} id={c} />
              ))}
            </div>
            <div className="mt-4 text-xs text-ink-3">
              {arch.sources
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
        </aside>
      </div>
    </PageContainer>
  );
}
