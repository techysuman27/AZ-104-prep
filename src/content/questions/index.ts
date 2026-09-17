import type { DomainId, Question } from '../schema';
import type { QuestionFacts } from '@/engine/mastery';
import { IDENTITY_QUESTIONS } from './identity';
import { GOVERNANCE_QUESTIONS } from './governance';
import { STORAGE_QUESTIONS } from './storage';
import { NETWORKING_QUESTIONS } from './networking';
import { COMPUTE_QUESTIONS } from './compute';
import { APP_QUESTIONS } from './apps-containers';
import { MONITORING_QUESTIONS } from './monitoring';
import { BACKUP_QUESTIONS } from './backup';

export const QUESTIONS: Question[] = [
  ...IDENTITY_QUESTIONS,
  ...GOVERNANCE_QUESTIONS,
  ...STORAGE_QUESTIONS,
  ...NETWORKING_QUESTIONS,
  ...COMPUTE_QUESTIONS,
  ...APP_QUESTIONS,
  ...MONITORING_QUESTIONS,
  ...BACKUP_QUESTIONS,
];

export const QUESTION_INDEX: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export const QUESTION_FACTS: Record<string, QuestionFacts> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, { domain: q.domain, kind: q.kind, difficulty: q.difficulty, skills: q.skills, concepts: q.concepts }]),
);

export function questionsByDomain(domain: DomainId): Question[] {
  return QUESTIONS.filter((q) => q.domain === domain);
}

/** Questions relevant to a set of skills and concepts, most relevant first. */
export function relevantQuestions({ skills = [], concepts = [] }: { skills?: string[]; concepts?: string[] }): Question[] {
  const s = new Set(skills);
  const c = new Set(concepts);
  return QUESTIONS.map((q) => ({
    q,
    score: q.skills.filter((x) => s.has(x)).length * 2 + q.concepts.filter((x) => c.has(x)).length,
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.q.difficulty - b.q.difficulty)
    .map((x) => x.q);
}

export function questionsForConcept(conceptId: string): Question[] {
  return QUESTIONS.filter((q) => q.concepts.includes(conceptId));
}
