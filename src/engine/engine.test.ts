import { describe, expect, it } from 'vitest';
import type { DomainId, Question } from '@/content/schema';
import { gradeQuestion } from './grading';
import { DAY, reviewCard, retrievability } from './srs';
import { conceptMastery, missedQuestions, weakConcepts, type QuestionFacts } from './mastery';
import { computeReadiness, evidenceFactor, type ReadinessInput } from './readiness';
import { allocateByWeight, assembleMockExam } from './mockExam';
import type { Attempt } from '@/store/learner';

const base = {
  domain: 'networking' as DomainId,
  skills: ['nw.secure.nsg'],
  concepts: ['nsg'],
  kind: 'knowledge' as const,
  difficulty: 2 as const,
  stem: 'x',
  explanation: { correct: 'c', conceptTested: 't', realWorld: 'r' },
  sources: ['nsg-overview'],
};

describe('grading', () => {
  it('grades single choice', () => {
    const q: Question = {
      ...base,
      id: 's',
      format: 'single',
      options: [
        { id: 'a', text: 'A', correct: true, why: '' },
        { id: 'b', text: 'B', why: '' },
      ],
    };
    expect(gradeQuestion(q, 'a')).toMatchObject({ correct: true, score: 1 });
    expect(gradeQuestion(q, 'b')).toMatchObject({ correct: false, score: 0 });
  });

  it('gives partial credit for multi select but only passes exact matches', () => {
    const q: Question = {
      ...base,
      id: 'm',
      format: 'multi',
      options: [
        { id: 'a', text: 'A', correct: true, why: '' },
        { id: 'b', text: 'B', correct: true, why: '' },
        { id: 'c', text: 'C', why: '' },
      ],
    };
    expect(gradeQuestion(q, ['a', 'b']).correct).toBe(true);
    const partial = gradeQuestion(q, ['a']);
    expect(partial.correct).toBe(false);
    expect(partial.score).toBeCloseTo(0.5);
    expect(gradeQuestion(q, ['a', 'c']).score).toBe(0);
  });

  it('grades ordering with pairwise agreement', () => {
    const q: Question = {
      ...base,
      id: 'o',
      format: 'order',
      why: '',
      items: [
        { id: '1', text: 'one' },
        { id: '2', text: 'two' },
        { id: '3', text: 'three' },
      ],
    };
    expect(gradeQuestion(q, ['1', '2', '3']).correct).toBe(true);
    const swapped = gradeQuestion(q, ['2', '1', '3']);
    expect(swapped.correct).toBe(false);
    expect(swapped.score).toBeCloseTo(2 / 3);
  });

  it('grades yes/no and match questions per item', () => {
    const yn: Question = {
      ...base,
      id: 'y',
      format: 'yesno',
      statements: [
        { id: 's1', text: '', answer: true, why: '' },
        { id: 's2', text: '', answer: false, why: '' },
      ],
    };
    expect(gradeQuestion(yn, { s1: true, s2: false }).correct).toBe(true);
    expect(gradeQuestion(yn, { s1: true, s2: true }).score).toBe(0.5);

    const m: Question = {
      ...base,
      id: 'mt',
      format: 'match',
      choices: [
        { id: 'x', text: 'X' },
        { id: 'y', text: 'Y' },
      ],
      prompts: [
        { id: 'p1', text: '', answer: 'x', why: '' },
        { id: 'p2', text: '', answer: 'y', why: '' },
      ],
    };
    expect(gradeQuestion(m, { p1: 'x', p2: 'y' }).correct).toBe(true);
    expect(gradeQuestion(m, { p1: 'y', p2: 'y' }).score).toBe(0.5);
  });
});

describe('spaced repetition', () => {
  const now = Date.UTC(2026, 0, 1);
  it('grows intervals on success and resets on failure', () => {
    const c1 = reviewCard(undefined, 'c', 2, now);
    expect(c1.interval).toBe(1);
    const c2 = reviewCard(c1, 'c', 2, now + DAY);
    expect(c2.interval).toBe(6);
    const c3 = reviewCard(c2, 'c', 2, now + 7 * DAY);
    expect(c3.interval).toBeGreaterThan(6);
    const lapsed = reviewCard(c3, 'c', 0, now + 30 * DAY);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ease).toBeLessThan(c3.ease);
    expect(lapsed.interval).toBeLessThan(1);
  });

  it('models recall decay around 90% at the interval', () => {
    const c = reviewCard(undefined, 'c', 2, now);
    expect(retrievability(c, now + c.interval * DAY)).toBeCloseTo(0.9, 2);
    expect(retrievability(c, now + 10 * DAY)).toBeLessThan(0.5);
  });
});

const facts: Record<string, QuestionFacts> = {};
const domains: DomainId[] = ['identity-governance', 'storage', 'compute', 'networking', 'monitoring'];
domains.forEach((d) => {
  for (let i = 0; i < 40; i++) {
    facts[`${d}-${i}`] = {
      domain: d,
      kind: i % 3 === 0 ? 'scenario' : 'knowledge',
      difficulty: ((i % 3) + 1) as 1 | 2 | 3,
      skills: [`${d}.skill${i % 5}`],
      concepts: [`${d}-concept${i % 4}`],
    };
  }
});

function input(partial: Partial<ReadinessInput>): ReadinessInput {
  return {
    now: Date.UTC(2026, 5, 1),
    attempts: [],
    lessons: {},
    srs: {},
    mocks: [],
    trouble: {},
    design: {},
    questionFacts: facts,
    lessonSkills: Object.fromEntries(domains.map((d) => [`lesson-${d}`, [0, 1, 2, 3, 4].map((i) => `${d}.skill${i}`)])),
    skillsByDomain: Object.fromEntries(domains.map((d) => [d, [0, 1, 2, 3, 4].map((i) => `${d}.skill${i}`)])) as Record<
      DomainId,
      string[]
    >,
    cardDomain: {},
    troubleDomain: {},
    designDomains: {},
    ...partial,
  };
}

describe('readiness engine', () => {
  const now = Date.UTC(2026, 5, 1);

  it('keeps readiness low when lessons are complete but nothing is practised', () => {
    const lessons = Object.fromEntries(
      domains.map((d) => [`lesson-${d}`, { startedAt: now, lastVisited: now, sectionsSeen: [], completedAt: now }]),
    );
    const r = computeReadiness(input({ lessons }));
    expect(r.score).toBeLessThan(0.2);
    expect(r.band).toBe('starting');
  });

  it('rewards broad, accurate recent practice but caps without a mock exam', () => {
    const attempts: Attempt[] = Object.keys(facts).map((id, i) => ({
      questionId: id,
      correct: i % 10 !== 0,
      score: i % 10 !== 0 ? 1 : 0,
      at: now - DAY,
      mode: 'practice',
    }));
    const r = computeReadiness(input({ attempts }));
    expect(r.practiceScore).toBeGreaterThan(0.6);
    expect(r.score).toBeLessThanOrEqual(0.72);
    expect(r.band).not.toBe('ready');
  });

  it('only reports exam ready with a recent qualifying mock exam', () => {
    const attempts: Attempt[] = Object.keys(facts).flatMap((id) => [
      { questionId: id, correct: true, score: 1, at: now - DAY, mode: 'practice' as const },
      { questionId: id, correct: true, score: 1, at: now - 2 * DAY, mode: 'practice' as const },
    ]);
    const srs = Object.fromEntries(
      domains.map((d) => [`card-${d}`, { id: `card-${d}`, ease: 2.5, interval: 30, reps: 4, lapses: 0, due: now + 20 * DAY, last: now - DAY }]),
    );
    const cardDomain = Object.fromEntries(domains.map((d) => [`card-${d}`, d]));
    const byDomain = Object.fromEntries(domains.map((d) => [d, { correct: 9, total: 10 }])) as Record<
      DomainId,
      { correct: number; total: number }
    >;
    const mocks = [
      { id: 'm1', blueprint: 'full' as const, startedAt: now - DAY, finishedAt: now - DAY, durationMs: 1, questionIds: [], answers: {}, flagged: [], results: {}, byDomain, percent: 0.9 },
    ];
    const r = computeReadiness(input({ attempts, srs, cardDomain, mocks }));
    expect(r.score).toBeGreaterThan(0.75);
    expect(r.band).toBe('ready');
  });

  it('evidence grows with attempts', () => {
    expect(evidenceFactor(0)).toBe(0);
    expect(evidenceFactor(15)).toBeGreaterThan(0.6);
    expect(evidenceFactor(60)).toBeGreaterThan(0.95);
  });
});

describe('mastery', () => {
  const now = Date.UTC(2026, 5, 1);
  it('identifies weak concepts and missed questions', () => {
    const attempts: Attempt[] = [
      { questionId: 'networking-0', correct: false, score: 0, at: now, mode: 'practice' },
      { questionId: 'networking-4', correct: false, score: 0, at: now, mode: 'practice' },
      { questionId: 'networking-8', correct: false, score: 0, at: now, mode: 'practice' },
      { questionId: 'networking-1', correct: true, score: 1, at: now, mode: 'practice' },
    ];
    const stats = conceptMastery(attempts, facts, now);
    const weak = weakConcepts(stats);
    expect(weak[0].id).toBe('networking-concept0');
    expect(missedQuestions(attempts)).toContain('networking-0');
    expect(missedQuestions(attempts)).not.toContain('networking-1');
  });
});

describe('mock exam assembly', () => {
  it('allocates by domain weight and respects availability', () => {
    const alloc = allocateByWeight(50, {
      'identity-governance': 100,
      storage: 100,
      compute: 100,
      networking: 100,
      monitoring: 100,
    });
    expect(Object.values(alloc).reduce((a, b) => a + b, 0)).toBe(50);
    expect(alloc['identity-governance']).toBeGreaterThan(alloc.monitoring);

    const constrained = allocateByWeight(50, {
      'identity-governance': 100,
      storage: 100,
      compute: 100,
      networking: 100,
      monitoring: 2,
    });
    expect(constrained.monitoring).toBe(2);
    expect(Object.values(constrained).reduce((a, b) => a + b, 0)).toBe(50);
  });

  it('is deterministic for a seed and returns unique questions', () => {
    const qs: Question[] = Object.entries(facts).map(([id, f]) => ({
      ...base,
      ...f,
      id,
      format: 'single' as const,
      options: [{ id: 'a', text: 'a', correct: true, why: '' }],
    }));
    const a = assembleMockExam(qs, 'full', 42).map((q) => q.id);
    const b = assembleMockExam(qs, 'full', 42).map((q) => q.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(50);
  });
});
