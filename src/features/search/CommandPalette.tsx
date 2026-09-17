import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import { ArrowRight, Brain, CornerDownLeft, Search, Target, Timer, Wrench } from 'lucide-react';
import { Dialog } from '@/components/ui/Overlay';
import { AreaChip } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Kbd } from '@/components/ui/Card';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LESSON_INDEX } from '@/content/curriculum';
import { useLearner } from '@/store/learner';
import { KIND_LABELS, KIND_ORDER, search, type SearchDoc, type SearchKind } from './searchIndex';

const KIND_ICON: Record<SearchKind, Parameters<typeof Icon>[0]['name']> = {
  concept: 'cloud',
  lesson: 'code',
  problem: 'alert',
  simulator: 'monitor',
  troubleshoot: 'shield',
  lab: 'server',
  architecture: 'region',
  design: 'resource-group',
  skill: 'policy',
  page: 'globe',
};

const SUGGESTIONS = ['Private endpoint', 'NSG priority', 'Soft delete', 'VM can’t reach internet', 'Deployment slots', 'Role assignment scope'];

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const recent = useLearner((s) => s.recent);
  const results = useMemo(() => search(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchDoc[]>();
    for (const r of results) map.set(r.kind, [...(map.get(r.kind) ?? []), r]);
    return KIND_ORDER.filter((k) => map.has(k)).map((k) => ({ kind: k, items: map.get(k)!.slice(0, k === 'concept' || k === 'lesson' ? 6 : 4) }));
  }, [results]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Search Stratus" hideTitle className="top-[8vh] max-w-2xl overflow-hidden p-0">
      <Command shouldFilter={false} label="Search Stratus" className="flex max-h-[76vh] flex-col">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-ink-4" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Search concepts, lessons, problems, labs…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-4 focus:outline-none"
          />
          <Kbd className="mr-8 hidden sm:inline-flex">Esc</Kbd>
        </div>
        <Command.List className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {query.trim() && (
            <Command.Empty className="px-4 py-10 text-center text-sm text-ink-3">
              No results for “{query}”. Try a service name, a setting, or a problem such as “can’t connect”.
            </Command.Empty>
          )}

          {!query.trim() && (
            <>
              <Command.Group heading="Try searching" className="cmdk-group">
                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuery(s)}
                      className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-brand-300 hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Command.Group>
              <Command.Group heading="Quick actions" className="cmdk-group">
                <PaletteItem value="action-practice" onSelect={() => go('/practice')} icon={<Target className="size-4" />} title="Start a practice session" />
                <PaletteItem value="action-review" onSelect={() => go('/review')} icon={<Brain className="size-4" />} title="Review due flashcards" />
                <PaletteItem value="action-exam" onSelect={() => go('/exam')} icon={<Timer className="size-4" />} title="Take a mock exam" />
                <PaletteItem value="action-trouble" onSelect={() => go('/labs#troubleshooting')} icon={<Wrench className="size-4" />} title="Solve a troubleshooting scenario" />
              </Command.Group>
              {recent.length > 0 && (
                <Command.Group heading="Recently viewed" className="cmdk-group">
                  {recent.slice(0, 6).map((r) => {
                    if (r.kind === 'lesson' && LESSON_INDEX[r.id]) {
                      const l = LESSON_INDEX[r.id];
                      return (
                        <PaletteItem
                          key={`${r.kind}-${r.id}`}
                          value={`recent-${r.kind}-${r.id}`}
                          onSelect={() => go(`/learn/${l.moduleId}/${l.id}`)}
                          icon={<Icon name="code" className="size-4" />}
                          title={l.title}
                          subtitle={`Lesson · ${l.moduleTitle}`}
                        />
                      );
                    }
                    if (r.kind === 'concept' && CONCEPT_INDEX[r.id]) {
                      const c = CONCEPT_INDEX[r.id];
                      return (
                        <PaletteItem
                          key={`${r.kind}-${r.id}`}
                          value={`recent-${r.kind}-${r.id}`}
                          onSelect={() => go(`/concepts/${c.id}`)}
                          icon={<AreaChip area={c.area} compact />}
                          title={c.name}
                          subtitle="Concept"
                        />
                      );
                    }
                    return null;
                  })}
                </Command.Group>
              )}
            </>
          )}

          {grouped.map((g) => (
            <Command.Group key={g.kind} heading={KIND_LABELS[g.kind]} className="cmdk-group">
              {g.items.map((doc) => (
                <PaletteItem
                  key={doc.id}
                  value={doc.id}
                  onSelect={() => go(doc.to)}
                  icon={doc.area && g.kind === 'concept' ? <AreaChip area={doc.area} compact /> : <Icon name={KIND_ICON[doc.kind]} className="size-4" />}
                  title={doc.title}
                  subtitle={doc.subtitle}
                />
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <div className="hidden items-center gap-4 border-t border-line bg-subtle/60 px-4 py-2 text-2xs text-ink-3 sm:flex">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>{' '}
            open
          </span>
          <span className="ml-auto">Search by service, setting, skill or problem</span>
        </div>
      </Command>
    </Dialog>
  );
}

function PaletteItem({
  value,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  value: string;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left data-[selected=true]:bg-brand-50"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-3 group-data-[selected=true]:border-brand-150 group-data-[selected=true]:text-brand-700">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">{title}</span>
        {subtitle && <span className="block truncate text-xs text-ink-3">{subtitle}</span>}
      </span>
      <ArrowRight className="size-4 shrink-0 text-transparent group-data-[selected=true]:text-brand-600" aria-hidden="true" />
    </Command.Item>
  );
}
