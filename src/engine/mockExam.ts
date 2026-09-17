import type { DomainId, Question } from '@/content/schema';
import { createRng, shuffle } from '@/lib/random';
import { DOMAIN_WEIGHTS } from './readiness';

export type Blueprint = 'full' | 'half' | 'quick';

export const BLUEPRINTS: Record<Blueprint, { questions: number; minutes: number; label: string; description: string }> = {
  full: {
    questions: 50,
    minutes: 100,
    label: 'Full mock exam',
    description: '50 questions in 100 minutes, weighted like the real skills outline.',
  },
  half: { questions: 25, minutes: 50, label: 'Half mock', description: '25 questions in 50 minutes.' },
  quick: { questions: 12, minutes: 20, label: 'Quick check', description: '12 mixed questions in 20 minutes.' },
};

/** Largest-remainder allocation of question counts by domain weight. */
export function allocateByWeight(total: number, available: Record<DomainId, number>): Record<DomainId, number> {
  const domains = Object.keys(DOMAIN_WEIGHTS) as DomainId[];
  const weightSum = domains.reduce((s, d) => s + DOMAIN_WEIGHTS[d], 0);
  const exact = domains.map((d) => ({ d, exact: (total * DOMAIN_WEIGHTS[d]) / weightSum }));
  const alloc = Object.fromEntries(exact.map((e) => [e.d, Math.floor(e.exact)])) as Record<DomainId, number>;
  let remaining = total - domains.reduce((s, d) => s + alloc[d], 0);
  const byRemainder = exact.sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
  for (const e of byRemainder) {
    if (remaining <= 0) break;
    alloc[e.d] += 1;
    remaining -= 1;
  }
  // Respect availability; redistribute any shortfall to domains with spare questions.
  let shortfall = 0;
  for (const d of domains) {
    if (alloc[d] > available[d]) {
      shortfall += alloc[d] - available[d];
      alloc[d] = available[d];
    }
  }
  for (const d of domains.sort((a, b) => DOMAIN_WEIGHTS[b] - DOMAIN_WEIGHTS[a])) {
    while (shortfall > 0 && alloc[d] < available[d]) {
      alloc[d] += 1;
      shortfall -= 1;
    }
  }
  return alloc;
}

/**
 * Assemble a mock exam: weighted by domain, mixed difficulty, diverse question
 * kinds, and biased away from questions seen in the last few mocks.
 */
export function assembleMockExam(
  questions: Question[],
  blueprint: Blueprint,
  seed: number,
  recentlySeen: Set<string> = new Set(),
): Question[] {
  const rng = createRng(seed);
  const total = Math.min(BLUEPRINTS[blueprint].questions, questions.length);
  const byDomain = new Map<DomainId, Question[]>();
  for (const q of questions) byDomain.set(q.domain, [...(byDomain.get(q.domain) ?? []), q]);

  const available = Object.fromEntries(
    (Object.keys(DOMAIN_WEIGHTS) as DomainId[]).map((d) => [d, byDomain.get(d)?.length ?? 0]),
  ) as Record<DomainId, number>;
  const alloc = allocateByWeight(total, available);

  const picked: Question[] = [];
  for (const [domain, count] of Object.entries(alloc) as [DomainId, number][]) {
    const pool = shuffle(byDomain.get(domain) ?? [], rng).sort(
      (a, b) => Number(recentlySeen.has(a.id)) - Number(recentlySeen.has(b.id)),
    );
    const chosen: Question[] = [];
    const kindCount = new Map<string, number>();
    const targetHard = Math.round(count * 0.3);
    const targetEasy = Math.round(count * 0.2);
    const diffCount = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;

    const score = (q: Question) => {
      let s = 0;
      s -= (kindCount.get(q.kind) ?? 0) * 2;
      if (q.difficulty === 3 && diffCount[3] < targetHard) s += 3;
      if (q.difficulty === 1 && diffCount[1] >= targetEasy) s -= 3;
      if (recentlySeen.has(q.id)) s -= 4;
      return s + rng();
    };

    const remaining = [...pool];
    while (chosen.length < count && remaining.length) {
      remaining.sort((a, b) => score(b) - score(a));
      const q = remaining.shift()!;
      chosen.push(q);
      kindCount.set(q.kind, (kindCount.get(q.kind) ?? 0) + 1);
      diffCount[q.difficulty] += 1;
    }
    picked.push(...chosen);
  }
  return shuffle(picked, rng);
}
