import { useState } from 'react';
import { useParams } from 'react-router';
import { CircleCheck, CircleX, Inbox, RotateCcw, Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import type { ToolOutput, TroubleTool } from '@/content/schema';
import { TROUBLE_INDEX } from '@/content/trouble';
import { SOURCES } from '@/content/sources';
import { Breadcrumbs, PageContainer } from '@/components/layout/Page';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { AreaChip } from '@/components/ui/Badge';
import { FlowDiagram } from '@/components/diagrams/FlowDiagram';
import { InlineText } from '@/components/content/InlineText';
import { ConceptChip } from '@/components/content/ConnectionsPanel';
import { useLearner } from '@/store/learner';
import { cn } from '@/lib/cn';

function OutputView({ output }: { output: ToolOutput }) {
  if (output.kind === 'table') {
    return (
      <div>
        <div className="scrollbar-thin overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] text-left font-mono text-[12px]">
            <thead className="bg-subtle/80">
              <tr>
                {output.columns.map((c) => (
                  <th key={c} className="px-3 py-1.5 font-semibold whitespace-nowrap text-ink-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {output.rows.map((r, i) => (
                <tr key={i} className={cn(output.highlight?.includes(i) && 'bg-warning-50')}>
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 whitespace-nowrap text-ink-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {output.note && <p className="mt-2 text-xs text-ink-3">{output.note}</p>}
      </div>
    );
  }
  if (output.kind === 'lines') {
    return (
      <div>
        <pre className="scrollbar-thin overflow-x-auto rounded-lg bg-design-900 px-3 py-2.5 text-[12px] leading-relaxed text-white/90">{output.lines.join('\n')}</pre>
        {output.note && <p className="mt-2 text-xs text-ink-3">{output.note}</p>}
      </div>
    );
  }
  return (
    <div>
      <dl className="grid gap-x-4 gap-y-1.5 rounded-lg border border-line p-3 text-[13px] sm:grid-cols-[minmax(0,auto)_1fr]">
        {output.items.map((it) => (
          <div key={it.k} className="contents">
            <dt className="text-ink-3">{it.k}</dt>
            <dd
              className={cn(
                'font-mono text-[12.5px]',
                it.tone === 'bad' ? 'font-semibold text-danger-700' : it.tone === 'warn' ? 'font-semibold text-warning-700' : it.tone === 'good' ? 'text-success-700' : 'text-ink',
              )}
            >
              {it.v}
            </dd>
          </div>
        ))}
      </dl>
      {output.note && <p className="mt-2 text-xs text-ink-3">{output.note}</p>}
    </div>
  );
}

export default function TroubleshootPage() {
  const { scenarioId = '' } = useParams();
  const scenario = TROUBLE_INDEX[scenarioId];
  const saveTrouble = useLearner((s) => s.saveTrouble);
  const [used, setUsed] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [causeTries, setCauseTries] = useState<string[]>([]);
  const [fixTries, setFixTries] = useState<string[]>([]);
  const [cause, setCause] = useState<string>('');
  const [fix, setFix] = useState<string>('');
  const [saved, setSaved] = useState<number | null>(null);

  if (!scenario) {
    return (
      <PageContainer>
        <EmptyState title="Scenario not found" action={<LinkButton to="/labs#troubleshooting">All scenarios</LinkButton>} />
      </PageContainer>
    );
  }

  const correctCause = scenario.causes.find((c) => c.correct)!;
  const correctFix = scenario.fixes.find((f) => f.correct)!;
  const causeSolved = causeTries.includes(correctCause.id);
  const fixSolved = fixTries.includes(correctFix.id);
  const lastCause = scenario.causes.find((c) => c.id === causeTries[causeTries.length - 1]);
  const lastFix = scenario.fixes.find((f) => f.id === fixTries[fixTries.length - 1]);
  const groups = [...new Set(scenario.tools.map((t) => t.group))];
  const activeTool = scenario.tools.find((t) => t.id === active);
  const clueCount = scenario.tools.filter((t) => t.clue).length;

  const runTool = (t: TroubleTool) => {
    setActive(t.id);
    if (!used.includes(t.id)) setUsed((u) => [...u, t.id]);
  };

  const submitFix = () => {
    if (!fix) return;
    const tries = [...fixTries, fix];
    setFixTries(tries);
    if (fix === correctFix.id) {
      const extraTools = Math.max(0, used.length - clueCount - 2);
      const score = Math.max(0.2, 1 - (causeTries.length - 1) * 0.25 - (tries.length - 1) * 0.15 - Math.min(0.2, extraTools * 0.04));
      saveTrouble(scenario.id, { toolsUsed: used.length, firstTry: causeTries.length === 1 && tries.length === 1, score });
      setSaved(score);
    }
  };

  const reset = () => {
    setUsed([]);
    setActive(null);
    setCauseTries([]);
    setFixTries([]);
    setCause('');
    setFix('');
    setSaved(null);
  };

  return (
    <PageContainer wide>
      <Breadcrumbs items={[{ label: 'Labs & simulators', to: '/labs' }, { label: 'Troubleshooting', to: '/labs#troubleshooting' }, { label: scenario.title }]} />
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <AreaChip area={scenario.area} />
          <span className="text-xs text-ink-3">{['', 'Foundation', 'Intermediate', 'Hard'][scenario.difficulty]}</span>
        </div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">{scenario.title}</h1>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-3">{scenario.summary}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-subtle/60 px-5 py-3 text-[13px] font-semibold text-ink">
              <Inbox className="size-4 text-ink-3" aria-hidden="true" /> Support ticket · from {scenario.ticket.from}
            </div>
            <p className="px-5 py-4 text-[15px] leading-relaxed text-ink">
              <InlineText text={scenario.ticket.message} />
            </p>
          </Card>

          <FlowDiagram spec={scenario.environment} title="The environment" alt={`Environment for ${scenario.title}`} />

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Search className="size-4 text-brand-600" aria-hidden="true" /> Investigate
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-3">Run the checks an administrator would run. Efficient investigations score higher.</p>
            <div className="mt-4 space-y-4">
              {groups.map((g) => (
                <div key={g}>
                  <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">{g}</div>
                  <div className="flex flex-wrap gap-2">
                    {scenario.tools
                      .filter((t) => t.group === g)
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => runTool(t)}
                          aria-pressed={active === t.id}
                          title={t.description}
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors',
                            active === t.id ? 'border-brand-500 bg-brand-50 text-brand-800' : used.includes(t.id) ? 'border-line bg-subtle text-ink-2' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                          )}
                        >
                          {used.includes(t.id) && <CircleCheck className="size-3.5 text-ink-4" aria-hidden="true" />}
                          {t.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            {activeTool && (
              <div key={activeTool.id} className="mt-5 animate-fade-in rounded-xl border border-line bg-surface p-4">
                <div className="mb-1 text-[14px] font-semibold text-ink">{activeTool.label}</div>
                <p className="mb-3 text-[13px] text-ink-3">{activeTool.description}</p>
                <OutputView output={activeTool.output} />
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">1 · What is the root cause?</h2>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label="Root cause">
              {scenario.causes.map((c) => {
                const tried = causeTries.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] leading-snug',
                      causeSolved && c.correct ? 'border-success-500/50 bg-success-50' : tried && !c.correct ? 'border-danger-100 bg-danger-50/60 text-ink-3' : cause === c.id ? 'border-brand-400 bg-brand-25' : 'border-line hover:border-line-strong',
                      causeSolved && 'cursor-default',
                    )}
                  >
                    <input type="radio" name="cause" className="mt-0.5 accent-[var(--color-brand-600)]" disabled={causeSolved || tried} checked={cause === c.id} onChange={() => setCause(c.id)} />
                    <span className="text-ink-2">
                      <InlineText text={c.text} />
                    </span>
                  </label>
                );
              })}
            </div>
            {lastCause && (
              <p className={cn('mt-3 flex gap-2 rounded-lg px-3 py-2 text-[13px] leading-relaxed', lastCause.correct ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')} aria-live="polite">
                {lastCause.correct ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                <span>
                  <InlineText text={lastCause.feedback} />
                </span>
              </p>
            )}
            {!causeSolved && (
              <Button className="mt-3" size="sm" disabled={!cause || causeTries.includes(cause)} onClick={() => setCauseTries((t) => [...t, cause])}>
                Confirm diagnosis
              </Button>
            )}
          </Card>

          <Card className={cn('p-5 transition-opacity', !causeSolved && 'pointer-events-none opacity-50')} aria-disabled={!causeSolved}>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Wrench className="size-4" aria-hidden="true" /> 2 · How do you fix it?
            </h2>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label="Fix">
              {scenario.fixes.map((f) => {
                const tried = fixTries.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] leading-snug',
                      fixSolved && f.correct ? 'border-success-500/50 bg-success-50' : tried && !f.correct ? 'border-danger-100 bg-danger-50/60' : fix === f.id ? 'border-brand-400 bg-brand-25' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <input type="radio" name="fix" className="mt-0.5 accent-[var(--color-brand-600)]" disabled={!causeSolved || fixSolved || tried} checked={fix === f.id} onChange={() => setFix(f.id)} />
                    <span className="text-ink-2">
                      <InlineText text={f.text} />
                    </span>
                  </label>
                );
              })}
            </div>
            {lastFix && (
              <p className={cn('mt-3 flex gap-2 rounded-lg px-3 py-2 text-[13px] leading-relaxed', lastFix.correct ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')} aria-live="polite">
                {lastFix.correct ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                <span>
                  <InlineText text={lastFix.feedback} />
                </span>
              </p>
            )}
            {causeSolved && !fixSolved && (
              <Button className="mt-3" size="sm" disabled={!fix || fixTries.includes(fix)} onClick={submitFix}>
                Apply fix
              </Button>
            )}
          </Card>

          {fixSolved && (
            <Card className="animate-rise-in overflow-hidden border-success-100">
              <div className="flex items-center justify-between gap-2 bg-success-50 px-5 py-3">
                <span className="flex items-center gap-2 text-[15px] font-semibold text-success-700">
                  <Sparkles className="size-4" aria-hidden="true" /> Resolved
                </span>
                {saved !== null && <span className="text-[13px] font-semibold text-success-700 tabular">Score {Math.round(saved * 100)}</span>}
              </div>
              <div className="space-y-4 px-5 py-4">
                <p className="text-[14px] leading-relaxed text-ink-2">
                  <InlineText text={scenario.explanation} />
                </p>
                <div>
                  <div className="flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">
                    <ShieldCheck className="size-3.5" aria-hidden="true" /> Prevent it next time
                  </div>
                  <ul className="mt-1.5 space-y-1.5">
                    {scenario.prevention.map((p) => (
                      <li key={p} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                        <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success-600" aria-hidden="true" />
                        <span>
                          <InlineText text={p} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scenario.concepts.map((c) => (
                    <ConceptChip key={c} id={c} />
                  ))}
                </div>
                <div className="text-xs text-ink-3">
                  Investigation used {used.length} tool{used.length === 1 ? '' : 's'}.{' '}
                  {scenario.sources
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
                <Button variant="secondary" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={reset}>
                  Try again
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
