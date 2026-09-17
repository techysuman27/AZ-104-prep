import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { CONCEPT_INDEX } from '@/content/concepts';
import { Tooltip } from '@/components/ui/Overlay';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/cn';

/**
 * Safe inline mini-markdown renderer for content strings.
 * Supported: **bold**, *emphasis*, `code`, [[concept-id]], [[concept-id|label]],
 * [label](https://…) and [label](/internal/route). Never injects HTML.
 */
const TOKEN =
  /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\])|(\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]*)\))|(\*([^*\s](?:[^*]*[^*\s])?)\*)/g;

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  TOKEN.lastIndex = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;
    if (m[1]) {
      out.push(<strong key={key}>{renderInline(m[2], key)}</strong>);
    } else if (m[3]) {
      out.push(
        <code key={key} className="inline-code">
          {m[4]}
        </code>,
      );
    } else if (m[5]) {
      out.push(<ConceptLink key={key} id={m[6]} label={m[7]} />);
    } else if (m[8]) {
      const href = m[10];
      out.push(
        href.startsWith('/') ? (
          <Link key={key} to={href} className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500">
            {m[9]}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-0.5 font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
          >
            {m[9]}
            <ArrowUpRight className="size-3 self-center" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ),
      );
    } else if (m[11]) {
      out.push(<em key={key}>{renderInline(m[12], key)}</em>);
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function InlineText({ text, className }: { text: string; className?: string }) {
  const nodes = renderInline(text);
  if (!className) return <Fragment>{nodes}</Fragment>;
  return <span className={className}>{nodes}</span>;
}

export function ConceptLink({ id, label, className }: { id: string; label?: string; className?: string }) {
  const openConcept = useUi((s) => s.openConcept);
  const concept = CONCEPT_INDEX[id];
  const text = label ?? concept?.name ?? id;
  if (!concept) {
    if (import.meta.env.DEV) console.warn(`[content] Unknown concept link: ${id}`);
    return <span className={className}>{text}</span>;
  }
  return (
    <Tooltip
      content={
        <span className="block">
          <span className="block font-semibold">{concept.name}</span>
          <span className="mt-0.5 block text-white/80">{concept.summary}</span>
          <span className="mt-1 block text-2xs text-white/60">Click to see how it connects</span>
        </span>
      }
    >
      <button
        type="button"
        onClick={() => openConcept(id)}
        className={cn(
          'cursor-help rounded-sm font-medium text-ink underline decoration-brand-300 decoration-dotted decoration-2 underline-offset-[3px] transition-colors hover:bg-brand-50 hover:decoration-brand-500',
          className,
        )}
      >
        {text}
      </button>
    </Tooltip>
  );
}
