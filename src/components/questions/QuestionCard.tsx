import { useMemo, useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Bookmark, BookmarkCheck, CircleCheck, CircleX, GripVertical, Lightbulb } from 'lucide-react';
import type { ChoiceOption, Exhibit, Question } from '@/content/schema';
import { QUESTION_KIND_LABELS } from '@/content/schema';
import { SOURCES } from '@/content/sources';
import { DOMAIN_INDEX } from '@/content/exam';
import { gradeQuestion, correctCount, type Answer } from '@/engine/grading';
import { createRng, hashString, shuffle } from '@/lib/random';
import { cn } from '@/lib/cn';
import { useLearner, isBookmarked } from '@/store/learner';
import { useUi } from '@/store/ui';
import { AreaChip, Badge } from '@/components/ui/Badge';
import { InlineText } from '@/components/content/InlineText';
import { CodeSurface } from '@/components/content/CodeBlock';
import { ConceptChip } from '@/components/content/ConnectionsPanel';

export type QuestionMode = 'practice' | 'exam' | 'lesson' | 'review';

const LETTERS = 'ABCDEFGH';

export function ExhibitView({ exhibit }: { exhibit: Exhibit }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line bg-subtle/70 px-3.5 py-2 text-2xs font-semibold tracking-wide text-ink-3 uppercase">
        Exhibit · {exhibit.title}
      </div>
      {exhibit.kind === 'table' && exhibit.columns && exhibit.rows && (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line">
                {exhibit.columns.map((c) => (
                  <th key={c} scope="col" className="px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-ink-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {exhibit.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j} className="px-3.5 py-2 font-mono text-xs whitespace-nowrap text-ink-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {exhibit.kind === 'code' && exhibit.code && <CodeSurface code={exhibit.code} lang={exhibit.lang ?? 'text'} className="bg-[#fbfcfd]" />}
      {exhibit.kind === 'text' && exhibit.text && (
        <p className="px-3.5 py-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
          <InlineText text={exhibit.text} />
        </p>
      )}
    </div>
  );
}

function OptionRow({
  option,
  index,
  selected,
  revealed,
  multi,
  disabled,
  onToggle,
}: {
  option: ChoiceOption;
  index: number;
  selected: boolean;
  revealed: boolean;
  multi: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const isCorrect = !!option.correct;
  const state = revealed ? (isCorrect ? 'correct' : selected ? 'wrong' : 'neutral') : selected ? 'selected' : 'idle';
  return (
    <li>
      <button
        type="button"
        role={multi ? 'checkbox' : 'radio'}
        aria-checked={selected}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150 disabled:cursor-default',
          state === 'idle' && 'border-line bg-surface hover:border-line-strong hover:bg-subtle/50',
          state === 'selected' && 'border-brand-400 bg-brand-25 ring-2 ring-brand-100',
          state === 'correct' && 'border-success-500/50 bg-success-50',
          state === 'wrong' && 'border-danger-500/50 bg-danger-50',
          state === 'neutral' && 'border-line bg-surface opacity-90',
        )}
      >
        <span
          className={cn(
            'mt-px grid size-6 shrink-0 place-items-center border text-xs font-semibold tabular transition-colors',
            multi ? 'rounded-md' : 'rounded-full',
            state === 'selected' && 'border-brand-600 bg-brand-600 text-white',
            state === 'idle' && 'border-line-strong text-ink-3 group-hover:border-ink-4',
            state === 'correct' && 'border-success-600 bg-success-600 text-white',
            state === 'wrong' && 'border-danger-500 bg-danger-500 text-white',
            state === 'neutral' && 'border-line-strong text-ink-4',
          )}
          aria-hidden="true"
        >
          {state === 'correct' ? <CircleCheck className="size-3.5" /> : state === 'wrong' ? <CircleX className="size-3.5" /> : LETTERS[index]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] leading-relaxed text-ink">
            <InlineText text={option.text} />
          </span>
          {revealed && (
            <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-2">
              <span className={cn('font-semibold', isCorrect ? 'text-success-700' : 'text-danger-700')}>
                {isCorrect ? (selected ? 'Correct — you chose this. ' : 'Correct answer. ') : selected ? 'Your answer — incorrect. ' : 'Incorrect. '}
              </span>
              <InlineText text={option.why} />
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function SortableItem({
  id,
  text,
  index,
  total,
  disabled,
  onMove,
  mark,
}: {
  id: string;
  text: string;
  index: number;
  total: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  mark?: 'right' | 'wrong';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-surface px-2 py-2',
        isDragging ? 'z-10 border-brand-400 shadow-pop' : 'border-line',
        mark === 'right' && 'border-success-500/50 bg-success-50',
        mark === 'wrong' && 'border-danger-500/50 bg-danger-50',
      )}
    >
      <button
        type="button"
        className={cn('grid size-8 shrink-0 place-items-center rounded-lg text-ink-4', !disabled && 'cursor-grab hover:bg-subtle hover:text-ink-2 active:cursor-grabbing')}
        aria-label={`Drag to reorder: ${text}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold text-ink-3 tabular">{index + 1}</span>
      <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">
        <InlineText text={text} />
      </span>
      {mark === 'right' && <CircleCheck className="size-4 shrink-0 text-success-600" aria-label="Correct position" />}
      {mark === 'wrong' && <CircleX className="size-4 shrink-0 text-danger-500" aria-label="Wrong position" />}
      {!disabled && (
        <span className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30"
            aria-label={`Move up: ${text}`}
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30"
            aria-label={`Move down: ${text}`}
          >
            <ArrowDown className="size-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

export function QuestionBody({
  question: q,
  answer,
  onAnswerChange,
  revealed,
  disabled,
}: {
  question: Question;
  answer: Answer;
  onAnswerChange: (a: Answer) => void;
  revealed: boolean;
  disabled?: boolean;
}) {
  const locked = revealed || !!disabled;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const initialOrder = useMemo(() => {
    if (q.format !== 'order') return [];
    const ids = q.items.map((i) => i.id);
    let shuffled = shuffle(ids, createRng(hashString(q.id)));
    if (shuffled.every((id, i) => id === ids[i])) shuffled = [...shuffled.slice(1), shuffled[0]];
    return shuffled;
  }, [q]);
  const [touched, setTouched] = useState(false);

  switch (q.format) {
    case 'single':
    case 'multi': {
      const multi = q.format === 'multi';
      const selected = new Set(multi ? ((answer as string[] | undefined) ?? []) : answer ? [answer as string] : []);
      return (
        <div>
          {multi && (
            <p className="mb-2 text-[13px] font-medium text-ink-3">
              Select {correctCount(q) === 2 ? 'two' : correctCount(q) === 3 ? 'three' : correctCount(q)}.
            </p>
          )}
          <ul className="space-y-2" role={multi ? 'group' : 'radiogroup'} aria-label="Answer options">
            {q.options.map((o, i) => (
              <OptionRow
                key={o.id}
                option={o}
                index={i}
                multi={multi}
                selected={selected.has(o.id)}
                revealed={revealed}
                disabled={locked}
                onToggle={() => {
                  if (multi) {
                    const next = new Set(selected);
                    if (next.has(o.id)) next.delete(o.id);
                    else next.add(o.id);
                    onAnswerChange([...next]);
                  } else {
                    onAnswerChange(o.id);
                  }
                }}
              />
            ))}
          </ul>
        </div>
      );
    }
    case 'yesno': {
      const a = (answer as Record<string, boolean> | undefined) ?? {};
      return (
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="hidden grid-cols-[1fr_auto] gap-4 border-b border-line bg-subtle/70 px-4 py-2 text-2xs font-semibold tracking-wide text-ink-3 uppercase sm:grid">
            <span>Statement</span>
            <span className="w-[128px] text-center">Answer</span>
          </div>
          <ul className="divide-y divide-line">
            {q.statements.map((s) => {
              const value = a[s.id];
              const right = value === s.answer;
              return (
                <li key={s.id} className={cn('px-4 py-3', revealed && (right ? 'bg-success-50/60' : 'bg-danger-50/60'))}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[14.5px] leading-relaxed text-ink">
                      <InlineText text={s.text} />
                    </span>
                    <div role="radiogroup" aria-label={`Answer for: ${s.text}`} className="flex w-[128px] shrink-0 gap-1.5">
                      {[true, false].map((v) => {
                        const on = value === v;
                        const isAnswer = s.answer === v;
                        return (
                          <button
                            key={String(v)}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={locked}
                            onClick={() => onAnswerChange({ ...a, [s.id]: v })}
                            className={cn(
                              'h-8 flex-1 rounded-lg border text-[13px] font-semibold transition-colors',
                              !revealed && on && 'border-brand-600 bg-brand-600 text-white',
                              !revealed && !on && 'border-line bg-surface text-ink-2 hover:border-line-strong',
                              revealed && isAnswer && 'border-success-600 bg-success-600 text-white',
                              revealed && !isAnswer && on && 'border-danger-500 bg-danger-500 text-white',
                              revealed && !isAnswer && !on && 'border-line bg-surface text-ink-4',
                            )}
                          >
                            {v ? 'Yes' : 'No'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {revealed && (
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                      <span className={cn('font-semibold', right ? 'text-success-700' : 'text-danger-700')}>
                        {right ? 'Correct. ' : `Incorrect — the answer is ${s.answer ? 'Yes' : 'No'}. `}
                      </span>
                      <InlineText text={s.why} />
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    case 'order': {
      const order = (answer as string[] | undefined) ?? initialOrder;
      const itemById = Object.fromEntries(q.items.map((i) => [i.id, i]));
      const move = (from: number, to: number) => {
        if (to < 0 || to >= order.length) return;
        setTouched(true);
        onAnswerChange(arrayMove(order, from, to));
      };
      const onDragEnd = (e: DragEndEvent) => {
        if (!e.over || e.active.id === e.over.id) return;
        move(order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id)));
      };
      return (
        <div>
          {!revealed && (
            <p className="mb-2 text-[13px] font-medium text-ink-3">Drag the steps (or use the arrows) into the correct order.</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <ol className="space-y-2">
                {order.map((id, i) => (
                  <SortableItem
                    key={id}
                    id={id}
                    text={itemById[id]?.text ?? id}
                    index={i}
                    total={order.length}
                    disabled={locked}
                    onMove={move}
                    mark={revealed ? (q.items[i]?.id === id ? 'right' : 'wrong') : undefined}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          {!revealed && !answer && !touched && (
            <button
              type="button"
              onClick={() => onAnswerChange(order)}
              className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
            >
              Keep this order as my answer
            </button>
          )}
          {revealed && (
            <div className="mt-3 rounded-xl border border-success-100 bg-success-50/60 px-4 py-3">
              <div className="text-2xs font-semibold tracking-wide text-success-700 uppercase">Correct order</div>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13.5px] text-ink-2">
                {q.items.map((it) => (
                  <li key={it.id}>
                    <InlineText text={it.text} />
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                <InlineText text={q.why} />
              </p>
            </div>
          )}
        </div>
      );
    }
    case 'match': {
      const a = (answer as Record<string, string> | undefined) ?? {};
      return (
        <div className="overflow-hidden rounded-xl border border-line">
          <ul className="divide-y divide-line">
            {q.prompts.map((p) => {
              const value = a[p.id];
              const right = value === p.answer;
              return (
                <li key={p.id} className={cn('px-4 py-3', revealed && (right ? 'bg-success-50/60' : 'bg-danger-50/60'))}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <label htmlFor={`${q.id}-${p.id}`} className="text-[14.5px] leading-relaxed text-ink">
                      <InlineText text={p.text} />
                    </label>
                    <select
                      id={`${q.id}-${p.id}`}
                      value={value ?? ''}
                      disabled={locked}
                      onChange={(e) => onAnswerChange({ ...a, [p.id]: e.target.value })}
                      className={cn(
                        'h-9 w-full shrink-0 rounded-lg border bg-surface px-2.5 text-[13.5px] text-ink sm:w-64',
                        value ? 'border-brand-300' : 'border-line-strong',
                        'focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-100',
                      )}
                    >
                      <option value="" disabled>
                        Select…
                      </option>
                      {q.choices.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.text}
                        </option>
                      ))}
                    </select>
                  </div>
                  {revealed && (
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                      <span className={cn('font-semibold', right ? 'text-success-700' : 'text-danger-700')}>
                        {right ? 'Correct. ' : `Incorrect — the answer is ${q.choices.find((c) => c.id === p.answer)?.text}. `}
                      </span>
                      <InlineText text={p.why} />
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }
}

export function ExplanationPanel({ question: q, answer, extra }: { question: Question; answer: Answer; extra?: ReactNode }) {
  const result = gradeQuestion(q, answer);
  const openConcept = useUi((s) => s.openConcept);
  const bookmarked = useLearner((s) => isBookmarked(s, 'question', q.id));
  const toggleBookmark = useLearner((s) => s.toggleBookmark);
  const partial = !result.correct && result.score > 0;

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-line bg-surface" aria-live="polite">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 px-4 py-3',
          result.correct ? 'bg-success-50' : partial ? 'bg-warning-50' : 'bg-danger-50',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 text-[15px] font-semibold',
            result.correct ? 'text-success-700' : partial ? 'text-warning-700' : 'text-danger-700',
          )}
        >
          {result.correct ? <CircleCheck className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
          {result.correct ? 'Correct' : partial ? `Partially correct (${Math.round(result.score * 100)}%)` : result.answered ? 'Incorrect' : 'Not answered'}
        </div>
        <div className="flex items-center gap-1">
          {q.concepts[0] && (
            <button
              type="button"
              onClick={() => openConcept(q.concepts[0])}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink-2 hover:bg-white/70"
            >
              <Lightbulb className="size-3.5" aria-hidden="true" /> Explain this concept again
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleBookmark({ kind: 'question', id: q.id })}
            className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-white/70"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
            aria-pressed={bookmarked}
          >
            {bookmarked ? <BookmarkCheck className="size-4 text-brand-600" /> : <Bookmark className="size-4" />}
          </button>
        </div>
      </div>
      <dl className="divide-y divide-line">
        <div className="px-4 py-3">
          <dt className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Why this is the answer</dt>
          <dd className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
            <InlineText text={q.explanation.correct} />
          </dd>
        </div>
        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <dt className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Concept tested</dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={q.explanation.conceptTested} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {q.concepts.map((c) => (
                  <ConceptChip key={c} id={c} />
                ))}
              </div>
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Real-world relevance</dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={q.explanation.realWorld} />
            </dd>
          </div>
        </div>
        {q.explanation.trap && (
          <div className="bg-danger-50/40 px-4 py-3">
            <dt className="text-2xs font-semibold tracking-wide text-danger-700 uppercase">Exam trap</dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-ink-2">
              <InlineText text={q.explanation.trap} />
            </dd>
          </div>
        )}
        {q.sources.length > 0 && (
          <div className="px-4 py-2.5">
            <dt className="sr-only">Sources</dt>
            <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
              <span className="font-semibold text-ink-4">Verified against:</span>
              {q.sources.map((s) =>
                SOURCES[s] ? (
                  <a key={s} href={SOURCES[s].url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                    {SOURCES[s].title}
                  </a>
                ) : null,
              )}
            </dd>
          </div>
        )}
        {extra}
      </dl>
    </div>
  );
}

export function QuestionMeta({ question: q, className }: { question: Question; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <AreaChip area={q.domain} />
      <span className="text-ink-4" aria-hidden="true">
        ·
      </span>
      <Badge tone="neutral">{QUESTION_KIND_LABELS[q.kind]}</Badge>
      <Badge tone="outline" className="gap-1.5">
        <span className="flex gap-0.5" aria-hidden="true">
          {[1, 2, 3].map((d) => (
            <span key={d} className={cn('h-2 w-1 rounded-full', d <= q.difficulty ? 'bg-ink-2' : 'bg-line-strong')} />
          ))}
        </span>
        {q.difficulty === 1 ? 'Foundation' : q.difficulty === 2 ? 'Intermediate' : 'Hard'}
      </Badge>
      <span className="sr-only">Domain: {DOMAIN_INDEX[q.domain].title}</span>
    </div>
  );
}

export function QuestionStem({ question: q, number, total }: { question: Question; number?: number; total?: number }) {
  return (
    <div className="space-y-3">
      {number !== undefined && (
        <div className="text-xs font-semibold text-ink-3 tabular">
          Question {number}
          {total !== undefined && ` of ${total}`}
        </div>
      )}
      <p className="text-[16.5px] leading-[1.6] font-medium whitespace-pre-line text-ink">
        <InlineText text={q.stem} />
      </p>
      {q.exhibit && <ExhibitView exhibit={q.exhibit} />}
    </div>
  );
}
