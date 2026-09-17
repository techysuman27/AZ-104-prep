import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Network, Search } from 'lucide-react';
import type { AreaId, ExamTier } from '@/content/schema';
import { CONCEPTS } from '@/content/concepts';
import { DOMAIN_INDEX, EXAM_DOMAINS } from '@/content/exam';
import { PageContainer } from '@/components/layout/Page';
import { EmptyState, PageHeader } from '@/components/ui/Card';
import { AreaChip, TierBadge } from '@/components/ui/Badge';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';

const AREAS: { id: AreaId | 'all'; label: string }[] = [
  { id: 'all', label: 'All areas' },
  { id: 'foundations', label: 'Foundations' },
  ...EXAM_DOMAINS.map((d) => ({ id: d.id as AreaId, label: d.shortTitle })),
];

const KIND_LABEL: Record<string, string> = {
  service: 'Service',
  feature: 'Feature',
  resource: 'Resource',
  principle: 'Principle',
  tool: 'Tool',
  role: 'Role',
  setting: 'Setting',
};

export default function ConceptsPage() {
  const [params, setParams] = useSearchParams();
  const area = (params.get('area') as AreaId | 'all' | null) ?? 'all';
  const [tier, setTier] = useState<ExamTier | 'all'>('all');
  const [q, setQ] = useState('');
  const openConcept = useUi((s) => s.openConcept);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CONCEPTS.filter((c) => (area === 'all' || c.area === area) && (tier === 'all' || c.tier === tier))
      .filter((c) => !needle || [c.name, c.summary, ...(c.aliases ?? [])].some((t) => t.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [area, tier, q]);

  const grouped = useMemo(() => {
    const order: AreaId[] = ['foundations', ...EXAM_DOMAINS.map((d) => d.id)];
    return order
      .map((a) => ({ area: a, items: filtered.filter((c) => c.area === a) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Concept library</span>}
        title="Every concept, and how it connects"
        description="Each concept explains what it is, why it exists, when to use it and when not to — and maps its dependencies, security, networking, monitoring and governance connections."
      />

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <span className="sr-only">Filter concepts</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name or alias…"
              className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-[13.5px] text-ink placeholder:text-ink-4 focus-visible:shadow-focus focus-visible:outline-none"
            />
          </label>
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter by area">
            {AREAS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={area === a.id}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (a.id === 'all') next.delete('area');
                  else next.set('area', a.id);
                  setParams(next, { replace: true });
                }}
                className={cn(
                  'h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors',
                  area === a.id ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 lg:ml-auto" role="group" aria-label="Filter by exam importance">
            {(['all', 'must', 'should', 'advanced'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tier === t}
                onClick={() => setTier(t)}
                className={cn(
                  'h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors',
                  tier === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                {t === 'all' ? 'Any tier' : t === 'must' ? 'Must know' : t === 'should' ? 'Should know' : 'Beyond the exam'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 && <EmptyState title="No concepts match" description="Try a different filter or search term." />}

      <div className="space-y-10">
        {grouped.map((g) => (
          <section key={g.area} aria-labelledby={`area-${g.area}`}>
            <h2 id={`area-${g.area}`} className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
              <AreaChip area={g.area} compact />
              {g.area === 'foundations' ? 'Foundations' : DOMAIN_INDEX[g.area].title}
              <span className="text-xs font-normal text-ink-3">· {g.items.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {g.items.map((c) => (
                <li key={c.id} className="group relative">
                  <Link
                    to={`/concepts/${c.id}`}
                    className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
                  >
                    <div className="flex items-center gap-2 pr-8">
                      <TierBadge tier={c.tier} />
                      <span className="text-2xs font-medium text-ink-3">{KIND_LABEL[c.kind]}</span>
                    </div>
                    <div className="mt-2.5 text-[15px] font-semibold text-ink group-hover:text-brand-800">{c.name}</div>
                    <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-3">{c.summary}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => openConcept(c.id)}
                    className="absolute top-3 right-3 grid size-8 place-items-center rounded-lg text-ink-4 hover:bg-subtle hover:text-brand-700"
                    aria-label={`Connect ${c.name}`}
                    title="Connect this concept"
                  >
                    <Network className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
