import { useMemo } from 'react';
import type { DomainId } from '@/content/schema';
import { computeReadiness } from '@/engine/readiness';
import { conceptMastery, skillMastery } from '@/engine/mastery';
import { QUESTION_FACTS } from '@/content/questions';
import { LESSONS } from '@/content/curriculum';
import { EXAM_DOMAINS } from '@/content/exam';
import { CARD_DOMAIN } from '@/content/flashcards';
import { TROUBLE_DOMAIN } from '@/content/trouble';
import { DESIGN_DOMAINS } from '@/content/design';
import { useLearner } from '@/store/learner';

export const LESSON_SKILLS: Record<string, string[]> = Object.fromEntries(LESSONS.map((l) => [l.id, l.skills]));

export const SKILLS_BY_DOMAIN = Object.fromEntries(
  EXAM_DOMAINS.map((d) => [d.id, d.groups.flatMap((g) => g.skills.map((s) => s.id))]),
) as Record<DomainId, string[]>;

export function useReadiness() {
  const attempts = useLearner((s) => s.attempts);
  const lessons = useLearner((s) => s.lessons);
  const srs = useLearner((s) => s.srs);
  const mocks = useLearner((s) => s.mocks);
  const trouble = useLearner((s) => s.trouble);
  const design = useLearner((s) => s.design);

  return useMemo(
    () =>
      computeReadiness({
        now: Date.now(),
        attempts,
        lessons,
        srs,
        mocks,
        trouble,
        design,
        questionFacts: QUESTION_FACTS,
        lessonSkills: LESSON_SKILLS,
        skillsByDomain: SKILLS_BY_DOMAIN,
        cardDomain: CARD_DOMAIN,
        troubleDomain: TROUBLE_DOMAIN,
        designDomains: DESIGN_DOMAINS,
      }),
    [attempts, lessons, srs, mocks, trouble, design],
  );
}

export function useMastery() {
  const attempts = useLearner((s) => s.attempts);
  return useMemo(() => {
    const now = Date.now();
    return { concepts: conceptMastery(attempts, QUESTION_FACTS, now), skills: skillMastery(attempts, QUESTION_FACTS, now) };
  }, [attempts]);
}
