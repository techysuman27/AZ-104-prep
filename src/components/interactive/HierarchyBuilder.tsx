import { useMemo, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, CircleCheck, CircleX, GripVertical, RotateCcw } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { IconKey } from '@/content/schema';

interface LevelCard {
  id: string;
  name: string;
  icon: IconKey;
  explain: string;
}

const LEVELS: LevelCard[] = [
  { id: 'tenant', name: 'Microsoft Entra tenant', icon: 'tenant', explain: 'The identity boundary. Every subscription trusts exactly one tenant.' },
  { id: 'mg', name: 'Management group', icon: 'management-group', explain: 'Groups subscriptions so policy and access can be applied once. Nests up to six levels below the root.' },
  { id: 'subscription', name: 'Subscription', icon: 'subscription', explain: 'The billing and access boundary. Has exactly one parent management group.' },
  { id: 'rg', name: 'Resource group', icon: 'resource-group', explain: 'A lifecycle container. Each resource belongs to exactly one resource group.' },
  { id: 'resource', name: 'Resource', icon: 'vm', explain: 'The VM, storage account or network you actually use.' },
];

const START = ['rg', 'tenant', 'resource', 'subscription', 'mg'];

const TASKS: { id: string; task: string; answer: string; why: string }[] = [
  {
    id: 't1',
    task: 'Require that every production subscription — including ones created next year — only uses EU regions.',
    answer: 'mg',
    why: 'A policy assigned to the Production management group is inherited by all current and future subscriptions placed under it.',
  },
  {
    id: 't2',
    task: 'Give a new business unit its own invoice and spending limits.',
    answer: 'subscription',
    why: 'Subscriptions are the billing boundary, and budgets are commonly set per subscription.',
  },
  {
    id: 't3',
    task: 'Delete everything created for a two-week marketing campaign in one operation.',
    answer: 'rg',
    why: 'Resources that share a lifecycle belong in one resource group; deleting the group deletes all of them.',
  },
  {
    id: 't4',
    task: 'Configure self-service password reset for all employees.',
    answer: 'tenant',
    why: 'Self-service password reset is a Microsoft Entra ID setting configured for the tenant, not an Azure resource scope.',
  },
  {
    id: 't5',
    task: 'Let a contractor restart one specific VM and nothing else.',
    answer: 'resource',
    why: 'Assign a narrowly scoped role at the resource itself to follow least privilege.',
  },
];

function SortableLevel({
  card,
  index,
  checked,
  correct,
  onMove,
  total,
}: {
  card: LevelCard;
  index: number;
  checked: boolean;
  correct: boolean;
  onMove: (from: number, to: number) => void;
  total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, disabled: checked });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-surface px-2 py-2 shadow-xs',
        isDragging && 'z-10 border-brand-400 shadow-pop',
        checked && correct && 'border-success-500/50 bg-success-50',
        checked && !correct && 'border-danger-500/50 bg-danger-50',
        !checked && !isDragging && 'border-line',
      )}
    >
      <button
        type="button"
        className={cn('grid size-8 place-items-center rounded-lg text-ink-4', !checked && 'cursor-grab hover:bg-subtle active:cursor-grabbing')}
        aria-label={`Drag ${card.name}`}
        disabled={checked}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-subtle text-ink-2">
        <Icon name={card.icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-ink">{card.name}</span>
        {checked && <span className="block text-xs leading-snug text-ink-3">{card.explain}</span>}
      </span>
      {checked ? (
        correct ? (
          <CircleCheck className="size-5 shrink-0 text-success-600" aria-label="Correct position" />
        ) : (
          <CircleX className="size-5 shrink-0 text-danger-500" aria-label="Wrong position" />
        )
      ) : (
        <span className="flex shrink-0 gap-0.5">
          <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0} className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30" aria-label={`Move ${card.name} up`}>
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30" aria-label={`Move ${card.name} down`}>
            <ArrowDown className="size-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

export default function HierarchyBuilder() {
  const [order, setOrder] = useState(START);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const byId = useMemo(() => Object.fromEntries(LEVELS.map((l) => [l.id, l])), []);
  const correctOrder = LEVELS.map((l) => l.id);
  const allCorrect = order.every((id, i) => id === correctOrder[i]);
  const score = order.filter((id, i) => id === correctOrder[i]).length;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    setOrder((o) => arrayMove(o, from, to));
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    move(order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id)));
  };

  const answered = Object.keys(answers).length;
  const taskScore = TASKS.filter((t) => answers[t.id] === t.answer).length;

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-ink">1. Broadest at the top</h3>
          <span className="text-xs text-ink-3">Drag or use the arrows</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">
              {order.map((id, i) => (
                <SortableLevel key={id} card={byId[id]} index={i} total={order.length} checked={checked} correct={id === correctOrder[i]} onMove={move} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <div className="mt-3 flex items-center gap-2">
          {!checked ? (
            <Button size="sm" onClick={() => setChecked(true)}>
              Check order
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw className="size-3.5" />}
              onClick={() => {
                setChecked(false);
                if (allCorrect) setOrder(START);
              }}
            >
              {allCorrect ? 'Start again' : 'Try again'}
            </Button>
          )}
          {checked && (
            <span className={cn('text-[13px] font-medium', allCorrect ? 'text-success-700' : 'text-warning-700')} aria-live="polite">
              {allCorrect ? 'Perfect — that is the Azure hierarchy.' : `${score} of 5 in the right place.`}
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-ink">2. Which level would you use?</h3>
          {answered > 0 && (
            <span className="text-xs text-ink-3 tabular" aria-live="polite">
              {taskScore}/{answered} correct
            </span>
          )}
        </div>
        <ul className="space-y-3">
          {TASKS.map((t) => {
            const chosen = answers[t.id];
            return (
              <li key={t.id} className="rounded-xl border border-line bg-surface p-3">
                <p className="text-[13.5px] leading-snug font-medium text-ink">{t.task}</p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Choose a level">
                  {LEVELS.map((l) => {
                    const isChosen = chosen === l.id;
                    const isAnswer = t.answer === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        disabled={!!chosen}
                        onClick={() => setAnswers((a) => ({ ...a, [t.id]: l.id }))}
                        className={cn(
                          'rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-default',
                          !chosen && 'border-line text-ink-2 hover:border-brand-300 hover:bg-brand-25',
                          chosen && isAnswer && 'border-success-600 bg-success-600 text-white',
                          chosen && isChosen && !isAnswer && 'border-danger-500 bg-danger-500 text-white',
                          chosen && !isChosen && !isAnswer && 'border-line text-ink-4',
                        )}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
                {chosen && (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                    <span className={cn('font-semibold', chosen === t.answer ? 'text-success-700' : 'text-danger-700')}>
                      {chosen === t.answer ? 'Correct. ' : `Better: ${byId[t.answer].name}. `}
                    </span>
                    {t.why}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {answered > 0 && (
          <button type="button" onClick={() => setAnswers({})} className="mt-2 text-xs font-semibold text-brand-700 hover:underline">
            Reset scenarios
          </button>
        )}
      </div>
    </div>
  );
}
