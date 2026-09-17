import type { Question } from '@/content/schema';

/**
 * Answer shapes per question format:
 *  single → string (option id)
 *  multi  → string[] (option ids)
 *  yesno  → Record<statementId, boolean>
 *  order  → string[] (item ids in learner order)
 *  match  → Record<promptId, choiceId>
 */
export type Answer = string | string[] | Record<string, boolean> | Record<string, string> | undefined;

export interface GradeResult {
  correct: boolean;
  /** Partial credit 0..1 — used for feedback and mastery, never to pass a question. */
  score: number;
  answered: boolean;
}

export function isAnswered(q: Question, answer: Answer): boolean {
  switch (q.format) {
    case 'single':
      return typeof answer === 'string' && answer.length > 0;
    case 'multi':
      return Array.isArray(answer) && answer.length > 0;
    case 'yesno':
      return (
        !!answer &&
        typeof answer === 'object' &&
        !Array.isArray(answer) &&
        q.statements.every((s) => typeof (answer as Record<string, boolean>)[s.id] === 'boolean')
      );
    case 'order':
      return Array.isArray(answer) && answer.length === q.items.length;
    case 'match':
      return (
        !!answer &&
        typeof answer === 'object' &&
        !Array.isArray(answer) &&
        q.prompts.every((p) => typeof (answer as Record<string, string>)[p.id] === 'string')
      );
  }
}

export function gradeQuestion(q: Question, answer: Answer): GradeResult {
  const answered = isAnswered(q, answer);
  switch (q.format) {
    case 'single': {
      const correctId = q.options.find((o) => o.correct)?.id;
      const correct = answer === correctId;
      return { correct, score: correct ? 1 : 0, answered };
    }
    case 'multi': {
      const selected = new Set(Array.isArray(answer) ? answer : []);
      const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
      const tp = correctIds.filter((id) => selected.has(id)).length;
      const fp = [...selected].filter((id) => !correctIds.includes(id)).length;
      const correct = tp === correctIds.length && fp === 0;
      const score = correctIds.length === 0 ? 0 : Math.max(0, (tp - fp) / correctIds.length);
      return { correct, score: correct ? 1 : score, answered };
    }
    case 'yesno': {
      const a = (answer ?? {}) as Record<string, boolean>;
      const right = q.statements.filter((s) => a[s.id] === s.answer).length;
      return { correct: right === q.statements.length, score: right / q.statements.length, answered };
    }
    case 'order': {
      const order = Array.isArray(answer) ? answer : [];
      const expected = q.items.map((i) => i.id);
      const correct = order.length === expected.length && order.every((id, i) => id === expected[i]);
      // Pairwise agreement: fraction of item pairs placed in the right relative order.
      const pos = new Map(order.map((id, i) => [id, i]));
      let agree = 0;
      let total = 0;
      for (let i = 0; i < expected.length; i++) {
        for (let j = i + 1; j < expected.length; j++) {
          total++;
          const pi = pos.get(expected[i]);
          const pj = pos.get(expected[j]);
          if (pi !== undefined && pj !== undefined && pi < pj) agree++;
        }
      }
      return { correct, score: correct ? 1 : total ? agree / total : 0, answered };
    }
    case 'match': {
      const a = (answer ?? {}) as Record<string, string>;
      const right = q.prompts.filter((p) => a[p.id] === p.answer).length;
      return { correct: right === q.prompts.length, score: right / q.prompts.length, answered };
    }
  }
}

export function correctCount(q: Question): number {
  if (q.format === 'multi') return q.options.filter((o) => o.correct).length;
  return 1;
}
