import { useEffect, useState } from 'react';
import { Check, Copy, SquareTerminal } from 'lucide-react';
import type { CodeLang, CodeTab } from '@/content/schema';
import { cn } from '@/lib/cn';
import { highlight, type Token } from './highlighter';
import { InlineText } from './InlineText';

const LANG_LABEL: Record<CodeLang, string> = {
  bash: 'Bash',
  powershell: 'PowerShell',
  json: 'JSON',
  bicep: 'Bicep',
  kusto: 'KQL',
  text: 'Text',
};

function useTokens(code: string, lang: CodeLang) {
  const [state, setState] = useState<{ key: string; tokens: Token[][] | null }>({ key: '', tokens: null });
  const key = `${lang}:${code}`;
  useEffect(() => {
    let alive = true;
    highlight(code, lang).then((tokens) => {
      if (alive) setState({ key, tokens });
    });
    return () => {
      alive = false;
    };
  }, [code, lang, key]);
  return state.key === key ? state.tokens : null;
}

export function CopyButton({ text, className, label = 'Copy code' }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-3 transition-colors hover:bg-muted hover:text-ink',
        className,
      )}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check className="size-3.5 text-success-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export function CodeSurface({ code, lang, className }: { code: string; lang: CodeLang; className?: string }) {
  const tokens = useTokens(code, lang);
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <pre className={cn('scrollbar-thin overflow-x-auto px-4 py-3.5 text-[13px] leading-[1.7]', className)}>
      <code>
        {tokens
          ? tokens.map((line, i) => (
              <span key={i} className="block min-h-[1.7em]">
                {line.map((t, j) => (
                  <span
                    key={j}
                    style={{ color: t.color, fontStyle: t.fontStyle && t.fontStyle & 1 ? 'italic' : undefined }}
                  >
                    {t.content}
                  </span>
                ))}
              </span>
            ))
          : lines.map((line, i) => (
              <span key={i} className="block min-h-[1.7em] text-ink-2">
                {line}
              </span>
            ))}
      </code>
    </pre>
  );
}

export function CodeBlock({ tabs, title, className }: { tabs: CodeTab[]; title?: string; className?: string }) {
  const [active, setActive] = useState(0);
  const tab = tabs[Math.min(active, tabs.length - 1)];
  if (!tab) return null;

  return (
    <figure className={cn('overflow-hidden rounded-xl border border-line bg-[#fbfcfd]', className)}>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-2 py-1.5">
        <SquareTerminal className="ml-1.5 size-4 shrink-0 text-ink-4" aria-hidden="true" />
        {title && <figcaption className="mr-1 hidden text-xs font-medium text-ink-3 sm:block">{title}</figcaption>}
        <div role="tablist" aria-label="Code language" className="scrollbar-thin flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={`${t.label}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                'h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors',
                i === active ? 'bg-subtle text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              {t.label || LANG_LABEL[t.lang]}
            </button>
          ))}
        </div>
        <CopyButton text={tab.code} />
      </div>
      <CodeSurface code={tab.code} lang={tab.lang} />
      {tab.notes && tab.notes.length > 0 && (
        <div className="border-t border-line bg-surface px-4 py-3">
          <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Parameters explained</div>
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,auto)_1fr]">
            {tab.notes.map((n) => (
              <div key={n.token} className="contents">
                <dt>
                  <code className="rounded-md border border-line bg-subtle px-1.5 py-0.5 text-xs text-ink">{n.token}</code>
                </dt>
                <dd className="text-[13px] leading-snug text-ink-2">
                  <InlineText text={n.note} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </figure>
  );
}
