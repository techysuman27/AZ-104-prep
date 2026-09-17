import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ListTree, Pause, Play, RotateCcw, X } from 'lucide-react';
import type { DiagramEdge, DiagramFlow, DiagramGroup, DiagramNode, DiagramSpec } from '@/content/schema';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { CONCEPT_INDEX } from '@/content/concepts';
import { useUi } from '@/store/ui';
import { InlineText } from '@/components/content/InlineText';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GROUP_STYLE: Record<DiagramGroup['kind'], { box: string; label: string; icon?: Parameters<typeof Icon>[0]['name'] }> = {
  region: { box: 'border border-dashed border-ink-4/60 bg-transparent', label: 'text-ink-3', icon: 'region' },
  zone: { box: 'border border-dashed border-line-strong bg-subtle/40', label: 'text-ink-3', icon: 'zone' },
  vnet: {
    box: 'border-[1.5px] border-[color:var(--color-networking)]/55 bg-[color:var(--color-networking-soft)]/45',
    label: 'text-[color:var(--color-networking-ink)]',
    icon: 'vnet',
  },
  subnet: {
    box: 'border border-dashed border-[color:var(--color-networking)]/45 bg-surface/85',
    label: 'text-[color:var(--color-networking-ink)]',
    icon: 'subnet',
  },
  rg: { box: 'border border-dashed border-line-strong bg-surface/70', label: 'text-ink-3', icon: 'resource-group' },
  subscription: { box: 'border border-brand-200 bg-brand-25', label: 'text-brand-800', icon: 'subscription' },
  boundary: { box: 'border-[1.5px] border-dashed border-design-500/50 bg-design-50/50', label: 'text-design-700', icon: 'shield' },
  onprem: { box: 'border border-ink-4/50 bg-subtle', label: 'text-ink-2', icon: 'onprem' },
  plain: { box: 'border border-transparent', label: 'text-ink-3' },
  hierarchy: { box: 'border border-transparent', label: 'text-ink-3' },
};

const NODE_TONE: Record<NonNullable<DiagramNode['tone']>, string> = {
  default: 'border-line bg-surface',
  muted: 'border-dashed border-line-strong bg-surface/70 opacity-70',
  good: 'border-success-500/60 bg-success-50 ring-2 ring-success-100',
  bad: 'border-danger-500/60 bg-danger-50 ring-2 ring-danger-100',
  warn: 'border-warning-500/70 bg-warning-50 ring-2 ring-warning-100',
  accent: 'border-brand-400 bg-brand-50 ring-2 ring-brand-100',
};

const EDGE_COLOR: Record<NonNullable<DiagramEdge['tone']>, string> = {
  default: 'var(--color-ink-4)',
  allow: 'var(--color-success-600)',
  deny: 'var(--color-danger-500)',
  data: 'var(--color-brand-500)',
  muted: 'var(--color-line-strong)',
};

function anchorPath(a: Rect, b: Rect) {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;
  // Prefer horizontal connections when boxes don't overlap horizontally.
  const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
  if (!overlapX || Math.abs(dx) > Math.abs(dy) * 1.6) {
    const sx = dx > 0 ? a.x + a.w : a.x;
    const ex = dx > 0 ? b.x : b.x + b.w;
    const sy = acy;
    const ey = bcy;
    const mx = (sx + ex) / 2;
    return { d: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`, mid: { x: mx, y: (sy + ey) / 2 } };
  }
  const sy = dy > 0 ? a.y + a.h : a.y;
  const ey = dy > 0 ? b.y : b.y + b.h;
  const sx = acx;
  const ex = bcx;
  const my = (sy + ey) / 2;
  return { d: `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`, mid: { x: (sx + ex) / 2, y: my } };
}

type Item = DiagramNode | DiagramGroup;

function indexItems(root: DiagramGroup): Record<string, Item> {
  const out: Record<string, Item> = {};
  const walk = (it: Item) => {
    out[it.id] = it;
    if (it.type === 'group') it.children.forEach(walk);
  };
  walk(root);
  return out;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export interface FlowDiagramProps {
  spec: DiagramSpec;
  title?: string;
  caption?: string;
  alt: string;
  className?: string;
  /** Node/group ids to emphasise (e.g. from a simulator). */
  highlight?: string[];
  /** Hide flow controls (used for thumbnails). */
  compact?: boolean;
  onSelect?: (id: string) => void;
}

export function FlowDiagram({ spec, title, caption, alt, className, highlight, compact, onSelect }: FlowDiagramProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [textView, setTextView] = useState(false);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();
  const openConcept = useUi((s) => s.openConcept);
  const items = useMemo(() => indexItems(spec.root), [spec]);

  const measure = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const next: Record<string, Rect> = {};
    el.querySelectorAll<HTMLElement>('[data-diagram-id]').forEach((n) => {
      const r = n.getBoundingClientRect();
      next[n.dataset.diagramId!] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    });
    setRects(next);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    document.fonts?.ready.then(() => measure()).catch(() => undefined);
    return () => ro.disconnect();
  }, [measure, spec, textView]);

  const flow: DiagramFlow | undefined = spec.flows?.find((f) => f.id === flowId);

  useEffect(() => {
    if (!flow || !playing) return;
    if (step >= flow.path.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), reduced ? 250 : 950);
    return () => window.clearTimeout(t);
  }, [flow, playing, step, reduced]);

  const startFlow = (id: string) => {
    setFlowId(id);
    setStep(0);
    setPlaying(true);
  };

  const activeNodes = new Set<string>(highlight ?? []);
  if (flow) flow.path.slice(0, step + 1).forEach((id) => activeNodes.add(id));
  const flowDone = !!flow && step >= flow.path.length - 1;

  const select = (id: string) => {
    setSelected((cur) => (cur === id ? null : id));
    onSelect?.(id);
  };

  const renderNode = (n: DiagramNode) => {
    const interactive = !!(n.detail || n.concept);
    const active = activeNodes.has(n.id);
    const isCurrent = flow && flow.path[step] === n.id;
    const Comp = interactive ? 'button' : 'div';
    return (
      <Comp
        key={n.id}
        data-diagram-id={n.id}
        {...(interactive ? { type: 'button' as const, onClick: () => select(n.id), 'aria-pressed': selected === n.id } : {})}
        className={cn(
          'relative flex min-w-[112px] max-w-[190px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left shadow-xs transition-[box-shadow,border-color,background-color,transform] duration-300',
          NODE_TONE[n.tone ?? 'default'],
          interactive && 'hover:-translate-y-px hover:border-line-strong hover:shadow-raised focus-visible:shadow-focus',
          selected === n.id && 'border-brand-500 ring-2 ring-brand-150',
          active && 'border-brand-500 ring-2 ring-brand-150',
          isCurrent && !reduced && 'animate-ping-soft',
        )}
      >
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg',
            n.tone === 'bad'
              ? 'bg-danger-100 text-danger-700'
              : n.tone === 'good'
                ? 'bg-success-100 text-success-700'
                : n.tone === 'warn'
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-subtle text-ink-2',
          )}
        >
          <Icon name={n.icon} className="size-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[12.5px] leading-tight font-semibold text-ink">{n.label}</span>
          {n.sub && <span className="mt-0.5 block text-2xs leading-tight text-ink-3">{n.sub}</span>}
        </span>
      </Comp>
    );
  };

  const renderGroup = (g: DiagramGroup, depth: number): React.ReactNode => {
    const style = GROUP_STYLE[g.kind];
    const interactive = !!(g.detail || g.concept);
    const showLabel = g.kind !== 'plain' && g.kind !== 'hierarchy';
    const dir = g.direction ?? (g.kind === 'hierarchy' ? 'col' : 'row');
    return (
      <div
        key={g.id}
        data-diagram-id={g.id}
        className={cn(
          'relative rounded-2xl',
          showLabel ? 'px-3.5 pt-2.5 pb-3.5' : 'p-0',
          style.box,
          (selected === g.id || activeNodes.has(g.id)) && 'ring-2 ring-brand-150',
        )}
      >
        {showLabel && (
          <div className="mb-2.5 flex items-center gap-1.5">
            {style.icon && <Icon name={style.icon} className={cn('size-3.5', style.label)} />}
            {interactive ? (
              <button
                type="button"
                onClick={() => select(g.id)}
                className={cn('text-2xs font-semibold tracking-wide uppercase underline decoration-dotted underline-offset-2', style.label)}
              >
                {g.label}
              </button>
            ) : (
              <span className={cn('text-2xs font-semibold tracking-wide uppercase', style.label)}>{g.label}</span>
            )}
            {g.sub && <span className="text-2xs text-ink-3">· {g.sub}</span>}
          </div>
        )}
        <div
          className={cn(
            'flex',
            dir === 'col' ? 'flex-col items-center gap-7' : 'flex-row items-center justify-center gap-6',
            depth === 0 && !showLabel && 'gap-10',
          )}
        >
          {g.children.map((c) => (c.type === 'group' ? renderGroup(c, depth + 1) : renderNode(c)))}
        </div>
      </div>
    );
  };

  const edgePaths = spec.edges
    .map((e, i) => {
      const a = rects[e.from];
      const b = rects[e.to];
      if (!a || !b) return null;
      const p = anchorPath(a, b);
      const inFlow = flow
        ? flow.path.some(
            (id, k) =>
              k > 0 &&
              k <= step &&
              ((flow.path[k - 1] === e.from && id === e.to) || (flow.path[k - 1] === e.to && id === e.from)),
          )
        : false;
      return { e, i, ...p, inFlow };
    })
    .filter(Boolean) as ({ e: DiagramEdge; i: number; d: string; mid: { x: number; y: number }; inFlow: boolean })[];

  // Hops in a flow that have no declared edge get a temporary connector.
  const flowHops =
    flow && step > 0
      ? flow.path.slice(1, step + 1).map((to, k) => {
          const from = flow.path[k];
          const a = rects[from];
          const b = rects[to];
          if (!a || !b) return null;
          return { from, to, ...anchorPath(a, b), current: k === step - 1 };
        })
      : [];

  const flowTone = flow?.tone ?? 'data';
  const selectedItem = selected ? items[selected] : undefined;
  const selectedConcept = selectedItem?.concept ? CONCEPT_INDEX[selectedItem.concept] : undefined;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <figure className={cn('overflow-hidden rounded-2xl border border-line bg-surface', className)} aria-label={title ?? alt}>
      {(title || !compact) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div className="text-[13px] font-semibold text-ink">{title ?? 'Diagram'}</div>
          <button
            type="button"
            onClick={() => setTextView((v) => !v)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-3 hover:bg-subtle hover:text-ink"
            aria-pressed={textView}
          >
            <ListTree className="size-3.5" aria-hidden="true" />
            {textView ? 'Show diagram' : 'Text view'}
          </button>
        </div>
      )}

      <p className="sr-only">{alt}</p>

      {textView ? (
        <DiagramTextView spec={spec} items={items} />
      ) : (
        <div className="diagram-grid scrollbar-thin overflow-x-auto">
          <div className="flex min-w-fit justify-center p-5 sm:p-7">
            <div ref={innerRef} className="relative">
              {renderGroup(spec.root, 0)}
              <svg
                className="pointer-events-none absolute top-0 left-0 overflow-visible"
                width={size.w}
                height={size.h}
                aria-hidden="true"
              >
                <defs>
                  {(['default', 'allow', 'deny', 'data', 'muted'] as const).map((tone) => (
                    <marker
                      key={tone}
                      id={`arrow-${tone}-${uid}`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOR[tone]} />
                    </marker>
                  ))}
                </defs>
                {edgePaths.map(({ e, i, d, inFlow }) => {
                  const tone = inFlow ? flowTone : (e.tone ?? 'default');
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke={EDGE_COLOR[tone]}
                      strokeWidth={inFlow ? 2.5 : 1.6}
                      strokeDasharray={e.style === 'dashed' || tone === 'muted' ? '5 5' : inFlow && !reduced ? '6 6' : undefined}
                      className={cn(inFlow && !reduced && 'animate-dash')}
                      markerEnd={`url(#arrow-${tone}-${uid})`}
                      markerStart={e.both ? `url(#arrow-${tone}-${uid})` : undefined}
                    />
                  );
                })}
                {flowHops.map((h) =>
                  h && !spec.edges.some((e) => (e.from === h.from && e.to === h.to) || (e.from === h.to && e.to === h.from)) ? (
                    <path
                      key={`${h.from}-${h.to}`}
                      d={h.d}
                      fill="none"
                      stroke={EDGE_COLOR[flowTone]}
                      strokeWidth={2.5}
                      strokeDasharray="6 6"
                      className={cn(!reduced && 'animate-dash')}
                      markerEnd={`url(#arrow-${flowTone}-${uid})`}
                    />
                  ) : null,
                )}
              </svg>
              {edgePaths
                .filter((p) => p.e.label)
                .map(({ e, i, mid }) => (
                  <span
                    key={`l${i}`}
                    className={cn(
                      'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border bg-surface px-1.5 py-0.5 text-[10.5px] leading-none font-medium whitespace-nowrap shadow-xs',
                      e.tone === 'deny'
                        ? 'border-danger-100 text-danger-700'
                        : e.tone === 'allow'
                          ? 'border-success-100 text-success-700'
                          : 'border-line text-ink-3',
                    )}
                    style={{ left: mid.x, top: mid.y }}
                  >
                    {e.tone === 'deny' && <X className="mr-0.5 inline size-2.5 align-[-1px]" aria-hidden="true" />}
                    {e.label}
                  </span>
                ))}
              {flow &&
                !reduced &&
                flowHops.map((h) =>
                  h && h.current ? (
                    <span
                      key={`packet-${step}`}
                      className={cn(
                        'pointer-events-none absolute top-0 left-0 size-3 rounded-full border-2 border-white shadow-raised',
                        flowTone === 'deny' ? 'bg-danger-500' : flowTone === 'allow' ? 'bg-success-600' : 'bg-brand-500',
                      )}
                      style={
                        {
                          offsetPath: `path('${h.d}')`,
                          offsetRotate: '0deg',
                          animation: 'packet-move 900ms cubic-bezier(0.45, 0, 0.2, 1) forwards',
                        } as CSSProperties
                      }
                    />
                  ) : null,
                )}
            </div>
          </div>
        </div>
      )}

      {!compact && spec.flows && spec.flows.length > 0 && !textView && (
        <div className="border-t border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Trace a flow</span>
            {spec.flows.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => startFlow(f.id)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                  flowId === f.id ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                {flowId === f.id && playing ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
                {f.label}
              </button>
            ))}
            {flow && (
              <button
                type="button"
                onClick={() => startFlow(flow.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-3 hover:bg-subtle hover:text-ink"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Replay
              </button>
            )}
          </div>
          {flow && (
            <div className="mt-2.5 animate-fade-in text-[13px] text-ink-2" aria-live="polite">
              <span className="font-medium text-ink">
                {flow.path
                  .slice(0, step + 1)
                  .map((id) => items[id]?.label ?? id)
                  .join(' → ')}
              </span>
              {flowDone && flow.description && (
                <p
                  className={cn(
                    'mt-1.5 rounded-lg px-3 py-2',
                    flow.tone === 'deny' ? 'bg-danger-50 text-danger-700' : flow.tone === 'allow' ? 'bg-success-50 text-success-700' : 'bg-brand-50 text-brand-800',
                  )}
                >
                  <InlineText text={flow.description} />
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {selectedItem && (selectedItem.detail || selectedConcept) && !textView && (
        <div className="animate-fade-in border-t border-line bg-subtle/60 px-4 py-3" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink">{selectedItem.label}</div>
              {selectedItem.detail && (
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  <InlineText text={selectedItem.detail} />
                </p>
              )}
              {selectedConcept && (
                <button
                  type="button"
                  onClick={() => openConcept(selectedConcept.id)}
                  className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
                >
                  How {selectedConcept.name} connects →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-muted"
              aria-label="Close details"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {caption && (
        <figcaption className="border-t border-line px-4 py-2.5 text-xs leading-relaxed text-ink-3">
          <InlineText text={caption} />
        </figcaption>
      )}
      {!compact && !caption && (Object.values(items).some((i) => i.detail || i.concept) || spec.flows?.length) && !textView ? (
        <div className="border-t border-line px-4 py-2 text-2xs text-ink-4">Select any highlighted element to explore it.</div>
      ) : null}
    </figure>
  );
}

function DiagramTextView({ spec, items }: { spec: DiagramSpec; items: Record<string, Item> }) {
  const renderItem = (it: Item, depth: number): React.ReactNode => (
    <li key={it.id} className="mt-1">
      <span className="font-medium text-ink">{it.label}</span>
      {it.sub && <span className="text-ink-3"> — {it.sub}</span>}
      {it.type === 'group' && <span className="text-ink-4"> ({it.kind})</span>}
      {it.detail && <div className="text-ink-3">{it.detail}</div>}
      {it.type === 'group' && it.children.length > 0 && (
        <ul className={cn('border-l border-line pl-4', depth > 6 && 'pl-2')}>{it.children.map((c) => renderItem(c, depth + 1))}</ul>
      )}
    </li>
  );
  return (
    <div className="grid gap-5 px-5 py-4 text-[13px] md:grid-cols-2">
      <div>
        <div className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Components</div>
        <ul>{renderItem(spec.root, 0)}</ul>
      </div>
      <div>
        <div className="mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Connections</div>
        <ul className="space-y-1">
          {spec.edges.map((e, i) => (
            <li key={i} className="text-ink-2">
              {items[e.from]?.label ?? e.from} {e.both ? '↔' : '→'} {items[e.to]?.label ?? e.to}
              {e.label && <span className="text-ink-3"> ({e.label})</span>}
              {e.tone === 'deny' && <span className="font-medium text-danger-700"> — blocked</span>}
            </li>
          ))}
        </ul>
        {spec.flows && spec.flows.length > 0 && (
          <>
            <div className="mt-4 mb-1 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Flows</div>
            <ul className="space-y-2">
              {spec.flows.map((f) => (
                <li key={f.id} className="text-ink-2">
                  <span className="font-medium text-ink">{f.label}:</span> {f.path.map((id) => items[id]?.label ?? id).join(' → ')}
                  {f.description && <div className="text-ink-3">{f.description}</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
