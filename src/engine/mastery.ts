import type { DomainId, QuestionKind } from '@/content/schema';
import type { Attempt } from '@/store/learner';

export interface QuestionFacts {
  domain: DomainId;
  kind: QuestionKind;
  difficulty: 1 | 2 | 3;
  skills: string[];
  concepts: string[];
}

export type MasteryState = 'unseen' | 'learning' | 'practicing' | 'strong' | 'mastered';

export interface MasteryStat {
  attempts: number;
  correct: number;
  last: number;
  /** 0..1 — recency- and difficulty-weighted accuracy, shrunk toward a prior. */
  mastery: number;
  state: MasteryState;
}

export const HALF_LIFE_DAYS = 21;
const DAY = 86_400_000;

export function recencyWeight(at: number, now: number): number {
  const ageDays = Math.max(0, (now - at) / DAY);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

export function difficultyWeight(d: 1 | 2 | 3): number {
  return 1 + 0.35 * (d - 1);
}

/**
 * Weighted accuracy with Bayesian shrinkage: with little evidence the value
 * stays near `prior`, so one lucky answer never looks like mastery.
 */
export function weightedAccuracy(
  items: { score: number; weight: number }[],
  prior: number,
  pseudoCount: number,
): { value: number; weight: number } {
  let sw = 0;
  let sx = 0;
  for (const it of items) {
    sw += it.weight;
    sx += it.weight * it.score;
  }
  return { value: (sx + prior * pseudoCount) / (sw + pseudoCount), weight: sw };
}

export function stateFor(mastery: number, attempts: number): MasteryState {
  if (attempts === 0) return 'unseen';
  if (mastery >= 0.85 && attempts >= 5) return 'mastered';
  if (mastery >= 0.72 && attempts >= 3) return 'strong';
  if (mastery >= 0.5) return 'practicing';
  return 'learning';
}

function accumulate(
  keysFor: (f: QuestionFacts) => string[],
  attempts: Attempt[],
  facts: Record<string, QuestionFacts>,
  now: number,
): Record<string, MasteryStat> {
  const buckets = new Map<string, { items: { score: number; weight: number }[]; attempts: number; correct: number; last: number }>();
  for (const a of attempts) {
    const f = facts[a.questionId];
    if (!f) continue;
    const w = recencyWeight(a.at, now) * difficultyWeight(f.difficulty);
    for (const key of keysFor(f)) {
      const b = buckets.get(key) ?? { items: [], attempts: 0, correct: 0, last: 0 };
      b.items.push({ score: a.correct ? 1 : a.score * 0.5, weight: w });
      b.attempts += 1;
      b.correct += a.correct ? 1 : 0;
      b.last = Math.max(b.last, a.at);
      buckets.set(key, b);
    }
  }
  const out: Record<string, MasteryStat> = {};
  for (const [key, b] of buckets) {
    const { value } = weightedAccuracy(b.items, 0.4, 2);
    out[key] = { attempts: b.attempts, correct: b.correct, last: b.last, mastery: value, state: stateFor(value, b.attempts) };
  }
  return out;
}

export function conceptMastery(attempts: Attempt[], facts: Record<string, QuestionFacts>, now = Date.now()) {
  return accumulate((f) => f.concepts, attempts, facts, now);
}

export function skillMastery(attempts: Attempt[], facts: Record<string, QuestionFacts>, now = Date.now()) {
  return accumulate((f) => f.skills, attempts, facts, now);
}

/** Concepts the learner has practised but keeps missing, weakest first. */
export function weakConcepts(stats: Record<string, MasteryStat>, limit = 6): { id: string; stat: MasteryStat }[] {
  return Object.entries(stats)
    .filter(([, s]) => s.attempts >= 2 && s.mastery < 0.6)
    .sort((a, b) => (1 - b[1].mastery) * Math.log(b[1].attempts + 1) - (1 - a[1].mastery) * Math.log(a[1].attempts + 1))
    .slice(0, limit)
    .map(([id, stat]) => ({ id, stat }));
}

/** Questions answered incorrectly at least once and not answered correctly since. */
export function missedQuestions(attempts: Attempt[]): string[] {
  const lastResult = new Map<string, boolean>();
  for (const a of attempts) lastResult.set(a.questionId, a.correct);
  return [...lastResult.entries()].filter(([, ok]) => !ok).map(([id]) => id);
}
