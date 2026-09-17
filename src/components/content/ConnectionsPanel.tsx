import { Link } from 'react-router';
import { Coins, Orbit, Wrench } from 'lucide-react';
import { CONCEPT_INDEX, connectionsFor, groupConnections } from '@/content/concepts';
import { AreaChip } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';
import { InlineText } from './InlineText';

const GROUP_ICON: Record<string, Parameters<typeof Icon>[0]['name']> = {
  'Depends on': 'route',
  'Required by': 'route',
  'Part of': 'resource-group',
  Contains: 'resource-group',
  'Integrates with': 'peering',
  'Security & access': 'shield',
  Networking: 'vnet',
  Monitoring: 'monitor',
  Governance: 'policy',
  Alternatives: 'app-gateway',
};

export function ConceptChip({ id, note, className }: { id: string; note?: string; className?: string }) {
  const openConcept = useUi((s) => s.openConcept);
  const c = CONCEPT_INDEX[id];
  if (!c) return null;
  return (
    <button
      type="button"
      onClick={() => openConcept(id)}
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-left text-[13px] font-medium text-ink-2 transition-all hover:-translate-y-px hover:border-brand-300 hover:text-ink hover:shadow-xs',
        className,
      )}
      title={note ? `${c.name}: ${note}` : c.summary}
    >
      <AreaChip area={c.area} compact />
      <span className="truncate">{c.name}</span>
    </button>
  );
}

export function ConnectionsPanel({ conceptId, compact }: { conceptId: string; compact?: boolean }) {
  const concept = CONCEPT_INDEX[conceptId];
  if (!concept) return null;
  const groups = groupConnections(connectionsFor(conceptId));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Azure connections</div>
            <div className="text-[15px] font-semibold text-ink">How {concept.name} fits with everything else</div>
          </div>
          <Link to={`/map/${conceptId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
            <Orbit className="size-3.5" aria-hidden="true" /> Open in knowledge map
          </Link>
        </div>
      )}
      <div className="grid gap-px bg-line sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.group} className="bg-surface px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-ink-3 uppercase">
              <Icon name={GROUP_ICON[g.group] ?? 'peering'} className="size-3.5" />
              {g.group}
            </div>
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <li key={it.concept.id} className="flex flex-col gap-0.5">
                  <ConceptChip id={it.concept.id} note={it.label} className="self-start" />
                  {it.label && <span className="pl-1 text-xs leading-snug text-ink-3">{it.label}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {concept.cost && concept.cost.length > 0 && (
          <div className="bg-surface px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-ink-3 uppercase">
              <Coins className="size-3.5" aria-hidden="true" /> Cost
            </div>
            <ul className="space-y-1.5">
              {concept.cost.map((c) => (
                <li key={c} className="text-[13px] leading-snug text-ink-2">
                  <InlineText text={c} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {concept.troubleshooting && concept.troubleshooting.length > 0 && (
          <div className="bg-surface px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-ink-3 uppercase">
              <Wrench className="size-3.5" aria-hidden="true" /> Troubleshooting
            </div>
            <ul className="space-y-1.5">
              {concept.troubleshooting.map((t) => (
                <li key={t} className="text-[13px] leading-snug text-ink-2">
                  <InlineText text={t} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {groups.length % 2 === 1 && !(concept.cost?.length || concept.troubleshooting?.length) && <div className="hidden bg-surface sm:block" />}
      </div>
    </div>
  );
}
