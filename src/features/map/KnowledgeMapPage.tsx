import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, Route, Search } from 'lucide-react';
import { CONCEPTS, CONCEPT_INDEX, connectionsFor, groupConnections } from '@/content/concepts';
import { DOMAIN_META } from '@/content/exam';
import { PageContainer } from '@/components/layout/Page';
import { PageHeader } from '@/components/ui/Card';
import { AreaChip, TierBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { InlineText } from '@/components/content/InlineText';
import { cn } from '@/lib/cn';
import { ConceptPlace } from '@/features/concepts/ConceptSheet';

const DEFAULT_CONCEPT = 'azure-resource-manager';
const MAX_NEIGHBOURS = 18;

function areaColor(area: string) {
  return area === 'foundations' ? { soft: 'var(--color-design-50)', ink: 'var(--color-design-700)', icon: 'cloud' as const } : { ...DOMAIN_META[area as keyof typeof DOMAIN_META] };
}

export default function KnowledgeMapPage() {
  const { conceptId } = useParams();
  const navigate = useNavigate();
  const id = conceptId && CONCEPT_INDEX[conceptId] ? conceptId : DEFAULT_CONCEPT;
  const concept = CONCEPT_INDEX[id];
  const [trail, setTrail] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setTrail((t) => (t[t.length - 1] === id ? t : [...t.filter((x) => x !== id), id].slice(-8)));
  }, [id]);

  const connections = useMemo(() => (concept ? connectionsFor(id) : []), [id, concept]);
  const neighbours = useMemo(() => {
    const seen = new Map<string, { id: string; groups: string[]; label?: string }>();
    for (const c of connections) {
      const cur = seen.get(c.concept.id);
      if (cur) cur.groups.push(c.group);
      else seen.set(c.concept.id, { id: c.concept.id, groups: [c.group], label: c.label });
    }
    return [...seen.values()];
  }, [connections]);
  const shown = neighbours.slice(0, MAX_NEIGHBOURS);
  const groups = groupConnections(connections);

  const matches = query.trim()
    ? CONCEPTS.filter((c) => [c.name, ...(c.aliases ?? [])].some((n) => n.toLowerCase().includes(query.trim().toLowerCase()))).slice(0, 8)
    : [];

  if (!concept) {
    return (
      <PageContainer>
        <p>Knowledge map is unavailable.</p>
      </PageContainer>
    );
  }

  const size = 620;
  const cx = size / 2;
  const cy = size / 2;
  const radius = shown.length > 10 ? 232 : 205;
  const positions = shown.map((n, i) => {
    const angle = (i / Math.max(shown.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { ...n, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  const centerColor = areaColor(concept.area);

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Knowledge map</span>}
        title="Where does this concept fit inside Azure?"
        description="Every concept sits in a web of dependencies, security controls, networking paths and monitoring. Select any neighbour to move through the map."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-80">
              <label htmlFor="map-search" className="sr-only">
                Jump to a concept
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4" aria-hidden="true" />
              <input
                id="map-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a concept…"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-[14px] text-ink placeholder:text-ink-4 focus-visible:shadow-focus focus-visible:outline-none"
              />
              {matches.length > 0 && (
                <ul className="absolute top-11 right-0 left-0 z-20 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          navigate(`/map/${m.id}`);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-ink-2 hover:bg-subtle hover:text-ink"
                      >
                        <AreaChip area={m.area} compact /> {m.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {trail.length > 1 && (
              <nav aria-label="Exploration trail" className="scrollbar-thin flex min-w-0 items-center gap-1 overflow-x-auto text-xs text-ink-3">
                <Route className="size-3.5 shrink-0" aria-hidden="true" />
                {trail.map((t, i) => (
                  <span key={t} className="inline-flex shrink-0 items-center gap-1">
                    {i > 0 && <ArrowRight className="size-3 text-ink-4" aria-hidden="true" />}
                    <Link to={`/map/${t}`} className={cn('rounded px-1 py-0.5 hover:bg-subtle', t === id && 'font-semibold text-ink')}>
                      {CONCEPT_INDEX[t]?.name}
                    </Link>
                  </span>
                ))}
              </nav>
            )}
          </div>

          <div className="diagram-grid overflow-hidden rounded-2xl border border-line">
            <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[720px]" role="img" aria-label={`${concept.name} and ${neighbours.length} connected concepts`}>
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-line-strong)" strokeDasharray="3 6" />
              {positions.map((p) => (
                <line
                  key={`l-${p.id}`}
                  x1={cx}
                  y1={cy}
                  x2={p.x}
                  y2={p.y}
                  stroke={hovered === p.id ? 'var(--color-brand-500)' : 'var(--color-line-strong)'}
                  strokeWidth={hovered === p.id ? 2.2 : 1.2}
                  className="transition-all duration-200"
                />
              ))}
              <g key={id} className="animate-pop-in" style={{ transformOrigin: `${cx}px ${cy}px` }}>
                <circle cx={cx} cy={cy} r={62} fill="var(--color-surface)" stroke="var(--color-brand-500)" strokeWidth={2.5} />
                <circle cx={cx} cy={cy} r={70} fill="none" stroke="var(--color-brand-150)" strokeWidth={6} />
                <foreignObject x={cx - 58} y={cy - 40} width={116} height={80}>
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="grid size-7 place-items-center rounded-lg" style={{ background: centerColor.soft, color: centerColor.ink }}>
                      <Icon name={centerColor.icon} className="size-4" />
                    </span>
                    <span className="mt-1 line-clamp-2 text-[11.5px] leading-tight font-semibold text-ink">{concept.name}</span>
                  </div>
                </foreignObject>
              </g>
              {positions.map((p, i) => {
                const c = CONCEPT_INDEX[p.id];
                const col = areaColor(c.area);
                const w = 128;
                const h = 50;
                return (
                  <g key={`${id}-${p.id}`} className="animate-fade-in" style={{ animationDelay: `${i * 25}ms` }}>
                    <foreignObject x={p.x - w / 2} y={p.y - h / 2} width={w} height={h}>
                      <Link
                        to={`/map/${p.id}`}
                        onMouseEnter={() => setHovered(p.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(p.id)}
                        onBlur={() => setHovered(null)}
                        title={`${p.groups.join(', ')}${p.label ? ` — ${p.label}` : ''}`}
                        className="flex h-full items-center gap-1.5 rounded-xl border border-line bg-surface px-2 shadow-xs transition-all hover:border-brand-400 hover:shadow-raised focus-visible:shadow-focus"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-md" style={{ background: col.soft, color: col.ink }}>
                          <Icon name={col.icon} className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 block text-[10.5px] leading-tight font-semibold text-ink">{c.name}</span>
                          <span className="block truncate text-[9px] leading-tight text-ink-3">{p.groups[0]}</span>
                        </span>
                      </Link>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
            {neighbours.length > MAX_NEIGHBOURS && (
              <p className="border-t border-line bg-surface px-4 py-2 text-xs text-ink-3">
                Showing {MAX_NEIGHBOURS} of {neighbours.length} connections. The full list is in the panel.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <AreaChip area={concept.area} />
              <TierBadge tier={concept.tier} />
            </div>
            <h2 className="mt-2 text-[20px] font-semibold text-ink">{concept.name}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={concept.summary} />
            </p>
            {concept.place && concept.place.length > 0 && (
              <div className="mt-3">
                <ConceptPlace conceptId={concept.id} />
              </div>
            )}
            <Link to={`/concepts/${concept.id}`} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
              Open concept page <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="text-[14px] font-semibold text-ink">All connections</h3>
            <div className="mt-3 space-y-4">
              {groups.map((g) => (
                <div key={g.group}>
                  <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">{g.group}</div>
                  <ul className="mt-1.5 space-y-1">
                    {g.items.map((it) => (
                      <li key={`${g.group}-${it.concept.id}`}>
                        <Link to={`/map/${it.concept.id}`} className="group block rounded-lg px-2 py-1.5 hover:bg-subtle">
                          <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink-2 group-hover:text-ink">
                            <AreaChip area={it.concept.area} compact /> {it.concept.name}
                          </span>
                          {it.label && <span className="mt-0.5 block pl-7 text-xs leading-snug text-ink-3">{it.label}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {groups.length === 0 && <p className="text-[13px] text-ink-3">No connections recorded yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
