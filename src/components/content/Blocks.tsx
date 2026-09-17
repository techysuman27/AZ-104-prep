import { Fragment, lazy, Suspense, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  GraduationCap,
  Info,
  Lightbulb,
  OctagonAlert,
  RotateCcw,
  Sparkles,
  Sprout,
  TriangleAlert,
} from 'lucide-react';
import type { Block, CalloutVariant, ChangeNote, DecisionTree } from '@/content/schema';
import { ADMIN_QUESTIONS, ADMIN_QUESTION_ORDER } from '@/content/mindset';
import { CONCEPT_INDEX } from '@/content/concepts';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Overlay';
import { Skeleton } from '@/components/ui/Card';
import { useLearner } from '@/store/learner';
import { FlowDiagram } from '@/components/diagrams/FlowDiagram';
import { DIAGRAMS } from '@/components/diagrams/registry';
import { INTERACTIVES } from '@/components/interactive/registry';
import { CodeBlock } from './CodeBlock';
import { ConceptLink, InlineText } from './InlineText';
import { ConnectionsPanel } from './ConnectionsPanel';

const QuickCheck = lazy(() => import('@/components/questions/QuickCheck'));

// ---------------------------------------------------------------------------

const CALLOUT: Record<CalloutVariant, { label: string; icon: ReactNode; box: string; title: string }> = {
  tip: {
    label: 'Tip',
    icon: <Lightbulb className="size-4" aria-hidden="true" />,
    box: 'border-brand-150 bg-brand-25',
    title: 'text-brand-800',
  },
  note: {
    label: 'Note',
    icon: <Info className="size-4" aria-hidden="true" />,
    box: 'border-line bg-subtle/70',
    title: 'text-ink-2',
  },
  warning: {
    label: 'Watch out',
    icon: <TriangleAlert className="size-4" aria-hidden="true" />,
    box: 'border-warning-100 bg-warning-50',
    title: 'text-warning-700',
  },
  trap: {
    label: 'Exam trap',
    icon: <OctagonAlert className="size-4" aria-hidden="true" />,
    box: 'border-danger-100 bg-danger-50/70',
    title: 'text-danger-700',
  },
  'real-world': {
    label: 'In the real world',
    icon: <Building className="size-4" aria-hidden="true" />,
    box: 'border-design-100 bg-design-50',
    title: 'text-design-700',
  },
  exam: {
    label: 'Exam angle',
    icon: <GraduationCap className="size-4" aria-hidden="true" />,
    box: 'border-brand-150 bg-brand-50/60',
    title: 'text-brand-800',
  },
  analogy: {
    label: 'Analogy',
    icon: <Sparkles className="size-4" aria-hidden="true" />,
    box: 'border-design-100 bg-design-50',
    title: 'text-design-700',
  },
};

export function Callout({ variant, title, text, children }: { variant: CalloutVariant; title?: string; text?: string; children?: ReactNode }) {
  const c = CALLOUT[variant];
  return (
    <aside className={cn('rounded-xl border px-4 py-3.5', c.box)} aria-label={c.label}>
      <div className={cn('flex items-center gap-2 text-[13px] font-semibold', c.title)}>
        {c.icon}
        <span>{title ? `${c.label}: ${title}` : c.label}</span>
      </div>
      {text && (
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
          <InlineText text={text} />
        </p>
      )}
      {children}
    </aside>
  );
}

function Explainer({ technical, simple }: { technical: string[]; simple: string[] }) {
  const globalMode = useLearner((s) => s.settings.explanationMode);
  const [local, setLocal] = useState<'technical' | 'simple' | null>(null);
  const mode = local ?? globalMode;
  const paragraphs = mode === 'simple' ? simple : technical;
  return (
    <div className={cn('rounded-2xl border p-5 transition-colors', mode === 'simple' ? 'border-success-100 bg-success-50/50' : 'border-line bg-surface')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
          {mode === 'simple' ? (
            <>
              <Sprout className="size-4 text-success-700" aria-hidden="true" /> Explained for someone new to Azure
            </>
          ) : (
            <>
              <Icon name="cloud" className="size-4 text-brand-600" /> The explanation
            </>
          )}
        </div>
        <Segmented
          size="sm"
          label="Explanation style"
          value={mode}
          onChange={(v) => setLocal(v)}
          options={[
            { value: 'technical', label: 'Technical' },
            { value: 'simple', label: 'New to Azure' },
          ]}
        />
      </div>
      <div className="prose-lesson space-y-3" aria-live="polite">
        {paragraphs.map((p, i) => (
          <p key={`${mode}-${i}`} className="animate-fade-in">
            <InlineText text={p} />
          </p>
        ))}
      </div>
    </div>
  );
}

function Analogy({ title, story, mapping }: { title: string; story: string; mapping: { analogy: string; azure: string }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-design-100 bg-design-50">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-design-700">
          <Sparkles className="size-4" aria-hidden="true" /> Analogy · {title}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          <InlineText text={story} />
        </p>
      </div>
      <div className="border-t border-design-100 bg-surface/80 px-5 py-3">
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] gap-3 text-2xs font-semibold tracking-wide text-ink-4 uppercase">
          <span>In the analogy</span>
          <span aria-hidden="true" />
          <span>In Azure</span>
        </div>
        <ul className="space-y-1.5">
          {mapping.map((m) => (
            <li key={m.analogy} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[13.5px]">
              <span className="text-ink-2">{m.analogy}</span>
              <ArrowRight className="size-3.5 text-ink-4" aria-label="maps to" />
              <span className="font-medium text-ink">
                <InlineText text={m.azure} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ChangeNoteCard({ note }: { note: ChangeNote }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-subtle/60 px-4 py-2.5 text-[13px] font-semibold text-ink">
        <Clock className="size-4 text-ink-3" aria-hidden="true" />
        What changed: {note.topic}
      </div>
      <dl className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-3">
          <dt className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Previously</dt>
          <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-3 line-through decoration-ink-4/40">
            <InlineText text={note.previously} />
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-2xs font-semibold tracking-wide text-brand-700 uppercase">Now</dt>
          <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
            <InlineText text={note.now} />
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-2xs font-semibold tracking-wide text-success-700 uppercase">What matters for AZ-104</dt>
          <dd className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
            <InlineText text={note.matters} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function PortalWalkthrough({ block }: { block: Extract<Block, { type: 'portal' }> }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Portal walkthrough</div>
        <div className="mt-0.5 text-[15px] font-semibold text-ink">{block.title}</div>
        <nav aria-label="Portal path" className="mt-2 flex flex-wrap items-center gap-1 text-xs text-ink-3">
          {block.path.map((p, i) => (
            <Fragment key={`${p}-${i}`}>
              {i > 0 && <ChevronRight className="size-3 text-ink-4" aria-hidden="true" />}
              <span className="rounded-md bg-subtle px-1.5 py-0.5 font-medium text-ink-2">{p}</span>
            </Fragment>
          ))}
        </nav>
      </div>
      <ol>
        {block.steps.map((s, i) => {
          const isOpen = open === i;
          return (
            <li key={s.label} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle/60"
              >
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular',
                    isOpen ? 'bg-brand-600 text-white' : 'bg-subtle text-ink-3',
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[14px] font-medium text-ink">{s.label}</span>
                <ChevronRight className={cn('size-4 text-ink-4 transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="animate-fade-in px-4 pb-4 pl-13">
                  {s.detail && (
                    <p className="text-[14px] leading-relaxed text-ink-2">
                      <InlineText text={s.detail} />
                    </p>
                  )}
                  {s.fields && s.fields.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded-xl border border-line">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-subtle/70 text-2xs tracking-wide text-ink-3 uppercase">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Setting</th>
                            <th className="px-3 py-2 font-semibold">Value</th>
                            <th className="hidden px-3 py-2 font-semibold sm:table-cell">Why</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {s.fields.map((f) => (
                            <tr key={f.name} className="align-top">
                              <td className="px-3 py-2 font-medium text-ink">{f.name}</td>
                              <td className="px-3 py-2">
                                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-800">{f.value}</span>
                                {f.hint && (
                                  <p className="mt-1 text-xs text-ink-3 sm:hidden">
                                    <InlineText text={f.hint} />
                                  </p>
                                )}
                              </td>
                              <td className="hidden px-3 py-2 text-ink-3 sm:table-cell">{f.hint && <InlineText text={f.hint} />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DecisionTreeView({ tree }: { tree: DecisionTree }) {
  const [path, setPath] = useState<{ node: string; choice?: string }[]>([{ node: tree.start }]);
  const current = path[path.length - 1];
  const node = tree.nodes[current.node];

  const choose = (label: string, next: string) => {
    setPath((p) => [...p.slice(0, -1), { node: current.node, choice: label }, { node: next }]);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Decision guide</div>
          <div className="text-[15px] font-semibold text-ink">{tree.title}</div>
        </div>
        {path.length > 1 && (
          <button
            type="button"
            onClick={() => setPath([{ node: tree.start }])}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-3 hover:bg-subtle hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Start over
          </button>
        )}
      </div>
      <div className="px-4 py-4">
        {path.length > 1 && (
          <ol className="mb-4 space-y-1.5">
            {path.slice(0, -1).map((p, i) => {
              const n = tree.nodes[p.node];
              return (
                <li key={i} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-ink-3">{n && n.kind === 'question' ? n.text : ''}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 font-medium text-brand-800">
                    <CircleCheck className="size-3" aria-hidden="true" />
                    {p.choice}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {node?.kind === 'question' && (
          <div key={current.node} className="animate-rise-in">
            <p className="text-[16px] font-semibold text-ink">{node.text}</p>
            {node.help && (
              <p className="mt-1 text-[13.5px] text-ink-3">
                <InlineText text={node.help} />
              </p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {node.options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => choose(o.label, o.next)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-[14px] font-medium text-ink-2 transition-all hover:-translate-y-px hover:border-brand-300 hover:bg-brand-25 hover:text-ink hover:shadow-raised"
                >
                  <InlineText text={o.label} />
                  <ArrowRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
        {node?.kind === 'result' && (
          <div
            key={current.node}
            className={cn(
              'animate-pop-in rounded-xl border px-4 py-3.5',
              node.tone === 'caution' ? 'border-warning-100 bg-warning-50' : 'border-success-100 bg-success-50',
            )}
          >
            <div className={cn('flex items-center gap-2 text-[13px] font-semibold', node.tone === 'caution' ? 'text-warning-700' : 'text-success-700')}>
              {node.tone === 'caution' ? <TriangleAlert className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}
              Recommendation
            </div>
            <div className="mt-1 text-[16px] font-semibold text-ink">{node.title}</div>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={node.text} />
            </p>
            {node.concepts && node.concepts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                {node.concepts.map((c) => (
                  <ConceptLink key={c} id={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RegistryFallback({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5" aria-busy="true">
      <div className="mb-3 text-[13px] font-medium text-ink-3">Loading {label}…</div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="prose-lesson">
          <InlineText text={block.text} />
        </p>
      );
    case 'lead':
      return (
        <p className="text-[17.5px] leading-[1.65] text-ink-2">
          <InlineText text={block.text} />
        </p>
      );
    case 'explainer':
      return <Explainer technical={block.technical} simple={block.simple} />;
    case 'analogy':
      return <Analogy title={block.title} story={block.story} mapping={block.mapping} />;
    case 'callout':
      return <Callout variant={block.variant} title={block.title} text={block.text} />;
    case 'change':
      return <ChangeNoteCard note={block.note} />;
    case 'list': {
      const style = block.style ?? 'bullet';
      if (style === 'number') {
        return (
          <ol className="prose-lesson list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-ink-3">
            {block.items.map((it) => (
              <li key={it} className="pl-1">
                <InlineText text={it} />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="prose-lesson space-y-2">
          {block.items.map((it) => (
            <li key={it} className="flex gap-2.5">
              {style === 'check' ? (
                <CircleCheck className="mt-[5px] size-4 shrink-0 text-success-600" aria-hidden="true" />
              ) : (
                <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-ink-4" aria-hidden="true" />
              )}
              <span>
                <InlineText text={it} />
              </span>
            </li>
          ))}
        </ul>
      );
    }
    case 'steps':
      return (
        <div>
          {block.title && <div className="mb-3 text-[14px] font-semibold text-ink">{block.title}</div>}
          <ol className="relative space-y-4 border-l-2 border-line pl-6">
            {block.steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="absolute top-0 -left-[37px] grid size-6 place-items-center rounded-full border-2 border-surface bg-brand-600 text-2xs font-semibold text-white tabular">
                  {i + 1}
                </span>
                <div className="text-[15px] font-semibold text-ink">
                  <InlineText text={s.title} />
                </div>
                {s.detail && (
                  <p className="mt-0.5 text-[14.5px] leading-relaxed text-ink-2">
                    <InlineText text={s.detail} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      );
    case 'table':
      return (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13.5px]">
              {block.caption && <caption className="border-b border-line px-4 py-2.5 text-left text-[13px] font-semibold text-ink">{block.caption}</caption>}
              <thead className="bg-subtle/70">
                <tr>
                  {block.columns.map((c) => (
                    <th key={c} scope="col" className="px-4 py-2.5 text-2xs font-semibold tracking-wide whitespace-nowrap text-ink-3 uppercase">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {block.rows.map((row, i) => (
                  <tr key={i} className="align-top">
                    {row.map((cell, j) => (
                      <td key={j} className={cn('px-4 py-2.5 leading-relaxed', j === 0 ? 'font-medium text-ink' : 'text-ink-2')}>
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'code':
      return <CodeBlock tabs={block.tabs} title={block.title} />;
    case 'portal':
      return <PortalWalkthrough block={block} />;
    case 'flow':
      return <FlowDiagram spec={block.spec} title={block.title} caption={block.caption} alt={block.alt} />;
    case 'diagram': {
      const Diagram = DIAGRAMS[block.id];
      if (!Diagram) return <Callout variant="note" text={`Diagram “${block.id}” is not available.`} />;
      return (
        <Suspense fallback={<RegistryFallback label="diagram" />}>
          <figure>
            <Diagram {...(block.props ?? {})} />
            <p className="sr-only">{block.alt}</p>
            {block.caption && (
              <figcaption className="mt-2 text-xs leading-relaxed text-ink-3">
                <InlineText text={block.caption} />
              </figcaption>
            )}
          </figure>
        </Suspense>
      );
    }
    case 'interactive': {
      const entry = INTERACTIVES[block.id];
      if (!entry) return <Callout variant="note" text={`Interactive “${block.id}” is not available.`} />;
      const Widget = entry.component;
      return (
        <section aria-label={block.title ?? entry.title} className="overflow-hidden rounded-2xl border border-brand-150 bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-25 px-4 py-2.5">
            <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-2xs font-semibold tracking-wide text-white uppercase">Try it</span>
            <span className="text-[14px] font-semibold text-ink">{block.title ?? entry.title}</span>
          </div>
          {block.intro && (
            <p className="px-4 pt-3 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={block.intro} />
            </p>
          )}
          <Suspense fallback={<div className="p-4"><Skeleton className="h-48 w-full" /></div>}>
            <Widget {...(block.props ?? {})} />
          </Suspense>
        </section>
      );
    }
    case 'decision':
      return <DecisionTreeView tree={block.tree} />;
    case 'mistakes':
      return (
        <ul className="space-y-3">
          {block.items.map((m) => (
            <li key={m.mistake} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex gap-3 px-4 py-3">
                <CircleX className="mt-0.5 size-[18px] shrink-0 text-danger-500" aria-hidden="true" />
                <div>
                  <div className="text-2xs font-semibold tracking-wide text-danger-700 uppercase">Mistake</div>
                  <p className="text-[14.5px] leading-relaxed text-ink">
                    <InlineText text={m.mistake} />
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-t border-line bg-success-50/50 px-4 py-3">
                <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-success-600" aria-hidden="true" />
                <div>
                  <div className="text-2xs font-semibold tracking-wide text-success-700 uppercase">Do this instead</div>
                  <p className="text-[14.5px] leading-relaxed text-ink-2">
                    <InlineText text={m.fix} />
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      );
    case 'scenario':
      return (
        <div className="overflow-hidden rounded-2xl border border-design-100 bg-surface">
          <div className="blueprint px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-2xs font-semibold tracking-wide text-white/70 uppercase">
              <Building className="size-3.5" aria-hidden="true" /> Real-world scenario
            </div>
            <div className="mt-1 text-[17px] font-semibold">{block.company}</div>
            <p className="mt-1 text-[14px] leading-relaxed text-white/80">
              <InlineText text={block.context} />
            </p>
          </div>
          <div className="space-y-4 px-5 py-4">
            <div>
              <div className="text-2xs font-semibold tracking-wide text-warning-700 uppercase">The problem</div>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">
                <InlineText text={block.problem} />
              </p>
            </div>
            <div>
              <div className="text-2xs font-semibold tracking-wide text-brand-700 uppercase">The administrator's approach</div>
              <ol className="mt-2 space-y-2">
                {block.approach.map((a, i) => (
                  <li key={a} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-2xs font-semibold text-brand-700 tabular">
                      {i + 1}
                    </span>
                    <span>
                      <InlineText text={a} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {block.outcome && (
              <div className="rounded-xl bg-success-50 px-4 py-3">
                <div className="text-2xs font-semibold tracking-wide text-success-700 uppercase">Outcome</div>
                <p className="mt-0.5 text-[14.5px] leading-relaxed text-ink-2">
                  <InlineText text={block.outcome} />
                </p>
              </div>
            )}
          </div>
        </div>
      );
    case 'compare':
      return (
        <div>
          {block.title && <div className="mb-3 text-[14px] font-semibold text-ink">{block.title}</div>}
          <div className={cn('grid gap-3', block.items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3')}>
            {block.items.map((it) => (
              <div key={it.name} className="rounded-xl border border-line bg-surface p-4">
                <div className="text-[15px] font-semibold text-ink">
                  <InlineText text={it.name} />
                </div>
                <div className="mt-1 rounded-md bg-brand-50 px-2 py-1 text-[12.5px] font-medium text-brand-800">
                  Best for: <InlineText text={it.bestFor} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {it.points.map((p) => (
                    <li key={p} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
                      <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ink-4" aria-hidden="true" />
                      <span>
                        <InlineText text={p} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    case 'quickcheck':
      return (
        <Suspense fallback={<RegistryFallback label="questions" />}>
          <QuickCheck questionIds={block.questionIds} />
        </Suspense>
      );
    case 'adminLens':
      return (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Think like an Azure administrator</div>
              <div className="text-[15px] font-semibold text-ink">Questions to ask before you build</div>
            </div>
            <Link to="/mindset" className="text-xs font-semibold text-brand-700 hover:underline">
              The method →
            </Link>
          </div>
          <dl className="grid sm:grid-cols-2">
            {ADMIN_QUESTION_ORDER.filter((q) => block.answers.some((a) => a.q === q)).map((q) => {
              const meta = ADMIN_QUESTIONS[q];
              const answer = block.answers.find((a) => a.q === q)!;
              return (
                <div key={q} className="flex gap-3 border-b border-line px-4 py-3 sm:odd:border-r">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-subtle text-ink-2">
                    <Icon name={meta.icon} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] font-semibold text-ink">{meta.question}</dt>
                    <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">
                      <InlineText text={answer.a} />
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      );
    case 'connections':
      return CONCEPT_INDEX[block.conceptId] ? <ConnectionsPanel conceptId={block.conceptId} /> : null;
  }
}

export function BlockList({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn('space-y-5', className)}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}
