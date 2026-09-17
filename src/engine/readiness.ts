import type { DomainId } from '@/content/schema';
import type { Attempt, LessonProgress, MockResult } from '@/store/learner';
import { difficultyWeight, recencyWeight, weightedAccuracy, type QuestionFacts } from './mastery';
import { retrievability, type SrsCard } from './srs';

/**
 * Exam readiness engine
 * ---------------------------------------------------------------------------
 * Readiness is NOT lesson completion. Each domain combines:
 *   accuracy  (40%) recency- and difficulty-weighted practice accuracy
 *   scenario  (25%) accuracy on scenario, troubleshooting, architecture,
 *                   "first step" and multi-step questions + simulations
 *   retention (15%) flashcard recall probability (spaced repetition)
 *   coverage  (20%) skills with evidence: a lesson gives at most 30% of a
 *                   skill's coverage — the rest requires answering questions
 * and is scaled by an evidence factor that grows with the number of attempts,
 * so opening every page without practising stays near the bottom.
 * Mock exams then anchor the overall score, and "Exam ready" requires a
 * recent mock exam at or above the target.
 */

export const DOMAIN_WEIGHTS: Record<DomainId, number> = {
  'identity-governance': 22.5,
  storage: 17.5,
  compute: 22.5,
  networking: 17.5,
  monitoring: 12.5,
};

const SCENARIO_KINDS = new Set(['scenario', 'troubleshooting', 'architecture', 'first-step', 'multi-step']);

export interface ReadinessInput {
  now: number;
  attempts: Attempt[];
  lessons: Record<string, LessonProgress>;
  srs: Record<string, SrsCard>;
  mocks: MockResult[];
  trouble: Record<string, { score: number }>;
  design: Record<string, { score: number; max: number }>;
  questionFacts: Record<string, QuestionFacts>;
  lessonSkills: Record<string, string[]>;
  skillsByDomain: Record<DomainId, string[]>;
  cardDomain: Record<string, DomainId | 'foundations'>;
  troubleDomain: Record<string, DomainId>;
  designDomains: Record<string, DomainId[]>;
}

export interface DomainReadiness {
  domain: DomainId;
  score: number;
  accuracy: number;
  scenario: number;
  retention: number;
  coverage: number;
  evidence: number;
  attempts: number;
}

export type ReadinessBand = 'starting' | 'building' | 'approaching' | 'ready';

export interface Readiness {
  score: number;
  band: ReadinessBand;
  domains: DomainReadiness[];
  latestMock?: { percent: number; at: number };
  practiceScore: number;
  notes: string[];
}

export const READY_TARGET = 0.75;

export function evidenceFactor(attempts: number): number {
  return 1 - Math.exp(-attempts / 15);
}

export function computeReadiness(input: ReadinessInput): Readiness {
  const { now, attempts, questionFacts } = input;
  const domains = Object.keys(DOMAIN_WEIGHTS) as DomainId[];

  const completedLessons = Object.entries(input.lessons).filter(([, p]) => p.completedAt);
  const skillLesson = new Set<string>();
  for (const [lessonId] of completedLessons) for (const s of input.lessonSkills[lessonId] ?? []) skillLesson.add(s);

  const skillAttempts = new Map<string, { n: number; correct: number }>();
  for (const a of attempts) {
    const f = questionFacts[a.questionId];
    if (!f) continue;
    for (const s of f.skills) {
      const cur = skillAttempts.get(s) ?? { n: 0, correct: 0 };
      cur.n += 1;
      cur.correct += a.correct ? 1 : 0;
      skillAttempts.set(s, cur);
    }
  }

  const results: DomainReadiness[] = domains.map((domain) => {
    const domainAttempts = attempts.filter((a) => questionFacts[a.questionId]?.domain === domain);

    const acc = weightedAccuracy(
      domainAttempts.map((a) => {
        const f = questionFacts[a.questionId];
        return { score: a.correct ? 1 : a.score * 0.4, weight: recencyWeight(a.at, now) * difficultyWeight(f.difficulty) };
      }),
      0.4,
      8,
    ).value;

    const scenarioItems = domainAttempts
      .filter((a) => SCENARIO_KINDS.has(questionFacts[a.questionId].kind))
      .map((a) => ({ score: a.correct ? 1 : 0, weight: recencyWeight(a.at, now) * 1.2 }));
    for (const [id, r] of Object.entries(input.trouble)) {
      if (input.troubleDomain[id] === domain) scenarioItems.push({ score: r.score, weight: 2 });
    }
    for (const [id, r] of Object.entries(input.design)) {
      if ((input.designDomains[id] ?? []).includes(domain) && r.max > 0) {
        scenarioItems.push({ score: r.score / r.max, weight: 1.5 });
      }
    }
    const scenario = weightedAccuracy(scenarioItems, 0.35, 5).value;

    const cards = Object.values(input.srs).filter((c) => input.cardDomain[c.id] === domain && c.last);
    const retention = cards.length
      ? cards.reduce((sum, c) => sum + retrievability(c, now), 0) / cards.length
      : 0.5 * acc;

    const skills = input.skillsByDomain[domain] ?? [];
    const coverage = skills.length
      ? skills.reduce((sum, s) => {
          const lessonPart = skillLesson.has(s) ? 0.3 : 0;
          const practice = skillAttempts.get(s);
          const practicePart = practice ? Math.min(0.7, practice.n * 0.25 + practice.correct * 0.1) : 0;
          return sum + Math.min(1, lessonPart + practicePart);
        }, 0) / skills.length
      : 0;

    const evidence = evidenceFactor(domainAttempts.length);
    const raw = 0.4 * acc + 0.25 * scenario + 0.15 * retention + 0.2 * coverage;
    // Without a single answered question there is no evidence of exam ability:
    // only lesson coverage counts, and it counts for very little.
    const score = domainAttempts.length === 0 ? 0.2 * coverage * 0.35 : raw * (0.35 + 0.65 * evidence);

    return { domain, score, accuracy: acc, scenario, retention, coverage, evidence, attempts: domainAttempts.length };
  });

  const totalWeight = domains.reduce((s, d) => s + DOMAIN_WEIGHTS[d], 0);
  const practiceScore = results.reduce((s, r) => s + r.score * DOMAIN_WEIGHTS[r.domain], 0) / totalWeight;

  const notes: string[] = [];
  const recentMocks = input.mocks.filter((m) => now - m.finishedAt < 30 * 86_400_000);
  const latest = input.mocks.length ? input.mocks[input.mocks.length - 1] : undefined;

  let score = practiceScore;
  if (recentMocks.length) {
    const lastTwo = recentMocks.slice(-2);
    const mockAvg = lastTwo.reduce((s, m) => s + m.percent, 0) / lastTwo.length;
    score = 0.65 * practiceScore + 0.35 * mockAvg;
  } else {
    score = Math.min(score, 0.72);
    if (practiceScore > 0.6) notes.push('Take a mock exam — readiness is capped until you do.');
  }

  const weakest = results.reduce((min, r) => (r.score < min.score ? r : min), results[0]);
  if (weakest && weakest.score < 0.45 && score > 0.55) {
    score -= 0.05;
    notes.push(`${weakest.domain} is holding your overall readiness back.`);
  }
  score = Math.max(0, Math.min(1, score));

  const hasQualifyingMock = recentMocks.some((m) => m.percent >= READY_TARGET);
  let band: ReadinessBand;
  if (score >= READY_TARGET && hasQualifyingMock) band = 'ready';
  else if (score >= 0.55) band = 'approaching';
  else if (score >= 0.3) band = 'building';
  else band = 'starting';

  return {
    score,
    band,
    domains: results,
    latestMock: latest ? { percent: latest.percent, at: latest.finishedAt } : undefined,
    practiceScore,
    notes,
  };
}

export const BAND_COPY: Record<ReadinessBand, { label: string; description: string }> = {
  starting: { label: 'Getting started', description: 'Learn the foundations and start answering questions to build evidence.' },
  building: { label: 'Building knowledge', description: 'Keep practising scenario questions and close gaps in weaker domains.' },
  approaching: { label: 'Approaching readiness', description: 'Strengthen weak concepts and validate with a timed mock exam.' },
  ready: { label: 'Exam ready', description: 'Consistent, recent performance across domains, confirmed by a mock exam.' },
};
